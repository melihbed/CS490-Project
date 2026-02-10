const express = require("express");
const cors = require("cors");
const pool = require("./db/db");
const path = require("path"); // Add this at the top
const { error } = require("console");

const port = 3000;

const app = express();

// Middleware START
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/public")));
// Middleware END

// Routes START

// Create GET routes for the Top 5
app.get("/api/films/top-rented", async (req, res) => {
  try {
    const query = `
    SELECT
        f.film_id,
        f.title,
        c.name AS category,
        COUNT(DISTINCT r.rental_id) AS rental_count
    FROM film f
    JOIN inventory i 
        ON i.film_id = f.film_id
    JOIN rental r 
        ON r.inventory_id = i.inventory_id
    JOIN film_category fc 
        ON fc.film_id = f.film_id
    JOIN category c 
        ON c.category_id = fc.category_id
    GROUP BY
        f.film_id,
        f.title,
        c.name
    ORDER BY
        rental_count DESC
    LIMIT 5;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.log(err);
  }
});

// Create GET route for each film with film_id
app.get("/api/film/:id", async (req, res) => {
  try {
    console.log(req.host);
    const film_id = Number(req.params.id);

    if (isNaN(film_id)) {
      return res.status(400).json({ error: "Invalid film ID." });
    }

    const query = `
        SELECT
            f.film_id,
            f.title,
            f.release_year,
            f.description,
            f.rental_rate,
            f.rating,
            c.name AS category,
            COUNT(DISTINCT r.rental_id) AS rental_count
        FROM film f
        JOIN inventory i 
            ON i.film_id = f.film_id
        JOIN rental r 
            ON r.inventory_id = i.inventory_id
        JOIN film_category fc 
            ON fc.film_id = f.film_id
        JOIN category c 
            ON c.category_id = fc.category_id
        WHERE f.film_id = ?
        GROUP BY f.film_id, f.title, f.release_year, f.description, f.rental_rate, f.rating, c.name
    `;

    const rows = await pool.execute(query, [parseInt(film_id)]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Film not found. " });
    }
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Create GET route for top 5 actors
app.get("/api/top-actors", async (req, res) => {
  try {
    const query = `
        SELECT
            a.actor_id,
            a.first_name,
            a.last_name,
            COUNT(r.rental_id) AS rental_count
        FROM actor a
        JOIN film_actor fa
        ON fa.actor_id = a.actor_id
        JOIN inventory i
        ON i.film_id = fa.film_id
        JOIN rental r
        ON r.inventory_id = i.inventory_id
        GROUP BY a.actor_id, a.first_name, a.last_name
        ORDER BY rental_count DESC
        LIMIT 5;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/actor/:id", async (req, res) => {
  const actor_id = Number(req.params.id);
  if (isNaN(actor_id)) {
    return res.status(400).json({ error: "Invalid actor id." });
  }
  /*
    1- Write a proper query to fetch the data from the database.
    2- Execute the query in database and save the response to rows. 
    3- Return the response
   */
  try {
    const query = `
    SELECT 
        actor.actor_id,
        actor.first_name, 
        actor.last_name
    FROM actor
    WHERE actor_id = ?
    `;
    const rows = await pool.execute(query, [parseInt(actor_id)]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Actor not found!" });
    }
    console.log(rows);
    res.json(rows);
  } catch (err) {
    console.log("Error: ", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Actor's Top 5 Films
app.get("/api/actor/:id/top-films", async (req, res) => {
  const actor_id = req.params.id;

  try {
    const query = `
        SELECT
            f.film_id,
            f.title,
            COUNT(r.rental_id) AS rental_count
        FROM film_actor fa
        JOIN film f
            ON f.film_id = fa.film_id
        JOIN inventory i
            ON i.film_id = f.film_id
        JOIN rental r
            ON r.inventory_id = i.inventory_id
        WHERE fa.actor_id = ?
        GROUP BY f.film_id, f.title
        ORDER BY rental_count DESC
        LIMIT 5;
    
    `;
    const rows = await pool.execute(query, [parseInt(actor_id)]);
    res.json(rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/films", async (req, res) => {
  try {
    // pagination
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const offset = (page - 1) * limit;

    // search
    const type = (req.query.type || "title").toLowerCase(); // title|actor|genre
    const q = (req.query.q || "").trim();
    const like = `%${q}%`;

    if (!["title", "actor", "genre"].includes(type)) {
      return res.status(400).json({ error: "type must be title|actor|genre" });
    }

    // Build WHERE clause
    let whereSql = "";
    const whereParams = [];

    if (q) {
      if (type === "title") {
        whereSql = "WHERE f.title LIKE ?";
        whereParams.push(like);
      } else if (type === "actor") {
        whereSql = `
          WHERE EXISTS (
            SELECT 1
            FROM film_actor fa2
            JOIN actor a2 ON a2.actor_id = fa2.actor_id
            WHERE fa2.film_id = f.film_id
              AND CONCAT(a2.first_name, ' ', a2.last_name) LIKE ?
          )
        `;
        whereParams.push(like);
      } else if (type === "genre") {
        whereSql = `
          WHERE EXISTS (
            SELECT 1
            FROM film_category fc2
            JOIN category c2 ON c2.category_id = fc2.category_id
            WHERE fc2.film_id = f.film_id
              AND c2.name LIKE ?
          )
        `;
        whereParams.push(like);
      }
    }

    // total count for pagination UI
    const countSql = `
      SELECT COUNT(*) AS total
      FROM film f
      ${whereSql}
    `;
    const [countRows] = await pool.query(countSql, whereParams);
    const total = countRows[0]?.total ?? 0;

    // data page (always includes genres + actors)
    const dataSql = `
      SELECT
        f.film_id,
        f.title,
        f.description,
        f.release_year,
        f.special_features,
        f.rental_rate,
        f.rating,
        GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS genres,
        GROUP_CONCAT(
          DISTINCT CONCAT(a.first_name, ' ', a.last_name)
          ORDER BY a.last_name, a.first_name
          SEPARATOR ', '
        ) AS actors
      FROM film f
      LEFT JOIN film_category fc ON fc.film_id = f.film_id
      LEFT JOIN category c ON c.category_id = fc.category_id
      LEFT JOIN film_actor fa ON fa.film_id = f.film_id
      LEFT JOIN actor a ON a.actor_id = fa.actor_id
      ${whereSql}
      GROUP BY
        f.film_id, f.title, f.description, f.release_year,
        f.special_features, f.rental_rate, f.rating
      ORDER BY f.title ASC, f.film_id ASC
      LIMIT ? OFFSET ?;
    `;

    const [rows] = await pool.query(dataSql, [...whereParams, limit, offset]);

    res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items: rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get("/api/customers", async (req, res) => {
  try {
    // Get the page parameter from the URL query string (if no page, default 1)
    const page = req.query.page || 1;
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 100);
    const offset = (page - 1) * limit;

    // Customer Search (id, first name or last name)
    // /api/customers?id=1?f
    const q = (req.query.q || "").trim();

    // Build where clause
    let whereSql = "";
    const whereParams = [];

    if (q && !isNaN(q)) {
      like = `${q}%`;
      whereSql = `
        WHERE c.customer_id LIKE ?
      `;
      whereParams.push(like);
    } else {
      like = `%${q}%`;
      whereSql = `
      WHERE CONCAT (c.first_name, ' ', c.last_name) LIKE ?
    `;
      whereParams.push(like);
    }

    // Get total count of customers
    const totalCountSql = `
      SELECT COUNT(*) AS total
      FROM customer c 
      ${whereSql}
    `;

    const [countRows] = await pool.query(totalCountSql, whereParams);
    const total = countRows[0].total;
    if (!total) total = 0;

    // Get customer data
    const dataSql = `
    SELECT
      c.customer_id,
      c.first_name,
      c.last_name,
      c.email,
      c.active,
      c.create_date,
      a.address,
      a.district,
      ci.city,
      co.country
    FROM customer c
    LEFT JOIN address a ON a.address_id = c.address_id
    LEFT JOIN city ci ON ci.city_id = a.city_id
    LEFT JOIN country co ON co.country_id = ci.country_id
    ${whereSql}
    ORDER BY c.first_name ASC, c.last_name ASC
    LIMIT ? OFFSET ?
  `;

    const [rows] = await pool.query(dataSql, [...whereParams, limit, offset]);

    res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items: rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ Error: "Internal Server Error!" });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      address,
      district,
      city, // City NAME (not ID)
      country, // Country NAME (not ID)
      postal_code,
      phone,
    } = req.body;

    // Validate the given fields
    if (!first_name || !last_name || !email || !address || !city || !country) {
      return res.status(400).json({
        error: "Fill out the required fields!",
      });
    }

    // Validate the email address
    const emailValidationRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailValidationRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Check if the customer already exists
    const checkEmailSql = `SELECT customer_id 
    FROM customer WHERE email = ?
  `;

    const [existingCustomer] = await pool.query(checkEmailSql, [email]);

    if (existingCustomer.length > 0) {
      return res.status(409).json({ error: "Email already exists!" });
    }

    let country_id;
    // Find a country_id from given country
    const findCountrySql = `
    Select country_id from country
    where country = ?;
    `;

    const [countryRows] = await pool.query(findCountrySql, [country]);
    console.log(countryRows);

    if (countryRows.length > 0) {
      country_id = countryRows[0].country_id;
    } else {
      res.status(409).json({ error: "The country doesn't exist." });
    }

    // Find a city_id from given city
    let city_id;
    const findCitySql = `SELECT city_id FROM city WHERE city = ? AND country_id = ?`;
    const [cityRows] = await pool.query(findCitySql, [city, country_id]);

    if (cityRows.length > 0) {
      city_id = cityRows[0].city_id;
    } else {
      // Create a new city if it doesn't exist
      const insertCitySql = `
        INSERT INTO city (city, country_id) VALUES (?, ?)
      `;
      const [cityResult] = await pool.execute(insertCitySql, [
        city,
        country_id,
      ]);
      city_id = cityResult.insertId;
    }

    // Insert address
    const addressSql = `
      INSERT INTO address (address, district, city_id, postal_code, phone, location)
      VALUES (?, ?, ?, ?, ?, POINT(0, 0))
    `;

    const [addressResult] = await pool.execute(addressSql, [
      address,
      district,
      city_id,
      postal_code,
      phone,
    ]);
    const new_address_id = addressResult.insertId;

    // Add a customer
    const customerSql = `
    INSERT INTO customer (
      first_name, 
      last_name, 
      email, 
      address_id, 
      store_id,
      active,
      create_date
    )
    VALUES (?, ?, ?, ?, 1, 1, NOW())
  `;
    const [customerResult] = await pool.execute(customerSql, [
      first_name,
      last_name,
      email,
      new_address_id,
    ]);

    // Success Response
    res.status(201).json({
      message: "Customer created successfully",
      customer_id: customerResult.insertId,
      first_name,
      last_name,
      email,
      city,
      country,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal Server Error.");
  }
});
// Routes END

// This should be at the very bottom of your app.js, after all other routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found. Check your URL in Postman!",
  });
});

app.listen(port, () => {
  console.log("Server listening on port:" + port);
});

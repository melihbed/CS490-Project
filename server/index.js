const express = require("express");
const cors = require("cors");
const pool = require("./db/db");

const port = 4000;

const app = express();

// Middleware START
// Log and guard large request headers to help diagnose 431 errors

app.use(cors());
app.use(express.json());

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
        actor.last_name,
        COUNT(r.rental_id) AS rental_count
    FROM actor
    JOIN film_actor fa
        ON fa.actor_id = actor.actor_id
    JOIN inventory i
        ON i.film_id = fa.film_id
    JOIN rental r
        ON r.inventory_id = i.inventory_id
    WHERE actor.actor_id = ?
    GROUP BY actor.actor_id, actor.first_name, actor.last_name
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
      c.store_id,
      a.address,
      a.district,
      a.phone,
      a.postal_code,
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
  const conn = await pool.getConnection();

  const norm = (v) => (v === undefined ? null : v);
  const str = (v, fallback = "") => {
    if (v === undefined || v === null) return fallback;
    return String(v).trim();
  };

  const execSafe = async (sql, params, tag) => {
    const badIdx = params.findIndex((p) => p === undefined);
    if (badIdx !== -1) {
      throw new Error(`${tag}: param[${badIdx}] is undefined`);
    }
    return conn.execute(sql, params.map(norm));
  };

  try {
    const first_name = str(req.body.first_name);
    const last_name = str(req.body.last_name);
    const email = str(req.body.email);
    const address = str(req.body.address);

    // accept multiple key names from UI
    const cityName = str(req.body.city ?? req.body.city_name);
    const countryName = str(req.body.country ?? req.body.country_name);

    const district = str(req.body.district, "N/A");
    const phone = str(req.body.phone, "N/A");
    const postal_code = str(req.body.postal_code, "") || null;

    const store_id = Number(req.body.store_id);

    if (
      !first_name ||
      !last_name ||
      !email ||
      !address ||
      !cityName ||
      !countryName ||
      !Number.isInteger(store_id)
    ) {
      return res
        .status(400)
        .json({ error: "Missing/invalid required fields." });
    }

    await conn.beginTransaction();

    let country_id;
    const [countryRows] = await execSafe(
      "SELECT country_id FROM country WHERE country = ?",
      [countryName],
      "select-country"
    );
    if (countryRows.length) {
      country_id = countryRows[0].country_id;
    } else {
      const [insCountry] = await execSafe(
        "INSERT INTO country (country, last_update) VALUES (?, NOW())",
        [countryName],
        "insert-country"
      );
      country_id = insCountry.insertId;
    }

    let city_id;
    const [cityRows] = await execSafe(
      "SELECT city_id FROM city WHERE city = ? AND country_id = ?",
      [cityName, country_id],
      "select-city"
    );
    if (cityRows.length) {
      city_id = cityRows[0].city_id;
    } else {
      const [insCity] = await execSafe(
        "INSERT INTO city (city, country_id, last_update) VALUES (?, ?, NOW())",
        [cityName, country_id],
        "insert-city"
      );
      city_id = insCity.insertId;
    }

    const [insAddress] = await execSafe(
      `INSERT INTO address (address, district, city_id, postal_code, phone, location, last_update)
       VALUES (?, ?, ?, ?, ?, POINT(0,0), NOW())`,
      [address, district, city_id, postal_code, phone],
      "insert-address"
    );
    const address_id = insAddress.insertId;

    const [insCustomer] = await execSafe(
      `INSERT INTO customer (store_id, first_name, last_name, email, address_id, active, create_date, last_update)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [store_id, first_name, last_name, email, address_id],
      "insert-customer"
    );

    await conn.commit();
    return res.status(201).json({
      customer_id: insCustomer.insertId,
      address_id,
      city_id,
      country_id,
    });
  } catch (err) {
    await conn.rollback();
    console.log("POST /api/customers error:", err.message, err);
    return res
      .status(500)
      .json({ error: err.message || "Internal Server Error." });
  } finally {
    conn.release();
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    // To get the id from the URL
    const id = req.params.id;
    // To get the udpated customer data from the frontend
    const body = req.body;

    console.log(id);
    console.log(body);

    const sql = `
      UPDATE customer
      SET first_name = ?, last_name = ?, email = ?, store_id = ?
      WHERE customer_id = ?
    `;
    await pool.query(sql, [
      body.first_name,
      body.last_name,
      body.email,
      body.store_id,
      id,
    ]);
    // Get the address_id of the customer to upadate the address table
    const [customer] = await pool.query(
      `SELECT address_id FROM customer WHERE customer_id = ?`,
      [id]
    );
    const address_id = customer[0].address_id;

    await pool.query(
      `UPDATE address
      SET phone = ?,
          district = ?,
          postal_code = ?,
          address = ?
      WHERE address_id = ?`,
      [body.phone, body.district, body.postal_code, body.address, address_id]
    );

    res.json({ message: "Customer updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const sql = `
      DELETE FROM customer WHERE customer_id = ?;
    `;
    await pool.query(sql, [id]);

    res.json({ message: "Successfully deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

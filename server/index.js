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
app.use(express.static(path.join(__dirname, "../client/src")));
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

    // Build WHERE clause (use EXISTS for actor/genre so we still list ALL actors/genres)
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

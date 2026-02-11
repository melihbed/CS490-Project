const sql = require('../configs/db');

exports.getCustomers = (req, res) => {
    const query = `
        SELECT
            c.customer_id,
            c.first_name,
            c.last_name,
            c.email,
            a.address,
            ci.city,
            co.country
        FROM customer c
        JOIN address a ON c.address_id = a.address_id
        JOIN city ci ON a.city_id = ci.city_id
        JOIN country co ON ci.country_id = co.country_id
        LIMIT 100;
    `;

    sql.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching customers:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        console.log('Customers results:', results);
        res.json(results);
    });
}

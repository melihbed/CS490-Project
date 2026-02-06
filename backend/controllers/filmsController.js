const sql = require('../configs/db');

exports.top5Films = (req, res) => {
    const query = `
        SELECT 
    f.title,
    c.name AS category,
    COUNT(r.rental_id) AS rental_count
FROM rental r
JOIN inventory i 
    ON r.inventory_id = i.inventory_id
JOIN film f 
    ON i.film_id = f.film_id
JOIN film_category fc 
    ON f.film_id = fc.film_id
JOIN category c 
    ON fc.category_id = c.category_id
GROUP BY f.film_id, c.name
ORDER BY rental_count DESC
LIMIT 5;
    `;

    sql.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching top 5 films:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        //console.log('Top 5 films results:', results);
        res.json(results);
        
    });
}
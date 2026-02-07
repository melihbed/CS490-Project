import {Card} from 'react-bootstrap'
import { useState, useEffect } from 'react';
import axios from 'axios';


function Landing() {
    const [films, setFilms] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/')
            .then(response => {
                
                setFilms(response.data);
            })
            .catch(error => {
                console.error('Error fetching films:', error);
            });
    }, []);




    return (
        <div>
            <h1>Welcome to the Landing Page!</h1>
            <div className="film-cards" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {films.map(film => (
                    <Card key={film.film_id} style={{ width: '18rem' , border: '1px solid #ccc', borderRadius: '8px'}}>
                        <Card.Body>
                            <Card.Title>{film.title}</Card.Title>
                            <Card.Text>{film.category}</Card.Text>
                        </Card.Body>
                        <Card.Footer>
                            Rentals: {film.rental_count}
                        </Card.Footer>
                    </Card>
                ))}
            </div>
        </div>
        
    );
}

export default Landing;
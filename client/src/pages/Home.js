import React, { useEffect, useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Home() {
  const [films, setFilms] = useState([]);
  const [actors, setActors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const f = await api.get('/api/films/top-rented');
        setFilms(f);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchActors = async () => {
      try {
        const a = await api.get('/api/top-actors');
        setActors(a);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    fetchActors();
  }, []);

  return (
    <div>
      <h2>Top 5 Rented Films</h2>
      <Row>
        {films.map((film) => (
          <Col key={film.film_id} md={4} className="mb-3">
            <Card onClick={() => navigate(`/film/${film.film_id}`)} style={{cursor: 'pointer'}}>
              <Card.Body>
                <Card.Title>{film.title}</Card.Title>
                <Card.Text>Category: {film.category}</Card.Text>
                <Card.Text>Rental Count: {film.rental_count}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <h2 className="mt-4">Top 5 Actors</h2>
      <Row>
        {actors.map((actor) => (
          <Col key={actor.actor_id} md={4} className="mb-3">
            <Card onClick={() => navigate(`/actor/${actor.actor_id}`)} style={{cursor: 'pointer'}}>
              <Card.Body>
                <Card.Title>{actor.first_name} {actor.last_name}</Card.Title>
                <Card.Text>Rental Count: {actor.rental_count}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

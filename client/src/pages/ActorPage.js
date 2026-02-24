import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import api from '../services/api';

export default function ActorPage() {
  const { id } = useParams();
  const [actor, setActor] = useState(null);
  const [actorsTopFiveFilms, setActorsTopFiveFilms] = useState([]);

  useEffect(() => {
    const fetchActor = async () => {
      try {
        const response = await api.get(`/api/actor/${id}`);
        const normalized = Array.isArray(response)
          ? Array.isArray(response[0])
            ? response[0][0]
            : response[0]
          : response;
        setActor(normalized || null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchActor();
  }, [id]);

  useEffect(() => {
    const fetchActorsTopFiveFilms = async () => {
      try {
        const response = await api.get(`/api/actor/${id}/top-films`);
        const normalized = Array.isArray(response)
          ? Array.isArray(response[0])
            ? response[0]
            : response
          : [];
        setActorsTopFiveFilms(normalized || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchActorsTopFiveFilms();
  }, [id]);

  if (!actor) return <div>Loading...</div>;

  return (
    <Card>
      <Card.Body>
        <Card.Title>{actor.first_name} {actor.last_name}</Card.Title>
        <Card.Text>Actor ID: {actor.actor_id}</Card.Text>
        <Card.Text>Rental Count: {actor.rental_count}</Card.Text>
        <Card.Text>Top 5 Films:</Card.Text>
        <ul>
          {actorsTopFiveFilms.map((film) => (
            <li key={film.film_id}>{film.title} and Rental Count: {film.rental_count}</li>
          ))}
        </ul>
      </Card.Body>
    </Card>
  );
}

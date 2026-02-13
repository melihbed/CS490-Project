import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import api from '../services/api';

export default function FilmPage() {
  const { id } = useParams();
  const [film, setFilm] = useState(null);

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        const response = await api.get(`/api/film/${id}`);
        const normalized = Array.isArray(response)
          ? Array.isArray(response[0])
            ? response[0][0]
            : response[0]
          : response;
        setFilm(normalized || null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFilm();
  }, [id]);

  if (!film) return <div>Loading...</div>;

  return (
    <Card>
      <Card.Body>
        <Card.Title>{film.title}</Card.Title>
        <Card.Text>Film ID: {film.film_id}</Card.Text>
        <Card.Text>Category: {film.category}</Card.Text>
        <Card.Text>Description: {film.description}</Card.Text>
      </Card.Body>
    </Card>
  );
}

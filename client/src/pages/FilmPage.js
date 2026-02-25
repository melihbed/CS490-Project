import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Alert, Form, ListGroup } from 'react-bootstrap';
import api from '../services/api';

export default function FilmPage() {
  const { id } = useParams();
  const [film, setFilm] = useState(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusVariant, setStatusVariant] = useState('success');
  const [searching, setSearching] = useState(false);
  const [renting, setRenting] = useState(false);

  const setFeedback = (variant, message) => {
    setStatusVariant(variant);
    setStatusMsg(message);
  };

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

  const handleSearchCustomers = async () => {
    setStatusMsg('');
    setSelectedCustomer(null);
    setSearching(true);
    try {
      const q = customerQuery.trim();
      const data = await api.get(
        `/api/customers?q=${encodeURIComponent(q)}&limit=10&page=1`
      );
      setCustomerResults(data.items || []);
    } catch (err) {
      setFeedback('danger', err?.message || 'Failed to search customers.');
      setCustomerResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateRental = async () => {
    if (!selectedCustomer?.customer_id) {
      setFeedback('danger', 'Select a customer first.');
      return;
    }

    setRenting(true);
    setStatusMsg('');
    try {
      await api.post(`/api/films/${id}/rent`, {
        customer_id: selectedCustomer.customer_id,
      });
      setFeedback(
        'success',
        `Rental added to ${selectedCustomer.first_name} ${selectedCustomer.last_name}.`
      );
    } catch (err) {
      setFeedback('danger', err?.message || 'Failed to create rental.');
    } finally {
      setRenting(false);
    }
  };

  if (!film) return <div>Loading...</div>;

  return (
    <Card>
      <Card.Body>
        <Card.Title>{film.title}</Card.Title>
        <Card.Text>Film ID: {film.film_id}</Card.Text>
        <Card.Text>Category: {film.category}</Card.Text>
        <Card.Text>Description: {film.description}</Card.Text>
        <Card.Text>Release Year: {film.release_year}</Card.Text>
        <Card.Text>Rating: {film.rating}</Card.Text>
        <Card.Text>Rental Rate: ${film.rental_rate}</Card.Text>
        <Card.Text>Rental Count: {film.rental_count}</Card.Text>

        <hr />
        <Card.Text><strong>Rent this film to an existing customer</strong></Card.Text>
        <div className="d-flex gap-2 mb-2">
          <Form.Control
            type="text"
            placeholder="Search by customer ID or name"
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchCustomers();
              }
            }}
          />
          <Button onClick={handleSearchCustomers} disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {customerResults.length > 0 && (
          <ListGroup className="mb-3">
            {customerResults.map((customer) => (
              <ListGroup.Item
                key={customer.customer_id}
                action
                active={selectedCustomer?.customer_id === customer.customer_id}
                onClick={() => setSelectedCustomer(customer)}
              >
                {customer.customer_id} - {customer.first_name} {customer.last_name}
                {customer.email ? ` (${customer.email})` : ''}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <Button onClick={handleCreateRental} disabled={renting || !selectedCustomer}>
          {renting ? 'Adding Rental...' : 'Add Rental to Selected Customer'}
        </Button>

        {statusMsg && (
          <Alert className="mt-3 mb-0" variant={statusVariant}>
            {statusMsg}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}

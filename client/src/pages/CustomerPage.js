import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Alert, Table, Spinner } from 'react-bootstrap';
import api from '../services/api';

export default function CustomerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/api/customers/${id}/rentals`);
      setCustomer(data.customer || null);
      setRentals(data.rentals || []);
    } catch (err) {
      setError(err?.message || 'Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const handleReturn = async (rentalId) => {
    setActionError('');
    setSuccessMsg('');
    try {
      await api.put(`/api/rentals/${rentalId}/return`);
      setSuccessMsg(`Rental ${rentalId} marked as returned.`);
      await loadCustomer();
    } catch (err) {
      setActionError(err?.message || 'Failed to update rental status.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2">
        <Spinner animation="border" size="sm" />
        <span>Loading customer details...</span>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!customer) {
    return <Alert variant="warning">Customer not found.</Alert>;
  }

  return (
    <>
      <Button variant="secondary" className="mb-3" onClick={() => navigate('/customers')}>
        Back to Customers
      </Button>

      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {actionError && <Alert variant="danger">{actionError}</Alert>}

      <Card className="mb-3">
        <Card.Body>
          <Card.Title>
            {customer.first_name} {customer.last_name}
          </Card.Title>
          <Card.Text><strong>ID:</strong> {customer.customer_id}</Card.Text>
          <Card.Text><strong>Email:</strong> {customer.email || '-'}</Card.Text>
          <Card.Text><strong>Phone:</strong> {customer.phone || '-'}</Card.Text>
          <Card.Text><strong>Address:</strong> {customer.address || '-'}, {customer.city || '-'}, {customer.country || '-'}</Card.Text>
          <Card.Text><strong>District:</strong> {customer.district || '-'}</Card.Text>
          <Card.Text><strong>Postal Code:</strong> {customer.postal_code || '-'}</Card.Text>
          <Card.Text><strong>Store ID:</strong> {customer.store_id}</Card.Text>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Rental History</Card.Title>
          {rentals.length === 0 ? (
            <Card.Text>No rentals found for this customer.</Card.Text>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Rental ID</th>
                  <th>Film</th>
                  <th>Rental Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((r) => (
                  <tr key={r.rental_id}>
                    <td>{r.rental_id}</td>
                    <td>{r.title || '-'}</td>
                    <td>{r.rental_date ? new Date(r.rental_date).toLocaleString() : '-'}</td>
                    <td>{r.return_date ? new Date(r.return_date).toLocaleString() : '-'}</td>
                    <td>{r.rental_status}</td>
                    <td>
                      {r.return_date ? (
                        <span className="text-muted">Returned</span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleReturn(r.rental_id)}
                        >
                          Mark Returned
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
}

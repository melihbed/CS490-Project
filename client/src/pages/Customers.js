import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Button, Pagination, Modal } from 'react-bootstrap';
import api from '../services/api';

export default function Customers(){
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState('');
  const [total, setTotal] = useState(0);
  const [show, setShow] = useState(false);
  const [stores, setStores] = useState([]);
  const [formData, setFormData] = useState({});

  const load = async (p = page) => {
    const params = new URLSearchParams({ limit, page: p });
    if (q) params.set('q', q);
    const data = await api.get(`/api/customers?${params.toString()}`);
    setCustomers(data.items || []);
    setPages(data.pages || 1);
    setTotal(data.total || 0);
  };

  useEffect(()=>{ load(1); setPage(1); }, [limit]);
  useEffect(()=>{ load(page); }, [page]);

  useEffect(()=>{ (async()=>{ try{ const s = await api.get('/api/stores'); setStores(s || []); }catch(e){}})(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try{
      await api.post('/api/customers', formData);
      setShow(false);
      setFormData({});
      load(1);
    }catch(err){
      console.error(err);
    }
  };

  const makePagination = () => {
    const items = [];
    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    let end = Math.min(pages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    items.push(<Pagination.Prev key="prev" disabled={page<=1} onClick={() => setPage(page-1)} />);
    for (let p = start; p <= end; p++) items.push(<Pagination.Item key={p} active={p===page} onClick={()=>setPage(p)}>{p}</Pagination.Item>);
    items.push(<Pagination.Next key="next" disabled={page>=pages} onClick={() => setPage(page+1)} />);
    return <Pagination>{items}</Pagination>;
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <Form.Control type="search" placeholder="Search customers" value={q} onChange={e=>setQ(e.target.value)} style={{width:300}} />
        <Button className="ms-2" onClick={()=>{ setPage(1); load(1); }}>Search</Button>
        <Form.Select className="ms-3" value={limit} onChange={e=>setLimit(e.target.value)} style={{width:120}}>
          {[10,20,30,40].map(n=> <option key={n} value={n}>{n}</option>)}
        </Form.Select>
        <Button className="ms-auto" onClick={()=>setShow(true)}>Add Customer</Button>
      </div>

      <div className="mb-2">Page {page}/{pages} - Total: {total}</div>
      <Row>
        {customers.map(c => (
          <Col key={c.customer_id} md={4} className="mb-3">
            <Card>
              <Card.Body>
                <Card.Title>{c.first_name} {c.last_name}</Card.Title>
                <Card.Text>{c.email}</Card.Text>
                <Card.Text>{c.address}, {c.city}, {c.country}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex justify-content-center mt-3">{makePagination()}</div>

      <Modal show={show} onHide={()=>setShow(false)}>
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton>
            <Modal.Title>Add Customer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>First Name</Form.Label>
              <Form.Control required value={formData.first_name||''} onChange={e=>setFormData({...formData, first_name:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Last Name</Form.Label>
              <Form.Control required value={formData.last_name||''} onChange={e=>setFormData({...formData, last_name:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" required value={formData.email||''} onChange={e=>setFormData({...formData, email:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control required value={formData.address||''} onChange={e=>setFormData({...formData, address:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>City</Form.Label>
              <Form.Control required value={formData.city||''} onChange={e=>setFormData({...formData, city:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Country</Form.Label>
              <Form.Control required value={formData.country||''} onChange={e=>setFormData({...formData, country:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Store</Form.Label>
              <Form.Select required value={formData.store_id||''} onChange={e=>setFormData({...formData, store_id: parseInt(e.target.value)})}>
                <option value="">Select a store</option>
                {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.address}, {s.city}, {s.country}</option>)}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={()=>setShow(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Customer</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

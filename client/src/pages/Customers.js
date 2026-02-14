import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Button, Pagination, Modal, Alert } from 'react-bootstrap';
import api from '../services/api';

const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  address: "",
  city: "",
  country: "",
  district: "",
  postal_code: "",
  phone: "",
  store_id: ""
};

const toText = (v, fallback = "") => (v == null ? fallback : String(v).trim());
const toInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

const buildPayload = (form) => ({
  first_name: toText(form.first_name),
  last_name: toText(form.last_name),
  email: toText(form.email),
  address: toText(form.address),
  city: toText(form.city || form.city_name),
  country: toText(form.country || form.country_name),
  district: toText(form.district, "N/A") || "N/A",
  postal_code: toText(form.postal_code) || null,
  phone: toText(form.phone, "N/A") || "N/A",
  store_id: toInt(form.store_id)
});

const validatePayload = (p) => {
  const required = ["first_name", "last_name", "email", "address", "city", "country"];
  const missing = required.filter((k) => !p[k]);
  if (!Number.isInteger(p.store_id)) missing.push("store_id");
  return missing;
};

const extractStoreIds = (rows) =>
  [...new Set(rows.map((c) => Number(c.store_id)).filter(Number.isInteger))].sort((a, b) => a - b);

export default function Customers(){
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState('');
  const [total, setTotal] = useState(0);
  const [show, setShow] = useState(false);
  const [stores, setStores] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");

  const resetForm = () => setFormData(INITIAL_FORM);

  const closeModal = () => {
    setShow(false);
    setSubmitError("");
    setSuccessMsg("");
  };

  const onFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

   useEffect(() => {
    setStores(extractStoreIds(customers));
  }, [customers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMsg("");

    const payload = buildPayload(formData);
    const missing = validatePayload(payload);

    if (missing.length) {
      setSubmitError(`Missing/invalid: ${missing.join(", ")}`);
      return;
    }

    try {
      await api.post("/api/customers", payload);
      setSuccessMsg(`Customer "${payload.first_name} ${payload.last_name}" added successfully.`);
      await load(1);

      setTimeout(() => {
        closeModal();
        resetForm();
      }, 1200);
    } catch (err) {
      setSubmitError(err?.message || "Failed to add customer.");
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
    <>
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
                <Card.Text>Store ID: {c.store_id}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex justify-content-center mt-3">{makePagination()}</div>

      <Modal
        show={show}
        onHide={closeModal}
      >
        <Form onSubmit={handleAdd}>
          <Modal.Header closeButton>
            <Modal.Title>Add Customer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {successMsg && (
              <Alert variant="success" className="mb-2">
                {successMsg}
              </Alert>
            )}
            {submitError && (
              <Alert variant="danger" className="mb-2">
                {submitError}
              </Alert>
            )}

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
              <Form.Label>Phone Number</Form.Label>
              <Form.Control required value={formData.phone||''} onChange={e=>setFormData({...formData, phone:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Address</Form.Label>
              <Form.Control required value={formData.address||''} onChange={e=>setFormData({...formData, address:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Postal Code</Form.Label>
              <Form.Control required value={formData.postal_code||''} onChange={e=>setFormData({...formData, postal_code:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>City</Form.Label>
              <Form.Control required value={formData.city||''} onChange={e=>setFormData({...formData, city:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>District/State/Province</Form.Label>
              <Form.Control required value={formData.district||''} onChange={e=>setFormData({...formData, district:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Country</Form.Label>
              <Form.Control required value={formData.country||''} onChange={e=>setFormData({...formData, country:e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Store</Form.Label>
              <Form.Select
                name="store_id"
                required
                value={formData.store_id ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    store_id: v === "" ? "" : Number(v),
                  }));
                }}
              >
                <option value="">Select store</option>
                {stores.map((id) => (
                  <option key={id} value={id}>
                    Store ID: {id}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary">Add Customer</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

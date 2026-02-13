import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Button, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Films() {
  const [films, setFilms] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [type, setType] = useState('title');
  const [q, setQ] = useState('');
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const load = async (p = page) => {
    const params = new URLSearchParams({ limit, page: p, type });
    if (q) params.set('q', q);
    const data = await api.get(`/api/films?${params.toString()}`);
    setFilms(data.items || []);
    setPages(data.pages || 1);
    setTotal(data.total || 0);
  };

  useEffect(() => { load(1); setPage(1); }, [limit, type]);

  useEffect(() => { load(page); }, [page]);

  const handleSearch = () => { setPage(1); load(1); };

  const makePagination = () => {
    const items = [];
    const windowSize = 5;
    let start = Math.max(1, page - Math.floor(windowSize / 2));
    let end = Math.min(pages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    items.push(
      <Pagination.Prev key="prev" disabled={page<=1} onClick={() => setPage(page-1)} />
    );
    for (let p = start; p <= end; p++) {
      items.push(
        <Pagination.Item key={p} active={p===page} onClick={() => setPage(p)}>
          {p}
        </Pagination.Item>
      );
    }
    items.push(
      <Pagination.Next key="next" disabled={page>=pages} onClick={() => setPage(page+1)} />
    );
    return <Pagination>{items}</Pagination>;
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <Form.Control type="search" placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} style={{width:300}} />
        <Button className="ms-2" onClick={handleSearch}>Search</Button>

        <Form.Select className="ms-3" value={type} onChange={e=>setType(e.target.value)} style={{width:150}}>
          <option value="title">title</option>
          <option value="actor">actor</option>
          <option value="genre">genre</option>
        </Form.Select>

        <Form.Select className="ms-2" value={limit} onChange={e=>setLimit(e.target.value)} style={{width:100}}>
          {[10,20,30,40,50].map(n=> <option key={n} value={n}>{n}</option>)}
        </Form.Select>
      </div>

      <div className="mb-2">Page {page}/{pages} - Total: {total}</div>
      <Row>
        {films.map(f => (
          <Col key={f.film_id} md={4} className="mb-3">
            <Card onClick={() => navigate(`/film/${f.film_id}`)} style={{cursor:'pointer'}}>
              <Card.Body>
                <Card.Title>{f.title}</Card.Title>
                <Card.Text>{f.description}</Card.Text>
                <Card.Text>Genre: {f.genres}</Card.Text>
                <Card.Text>Rental Rate: ${f.rental_rate}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex justify-content-center mt-3">{makePagination()}</div>
    </div>
  );
}

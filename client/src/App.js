import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CommonNavbar from './components/CommonNavbar';
import Home from './pages/Home';
import FilmPage from './pages/FilmPage';
import ActorPage from './pages/ActorPage';
import Films from './pages/Films';
import Customers from './pages/Customers';
import CustomerPage from './pages/CustomerPage';

function App() {
  return (
    <Router>
      <CommonNavbar />
      <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/films" element={<Films />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerPage />} />
            <Route path="/film/:id" element={<FilmPage />} />
            <Route path="/actor/:id" element={<ActorPage />} />
          </Routes>
      </div>
    </Router>
  );
}

export default App;

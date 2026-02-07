import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Landing from './components/Landing';
import Films from './components/Films'
import Customers from './components/Customers'
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';



function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Navbar >
        <Nav.Link href="/">Home</Nav.Link>
        <Nav.Link href="/films">Films</Nav.Link>
        <Nav.Link href="/customers">Customers</Nav.Link>
      </Navbar>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/films" element={<Films />} />
          <Route path="/customers" element={<Customers />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

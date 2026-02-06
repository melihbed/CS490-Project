import {BrowserRouter, Routes, Route} from 'react-router-dom';



function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          
          <Route path="/" element={<h1>Hello World!</h1>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

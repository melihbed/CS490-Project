const express = require('express');
const cors = require('cors');
const filmsRoute = require('./routes/films');

const app = express();

app.use(express.json());
app.use(cors());

const PORT = 5000;

app.use('/films', filmsRoute);

app.use('/', (req, res) => {
  
});






app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
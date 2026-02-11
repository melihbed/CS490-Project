const express = require('express');
const cors = require('cors');
const filmsRoute = require('./routes/films');
const customersRoute = require('./routes/customers');

const app = express();

app.use(express.json());
app.use(cors());

const PORT = 5000;

app.use('/', filmsRoute);
app.use('/customers', customersRoute);








app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
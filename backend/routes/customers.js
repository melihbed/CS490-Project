const express = require('express');
const router = express.Router();
const {getCustomers} = require('../controllers/customersController');

router.get('/', getCustomers);

module.exports = router;
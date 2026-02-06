const express = require('express');
const router = express.Router();
const {top5Films} = require('../controllers/filmsController');

router.get('/', top5Films);

module.exports = router;
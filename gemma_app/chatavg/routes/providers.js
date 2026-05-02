/**
 * Routes: Provider Listing
 * GET /api/providers
 */
const { Router } = require('express');
const { authenticate } = require('../lib/auth');
const { listProviders } = require('../providers');

const router = Router();

router.get('/', authenticate, (req, res) => {
  res.json(listProviders());
});

module.exports = router;

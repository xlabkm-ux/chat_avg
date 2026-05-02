/**
 * Routes: Provider Listing
 * GET /api/providers
 */
const { Router } = require('express');
const { authenticate } = require('../auth/auth.middleware');
const { listProviders } = require('./provider.factory');

const router = Router();

router.get('/', authenticate, (req, res) => {
  res.json(listProviders());
});

module.exports = router;

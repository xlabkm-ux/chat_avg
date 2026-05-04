/**
 * Routes: Provider Listing
 * GET /api/providers
 */
const { Router } = require('express');
const { authenticate } = require('../auth/auth.middleware');
const { listProviders } = require('./provider.factory');

const categoryRepository = require('../admin/category.repository');
const { getProvider } = require('./provider.factory');

const router = Router();

router.get('/', authenticate, (req, res) => {
  res.json(listProviders());
});

router.get('/health', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const catSettings = await categoryRepository.findByName(user.category) || {};
    const providerId = catSettings.provider || 'llamacpp';
    const provider = getProvider(providerId);

    if (!provider) {
      return res.status(200).json({ status: 'offline', error: 'Provider not found' });
    }

    const isOnline = await provider.checkHealth(catSettings);
    res.json({ 
      status: isOnline ? 'online' : 'offline',
      provider: providerId
    });
  } catch (err) {
    res.json({ status: 'offline', error: err.message });
  }
});

module.exports = router;

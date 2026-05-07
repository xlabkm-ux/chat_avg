/**
 * Routes: Provider Listing
 * GET /api/providers
 */
const { Router } = require('express');
const { authenticate } = require('../auth/auth.middleware');
const { listProviders } = require('./provider.factory');
const { policyGuard } = require('../policy/policy.guard');

const categoryRepository = require('../admin/category.repository');
const { getProvider } = require('./provider.factory');

const router = Router();

router.get('/', authenticate, (req, res) => {
  res.json(listProviders());
});

router.get('/health', authenticate, policyGuard('provider_operation'), async (req, res) => {
  try {
    const user = req.user;
    const catSettings = await categoryRepository.findByName(user.category) || {};
    const providerId = catSettings.provider || 'llamacpp';
    const provider = getProvider(providerId);

    const providersConfig = require('../../core/providers.config');
    const providerCfg = providersConfig[providerId] || {};
    const effectiveEndpointUrl = providerCfg.endpoint_url || null;
    const effectiveApiKey = providerCfg.api_key || null;

    if (!provider) {
      return res.status(200).json({ status: 'offline', error: 'Provider not found' });
    }

    const isOnline = await provider.checkHealth({
      ...catSettings,
      endpoint_url: effectiveEndpointUrl,
      api_key: effectiveApiKey
    });
    res.json({ 
      status: isOnline ? 'online' : 'offline',
      provider: providerId
    });
  } catch (err) {
    res.json({ status: 'offline', error: err.message });
  }
});

router.get('/:id/models', authenticate, policyGuard('provider_operation'), async (req, res) => {
  try {
    const providerId = req.params.id;
    const provider = getProvider(providerId);

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const providersConfig = require('../../core/providers.config');
    const providerCfg = providersConfig[providerId] || {};
    
    // Some providers might need the exact config to fetch models
    const configToPass = {
      ...providerCfg,
      endpoint_url: providerCfg.endpoint_url || null,
      api_key: providerCfg.api_key || null
    };

    const models = await provider.getModels(configToPass);
    res.json({ provider: providerId, models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/health', authenticate, policyGuard('provider_operation'), async (req, res) => {
  try {
    const providerId = req.params.id;
    const provider = getProvider(providerId);

    if (!provider) {
      return res.status(404).json({ status: 'offline', error: 'Provider not found' });
    }

    const providersConfig = require('../../core/providers.config');
    const providerCfg = providersConfig[providerId] || {};

    const configToPass = {
      ...providerCfg,
      endpoint_url: providerCfg.endpoint_url || null,
      api_key: providerCfg.api_key || null
    };

    const isOnline = await provider.checkHealth(configToPass);
    res.json({ 
      status: isOnline ? 'online' : 'offline',
      provider: providerId
    });
  } catch (err) {
    res.json({ status: 'offline', error: err.message });
  }
});

module.exports = router;

"use strict";
const express = require('express');
const router = express.Router();
const missionRepository = require('./mission.repository');
/**
 * POST /api/missions
 * Create a new Mission
 */
router.post('/', async (req, res) => {
    try {
        const { sessionId, goal, mode, semanticProtocolId, glossaryVersion, constraints, openQuestions, context } = req.body;
        const username = req.user?.username || 'admin';
        if (!sessionId || !goal) {
            return res.status(400).json({ error: 'sessionId and goal are required' });
        }
        const mission = missionRepository.create({
            sessionId,
            username,
            goal,
            mode,
            semanticProtocolId,
            glossaryVersion,
            constraints,
            openQuestions,
            context
        });
        res.status(201).json(mission);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
/**
 * GET /api/missions/:id
 * Get Mission details
 */
router.get('/:id', async (req, res) => {
    try {
        const mission = missionRepository.findById(req.params.id);
        if (!mission) {
            return res.status(404).json({ error: 'Mission not found' });
        }
        res.json(mission);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/sessions/:sessionId/missions
 * Get all missions for a session
 */
router.get('/session/:sessionId', async (req, res) => {
    try {
        const username = req.user?.username || 'admin';
        const missions = missionRepository.findBySession(req.params.sessionId, username);
        res.json(missions);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * PATCH /api/missions/:id
 * Update Mission goal or constraints
 */
router.patch('/:id', async (req, res) => {
    try {
        const mission = missionRepository.update(req.params.id, req.body);
        res.json(mission);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
module.exports = router;
//# sourceMappingURL=mission.routes.js.map
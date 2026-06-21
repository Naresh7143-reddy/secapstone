const express = require('express');
const router = express.Router();
const judge0Service = require('../services/judge0');

// Pure code execution — no auth, no database. Powers the online compiler.
router.post('/', async (req, res) => {
  try {
    const { code, language, input } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });

    const result = await judge0Service.executeCode(
      code,
      language || 'python',
      input || ''
    );
    res.json(result);
  } catch (error) {
    console.error('Run error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Run code against provided (visible) test cases — for the student "Run" button.
router.post('/tests', async (req, res) => {
  try {
    const { code, language, tests } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });
    const results = await judge0Service.runAgainstTests(
      code,
      language || 'python',
      Array.isArray(tests) ? tests : []
    );
    const passed = results.filter((r) => r.passed).length;
    res.json({ results, passed, total: results.length });
  } catch (error) {
    console.error('Run tests error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

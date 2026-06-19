const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');
const judge0Service = require('../services/judge0');

// Submit code
router.post('/', verifyToken, async (req, res) => {
  try {
    const { problem_id, code, language, input } = req.body;

    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('language, test_cases')
      .eq('id', problem_id)
      .single();

    if (problemError || !problem) throw new Error('Problem not found');

    const result = await judge0Service.executeCode(
      code,
      language || problem.language,
      input || ''
    );

    const { data, error } = await supabase
      .from('submissions')
      .insert([
        {
          user_id: req.user.uid,
          problem_id,
          code,
          output: result.output || result.stderr || result.compile_output,
          status: result.status,
          score: result.status === 'Accepted' ? 100 : 0
        }
      ])
      .select();

    if (error) throw error;

    res.json({ message: 'Submission saved', data: data[0], result });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user's submissions
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', req.user.uid)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

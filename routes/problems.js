const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// Create problem (instructor)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { classroom_id, title, description, language, test_cases } = req.body;

    const { data, error } = await supabase
      .from('problems')
      .insert([
        {
          classroom_id,
          title,
          description,
          language: language || 'python',
          test_cases: test_cases || null
        }
      ])
      .select();

    if (error) throw error;

    res.json({ message: 'Problem created', data: data[0] });
  } catch (error) {
    console.error('Problem creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get problems by classroom
router.get('/classroom/:classroom_id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('classroom_id', req.params.classroom_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Fetch problems error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

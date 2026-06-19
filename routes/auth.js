const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// Create user profile after Firebase signup
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const { email, uid } = req.user;

    const { data, error } = await supabase
      .from('users')
      .upsert(
        [
          {
            id: uid,
            email: email,
            name: name || (email ? email.split('@')[0] : 'user'),
            role: 'student'
          }
        ],
        { onConflict: 'id' }
      )
      .select();

    if (error) throw error;

    res.json({ message: 'User created successfully', data: data && data[0] });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.uid)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

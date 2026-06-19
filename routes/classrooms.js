const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');
const { generateClassroomCode } = require('../utils/generateCode');

// Create classroom (instructor)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const code = generateClassroomCode();

    const { data, error } = await supabase
      .from('classrooms')
      .insert([
        {
          instructor_id: req.user.uid,
          code: code,
          name: name,
          is_active: true
        }
      ])
      .select();

    if (error) throw error;

    res.json({ message: 'Classroom created', data: data[0] });
  } catch (error) {
    console.error('Classroom creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get classrooms the user owns
router.get('/', verifyToken, async (req, res) => {
  try {
    // Classrooms the user instructs
    const owned = await supabase
      .from('classrooms')
      .select('*')
      .eq('instructor_id', req.user.uid);

    if (owned.error) throw owned.error;

    // Classrooms the user has joined
    const joinedRows = await supabase
      .from('participants')
      .select('classroom_id')
      .eq('user_id', req.user.uid);

    if (joinedRows.error) throw joinedRows.error;

    let joined = [];
    const joinedIds = (joinedRows.data || []).map((r) => r.classroom_id);
    if (joinedIds.length) {
      const joinedClassrooms = await supabase
        .from('classrooms')
        .select('*')
        .in('id', joinedIds);
      if (joinedClassrooms.error) throw joinedClassrooms.error;
      joined = joinedClassrooms.data || [];
    }

    // Merge + de-duplicate
    const byId = {};
    [...(owned.data || []), ...joined].forEach((c) => (byId[c.id] = c));
    const result = Object.values(byId).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(result);
  } catch (error) {
    console.error('Fetch classrooms error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Join classroom by code
router.post('/join/:code', verifyToken, async (req, res) => {
  try {
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id')
      .eq('code', req.params.code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (classroomError || !classroom) throw new Error('Classroom not found');

    const { error } = await supabase
      .from('participants')
      .insert([{ user_id: req.user.uid, classroom_id: classroom.id }])
      .select();

    // Ignore duplicate-key (already joined)
    if (error && error.code !== '23505') throw error;

    res.json({ message: 'Joined classroom', classroom_id: classroom.id });
  } catch (error) {
    console.error('Join classroom error:', error);
    res.status(500).json({ error: error.message });
  }
});

// End classroom (instructor)
router.post('/:id/end', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classrooms')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('instructor_id', req.user.uid)
      .select();

    if (error) throw error;
    if (!data || data.length === 0)
      throw new Error('Classroom not found or not authorized');

    res.json({ message: 'Classroom ended', data: data[0] });
  } catch (error) {
    console.error('End classroom error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

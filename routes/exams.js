const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');
const judge0Service = require('../services/judge0');

// Create an exam with its questions (owner)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { classroom_id, title, duration_minutes, questions } = req.body;
    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'title and at least one question are required' });
    }

    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .insert([
        {
          classroom_id: classroom_id || null,
          owner_id: req.user.uid,
          title,
          duration_minutes: duration_minutes || 60,
        },
      ])
      .select()
      .single();
    if (examErr) throw examErr;

    const rows = questions.map((q, i) => ({
      exam_id: exam.id,
      title: q.title,
      description: q.description || '',
      difficulty: q.difficulty || 'easy',
      language: q.language || 'python',
      starter_code: q.starter_code || '',
      points: q.points || 10,
      position: i,
    }));
    const { error: qErr } = await supabase.from('exam_questions').insert(rows);
    if (qErr) throw qErr;

    res.json({ message: 'Exam created', data: exam });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List exams for a classroom
router.get('/classroom/:classroom_id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('classroom_id', req.params.classroom_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single exam + its questions
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { data: exam, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;

    const { data: questions, error: qErr } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', exam.id)
      .order('position', { ascending: true });
    if (qErr) throw qErr;

    res.json({ ...exam, questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit an answer to a question (student). Applies proctoring + scoring.
router.post('/:id/submit', verifyToken, async (req, res) => {
  try {
    const { question_id, code, language, paste_count, blur_count, flagged, flag_reason } =
      req.body;

    // Look up the question for points + language.
    const { data: question, error: qErr } = await supabase
      .from('exam_questions')
      .select('points, language')
      .eq('id', question_id)
      .single();
    if (qErr) throw new Error('Question not found');

    let status = 'Submitted';
    let score = 0;
    const isFlagged = !!flagged;

    if (isFlagged) {
      // Proctoring: cheating detected -> auto zero.
      status = 'Flagged';
      score = 0;
    } else {
      try {
        const result = await judge0Service.executeCode(
          code || '',
          language || question.language || 'python',
          ''
        );
        status = result.status;
        score = result.status === 'Accepted' ? question.points || 10 : 0;
      } catch {
        status = 'Execution error';
        score = 0;
      }
    }

    const { data, error } = await supabase
      .from('exam_submissions')
      .upsert(
        [
          {
            exam_id: req.params.id,
            question_id,
            user_id: req.user.uid,
            user_name: req.user.name || req.user.email,
            code: code || '',
            status,
            score,
            flagged: isFlagged,
            flag_reason: isFlagged ? flag_reason || 'Suspicious activity' : null,
            paste_count: paste_count || 0,
            blur_count: blur_count || 0,
            submitted_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'question_id,user_id' }
      )
      .select()
      .single();
    if (error) throw error;

    res.json({ message: 'Submitted', data });
  } catch (error) {
    console.error('Exam submit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Current student's own submissions for an exam (resume support)
router.get('/:id/my', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exam_submissions')
      .select('*')
      .eq('exam_id', req.params.id)
      .eq('user_id', req.user.uid);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aggregated results (owner): who submitted / who didn't, scores, flags.
router.get('/:id/results', verifyToken, async (req, res) => {
  try {
    const { data: exam, error: exErr } = await supabase
      .from('exams')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (exErr) throw exErr;
    if (exam.owner_id !== req.user.uid) {
      return res.status(403).json({ error: 'Only the exam owner can view results' });
    }

    const { data: questions } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', exam.id)
      .order('position', { ascending: true });

    // Roster: participants of the classroom (who is expected to take it).
    let roster = [];
    if (exam.classroom_id) {
      const { data: parts } = await supabase
        .from('participants')
        .select('user_id, users(name, email)')
        .eq('classroom_id', exam.classroom_id);
      roster = (parts || []).map((p) => ({
        user_id: p.user_id,
        name: p.users?.name || p.users?.email || 'Student',
        email: p.users?.email || '',
      }));
    }

    const { data: subs } = await supabase
      .from('exam_submissions')
      .select('*')
      .eq('exam_id', exam.id);

    // Include anyone who submitted but isn't in the roster.
    const rosterIds = new Set(roster.map((r) => r.user_id));
    (subs || []).forEach((s) => {
      if (!rosterIds.has(s.user_id)) {
        rosterIds.add(s.user_id);
        roster.push({ user_id: s.user_id, name: s.user_name || 'Student', email: '' });
      }
    });

    const totalPoints = (questions || []).reduce((a, q) => a + (q.points || 0), 0);

    const students = roster.map((r) => {
      const mine = (subs || []).filter((s) => s.user_id === r.user_id);
      const byQuestion = {};
      mine.forEach((s) => (byQuestion[s.question_id] = s));
      const total_score = mine.reduce((a, s) => a + (s.score || 0), 0);
      const flagged = mine.some((s) => s.flagged);
      return {
        ...r,
        submissions: byQuestion,
        submitted_count: mine.length,
        total_score,
        flagged,
      };
    });

    res.json({
      exam,
      questions: questions || [],
      total_points: totalPoints,
      students,
    });
  } catch (error) {
    console.error('Exam results error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

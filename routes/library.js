const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// A small bank of popular interview problems (stdin/stdout style).
const SEED = [
  {
    title: 'Sum of Two Numbers',
    problem_statement: 'Read two integers and print their sum.',
    input_format: 'Two space-separated integers a and b.',
    output_format: 'A single integer: a + b.',
    constraints: '-10^9 <= a, b <= 10^9',
    difficulty: 'easy',
    tags: ['Math', 'Arrays'],
    sample_test_cases: [{ input: '3 5', expected: '8' }],
    hidden_test_cases: [{ input: '10 20', expected: '30' }, { input: '-4 9', expected: '5' }],
    default_points: 10,
  },
  {
    title: 'Reverse a String',
    problem_statement: 'Read a string and print it reversed.',
    input_format: 'A single line containing a string.',
    output_format: 'The reversed string.',
    constraints: '1 <= length <= 1000',
    difficulty: 'easy',
    tags: ['Strings'],
    sample_test_cases: [{ input: 'hello', expected: 'olleh' }],
    hidden_test_cases: [{ input: 'world', expected: 'dlrow' }, { input: 'abcd', expected: 'dcba' }],
    default_points: 10,
  },
  {
    title: 'FizzBuzz',
    problem_statement: 'For numbers 1..N print Fizz for multiples of 3, Buzz for multiples of 5, FizzBuzz for both, else the number.',
    input_format: 'A single integer N.',
    output_format: 'N lines of FizzBuzz output.',
    constraints: '1 <= N <= 100',
    difficulty: 'easy',
    tags: ['Math', 'Strings'],
    sample_test_cases: [{ input: '5', expected: '1\n2\nFizz\n4\nBuzz' }],
    hidden_test_cases: [{ input: '3', expected: '1\n2\nFizz' }],
    default_points: 10,
  },
  {
    title: 'Factorial',
    problem_statement: 'Read N and print N! (factorial).',
    input_format: 'A single integer N.',
    output_format: 'N! as an integer.',
    constraints: '0 <= N <= 12',
    difficulty: 'easy',
    tags: ['Math', 'Recursion'],
    sample_test_cases: [{ input: '5', expected: '120' }],
    hidden_test_cases: [{ input: '0', expected: '1' }, { input: '6', expected: '720' }],
    default_points: 10,
  },
  {
    title: 'Maximum in Array',
    problem_statement: 'Read N then N integers and print the maximum.',
    input_format: 'First line N, second line N space-separated integers.',
    output_format: 'The maximum value.',
    constraints: '1 <= N <= 1000',
    difficulty: 'easy',
    tags: ['Arrays'],
    sample_test_cases: [{ input: '3\n1 5 2', expected: '5' }],
    hidden_test_cases: [{ input: '4\n-1 -7 -3 -9', expected: '-1' }],
    default_points: 10,
  },
  {
    title: 'Palindrome Check',
    problem_statement: 'Read a string and print YES if it is a palindrome, else NO.',
    input_format: 'A single line string.',
    output_format: 'YES or NO.',
    constraints: '1 <= length <= 1000',
    difficulty: 'medium',
    tags: ['Strings'],
    sample_test_cases: [{ input: 'racecar', expected: 'YES' }],
    hidden_test_cases: [{ input: 'hello', expected: 'NO' }, { input: 'noon', expected: 'YES' }],
    default_points: 15,
  },
  {
    title: 'Nth Fibonacci',
    problem_statement: 'Read N and print the Nth Fibonacci number (F(1)=1, F(2)=1).',
    input_format: 'A single integer N.',
    output_format: 'The Nth Fibonacci number.',
    constraints: '1 <= N <= 40',
    difficulty: 'medium',
    tags: ['Dynamic Programming', 'Math'],
    sample_test_cases: [{ input: '7', expected: '13' }],
    hidden_test_cases: [{ input: '1', expected: '1' }, { input: '10', expected: '55' }],
    default_points: 15,
  },
  {
    title: 'Count Vowels',
    problem_statement: 'Read a lowercase string and print the number of vowels.',
    input_format: 'A single line string.',
    output_format: 'Integer count of vowels.',
    constraints: '1 <= length <= 1000',
    difficulty: 'easy',
    tags: ['Strings'],
    sample_test_cases: [{ input: 'hello', expected: '2' }],
    hidden_test_cases: [{ input: 'programming', expected: '3' }],
    default_points: 10,
  },
  {
    title: 'GCD of Two Numbers',
    problem_statement: 'Read two integers and print their greatest common divisor.',
    input_format: 'Two space-separated integers.',
    output_format: 'Their GCD.',
    constraints: '1 <= a, b <= 10^9',
    difficulty: 'medium',
    tags: ['Math'],
    sample_test_cases: [{ input: '12 18', expected: '6' }],
    hidden_test_cases: [{ input: '100 75', expected: '25' }],
    default_points: 15,
  },
  {
    title: 'Two Sum (indices)',
    problem_statement: 'Given N numbers and a target, print the 0-based indices of two numbers that add to target (space-separated, smaller index first). Assume exactly one solution.',
    input_format: 'Line1: N and target. Line2: N integers.',
    output_format: 'Two indices.',
    constraints: '2 <= N <= 1000',
    difficulty: 'hard',
    tags: ['Arrays', 'Hashing'],
    sample_test_cases: [{ input: '4 9\n2 7 11 15', expected: '0 1' }],
    hidden_test_cases: [{ input: '3 6\n3 2 4', expected: '1 2' }],
    default_points: 20,
  },
];

// Seed the library (idempotent — only seeds if empty).
router.post('/seed', verifyToken, async (req, res) => {
  try {
    const { count } = await supabase
      .from('question_library')
      .select('id', { count: 'exact', head: true });
    if (count && count > 0) return res.json({ message: 'Already seeded', count });

    const { error } = await supabase.from('question_library').insert(SEED);
    if (error) throw error;
    res.json({ message: 'Library seeded', count: SEED.length });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List / search / filter library questions.
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, difficulty, tag } = req.query;
    let q = supabase.from('question_library').select('*').order('created_at', { ascending: true });
    if (search) q = q.ilike('title', `%${search}%`);
    if (difficulty) q = q.eq('difficulty', difficulty);
    if (tag) q = q.contains('tags', [tag]);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Library list error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

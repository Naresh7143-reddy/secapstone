const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// Helper to keep entries compact.
const Q = (title, difficulty, tags, problem_statement, input_format, output_format, constraints, sample, hidden, points) => ({
  title,
  difficulty,
  tags,
  problem_statement,
  input_format,
  output_format,
  constraints,
  sample_test_cases: sample,
  hidden_test_cases: hidden,
  default_points: points,
});

// 50 popular interview problems (stdin/stdout style — language agnostic).
const SEED = [
  // ---------------- EASY (20) ----------------
  Q('Sum of Two Numbers', 'easy', ['Math', 'Arrays'], 'Read two integers and print their sum.', 'Two space-separated integers a and b.', 'A single integer a + b.', '-1e9 <= a, b <= 1e9', [{ input: '3 5', expected: '8' }], [{ input: '10 20', expected: '30' }, { input: '-4 9', expected: '5' }], 10),
  Q('Reverse a String', 'easy', ['Strings'], 'Read a string and print it reversed.', 'A single line string.', 'The reversed string.', '1 <= len <= 1000', [{ input: 'hello', expected: 'olleh' }], [{ input: 'world', expected: 'dlrow' }, { input: 'abcd', expected: 'dcba' }], 10),
  Q('FizzBuzz', 'easy', ['Math', 'Strings'], 'For 1..N print Fizz (mult of 3), Buzz (mult of 5), FizzBuzz (both), else the number.', 'An integer N.', 'N lines.', '1 <= N <= 100', [{ input: '5', expected: '1\n2\nFizz\n4\nBuzz' }], [{ input: '3', expected: '1\n2\nFizz' }], 10),
  Q('Factorial', 'easy', ['Math', 'Recursion'], 'Read N and print N!.', 'An integer N.', 'N! as an integer.', '0 <= N <= 12', [{ input: '5', expected: '120' }], [{ input: '0', expected: '1' }, { input: '6', expected: '720' }], 10),
  Q('Maximum in Array', 'easy', ['Arrays'], 'Read N then N integers; print the maximum.', 'Line1: N. Line2: N integers.', 'The maximum.', '1 <= N <= 1000', [{ input: '3\n1 5 2', expected: '5' }], [{ input: '4\n-1 -7 -3 -9', expected: '-1' }], 10),
  Q('Count Vowels', 'easy', ['Strings'], 'Read a lowercase string; print the number of vowels (a,e,i,o,u).', 'A single line string.', 'Integer count.', '1 <= len <= 1000', [{ input: 'hello', expected: '2' }], [{ input: 'programming', expected: '3' }], 10),
  Q('Even or Odd', 'easy', ['Math'], 'Print "Even" if N is even else "Odd".', 'An integer N.', 'Even or Odd.', '-1e9 <= N <= 1e9', [{ input: '4', expected: 'Even' }], [{ input: '7', expected: 'Odd' }], 10),
  Q('Sum 1 to N', 'easy', ['Math'], 'Print the sum of all integers from 1 to N.', 'An integer N.', 'The sum.', '1 <= N <= 1e5', [{ input: '10', expected: '55' }], [{ input: '1', expected: '1' }, { input: '100', expected: '5050' }], 10),
  Q('Square of a Number', 'easy', ['Math'], 'Print N squared.', 'An integer N.', 'N*N.', '-1e4 <= N <= 1e4', [{ input: '7', expected: '49' }], [{ input: '12', expected: '144' }], 10),
  Q('Minimum in Array', 'easy', ['Arrays'], 'Read N then N integers; print the minimum.', 'Line1: N. Line2: N integers.', 'The minimum.', '1 <= N <= 1000', [{ input: '3\n4 2 9', expected: '2' }], [{ input: '5\n5 4 3 2 1', expected: '1' }], 10),
  Q('Absolute Value', 'easy', ['Math'], 'Print the absolute value of N.', 'An integer N.', '|N|.', '-1e9 <= N <= 1e9', [{ input: '-5', expected: '5' }], [{ input: '7', expected: '7' }], 10),
  Q('Celsius to Fahrenheit', 'easy', ['Math'], 'Convert Celsius to Fahrenheit (F = C*9/5+32). Input is a multiple of 5.', 'An integer C.', 'Integer F.', '-100 <= C <= 100', [{ input: '100', expected: '212' }], [{ input: '0', expected: '32' }, { input: '50', expected: '122' }], 10),
  Q('Count Digits', 'easy', ['Math'], 'Print the number of digits in N (N >= 0).', 'A non-negative integer N.', 'Digit count.', '0 <= N <= 1e9', [{ input: '12345', expected: '5' }], [{ input: '7', expected: '1' }, { input: '1000', expected: '4' }], 10),
  Q('Multiplication', 'easy', ['Math'], 'Print the product of two integers.', 'Two space-separated integers.', 'a*b.', '-1e4 <= a,b <= 1e4', [{ input: '6 7', expected: '42' }], [{ input: '9 9', expected: '81' }], 10),
  Q('Sign of a Number', 'easy', ['Math'], 'Print Positive, Negative, or Zero.', 'An integer N.', 'Positive/Negative/Zero.', '-1e9 <= N <= 1e9', [{ input: '-3', expected: 'Negative' }], [{ input: '0', expected: 'Zero' }, { input: '8', expected: 'Positive' }], 10),
  Q('Last Digit', 'easy', ['Math'], 'Print the last digit of a non-negative integer.', 'A non-negative integer N.', 'Last digit.', '0 <= N <= 1e9', [{ input: '12345', expected: '5' }], [{ input: '90', expected: '0' }], 10),
  Q('First Character', 'easy', ['Strings'], 'Print the first character of the string.', 'A single line string.', 'First character.', '1 <= len <= 1000', [{ input: 'hello', expected: 'h' }], [{ input: 'World', expected: 'W' }], 10),
  Q('String Length', 'easy', ['Strings'], 'Print the length of the string.', 'A single line string.', 'Length.', '1 <= len <= 1000', [{ input: 'world', expected: '5' }], [{ input: 'hi', expected: '2' }], 10),
  Q('Uppercase', 'easy', ['Strings'], 'Print the string in uppercase.', 'A single line string.', 'Uppercased string.', '1 <= len <= 1000', [{ input: 'hello', expected: 'HELLO' }], [{ input: 'AbC', expected: 'ABC' }], 10),
  Q('Sum of Three Numbers', 'easy', ['Math'], 'Print the sum of three integers.', 'Three space-separated integers.', 'Their sum.', '-1e4 <= each <= 1e4', [{ input: '3 4 5', expected: '12' }], [{ input: '10 20 30', expected: '60' }], 10),

  // ---------------- MEDIUM (18) ----------------
  Q('Palindrome Check', 'medium', ['Strings'], 'Print YES if the string is a palindrome else NO.', 'A single line string.', 'YES or NO.', '1 <= len <= 1000', [{ input: 'racecar', expected: 'YES' }], [{ input: 'hello', expected: 'NO' }, { input: 'noon', expected: 'YES' }], 15),
  Q('Nth Fibonacci', 'medium', ['Dynamic Programming', 'Math'], 'Print the Nth Fibonacci number (F(1)=1, F(2)=1).', 'An integer N.', 'Nth Fibonacci.', '1 <= N <= 40', [{ input: '7', expected: '13' }], [{ input: '1', expected: '1' }, { input: '10', expected: '55' }], 15),
  Q('GCD of Two Numbers', 'medium', ['Math'], 'Print the greatest common divisor of two positive integers.', 'Two space-separated integers.', 'Their GCD.', '1 <= a,b <= 1e9', [{ input: '12 18', expected: '6' }], [{ input: '100 75', expected: '25' }], 15),
  Q('Prime Check', 'medium', ['Math'], 'Print "Prime" if N is prime else "Not Prime".', 'An integer N.', 'Prime/Not Prime.', '1 <= N <= 1e6', [{ input: '7', expected: 'Prime' }], [{ input: '1', expected: 'Not Prime' }, { input: '9', expected: 'Not Prime' }, { input: '2', expected: 'Prime' }], 15),
  Q('Sum of Digits', 'medium', ['Math'], 'Print the sum of digits of a non-negative integer.', 'A non-negative integer N.', 'Digit sum.', '0 <= N <= 1e9', [{ input: '1234', expected: '10' }], [{ input: '9999', expected: '36' }], 15),
  Q('Reverse Integer', 'medium', ['Math'], 'Reverse the digits and print as an integer (no leading zeros).', 'A non-negative integer N.', 'Reversed integer.', '0 <= N <= 1e9', [{ input: '1234', expected: '4321' }], [{ input: '100', expected: '1' }], 15),
  Q('Count Words', 'medium', ['Strings'], 'Print the number of space-separated words.', 'A single line of words.', 'Word count.', '1 <= len <= 1000', [{ input: 'hello world foo', expected: '3' }], [{ input: 'one', expected: '1' }], 15),
  Q('Second Largest', 'medium', ['Arrays'], 'Read N then N integers; print the second largest distinct value.', 'Line1: N. Line2: N integers.', 'Second largest.', '2 <= N <= 1000', [{ input: '4\n3 1 4 2', expected: '3' }], [{ input: '5\n10 5 8 8 2', expected: '8' }], 15),
  Q('Power', 'medium', ['Math'], 'Print a raised to the power b.', 'Two integers a and b.', 'a^b.', '0 <= b <= 20', [{ input: '2 10', expected: '1024' }], [{ input: '3 3', expected: '27' }, { input: '5 0', expected: '1' }], 15),
  Q('Binary Representation', 'medium', ['Math', 'Bit Manipulation'], 'Print the binary representation of N (no leading zeros).', 'A positive integer N.', 'Binary string.', '1 <= N <= 1e6', [{ input: '5', expected: '101' }], [{ input: '8', expected: '1000' }, { input: '1', expected: '1' }], 15),
  Q('Count Uppercase Letters', 'medium', ['Strings'], 'Print the number of uppercase letters.', 'A single line string.', 'Count.', '1 <= len <= 1000', [{ input: 'HelloWorld', expected: '2' }], [{ input: 'ABCdef', expected: '3' }], 15),
  Q('Anagram Check', 'medium', ['Strings', 'Hashing'], 'Two space-separated words; print YES if they are anagrams else NO.', 'Two words on one line.', 'YES or NO.', '1 <= len <= 1000', [{ input: 'listen silent', expected: 'YES' }], [{ input: 'hello world', expected: 'NO' }], 15),
  Q('Sort Array Ascending', 'medium', ['Arrays', 'Sorting'], 'Read N then N integers; print them sorted ascending, space-separated.', 'Line1: N. Line2: N integers.', 'Sorted integers.', '1 <= N <= 1000', [{ input: '5\n3 1 4 1 5', expected: '1 1 3 4 5' }], [{ input: '3\n9 8 7', expected: '7 8 9' }], 15),
  Q('Sum of Even Numbers', 'medium', ['Math'], 'Print the sum of even numbers from 1 to N.', 'An integer N.', 'Sum of evens.', '1 <= N <= 1e5', [{ input: '10', expected: '30' }], [{ input: '5', expected: '6' }], 15),
  Q('LCM of Two Numbers', 'medium', ['Math'], 'Print the least common multiple of two positive integers.', 'Two space-separated integers.', 'Their LCM.', '1 <= a,b <= 1e4', [{ input: '4 6', expected: '12' }], [{ input: '3 5', expected: '15' }], 15),
  Q('Largest Digit', 'medium', ['Math'], 'Print the largest digit in N.', 'A non-negative integer N.', 'Largest digit.', '0 <= N <= 1e9', [{ input: '5847', expected: '8' }], [{ input: '111', expected: '1' }], 15),
  Q('Remove Duplicates', 'medium', ['Arrays', 'Hashing'], 'Print the integers keeping first occurrence only, space-separated.', 'A line of space-separated integers.', 'De-duplicated integers.', '1 <= count <= 1000', [{ input: '1 2 2 3 3 3', expected: '1 2 3' }], [{ input: '5 5 5', expected: '5' }], 15),
  Q('Character Frequency', 'medium', ['Strings', 'Hashing'], 'A string and a character; print how many times the character appears.', 'A word and a character separated by space.', 'Count.', '1 <= len <= 1000', [{ input: 'hello l', expected: '2' }], [{ input: 'banana a', expected: '3' }], 15),

  // ---------------- HARD (12) ----------------
  Q('Two Sum (indices)', 'hard', ['Arrays', 'Hashing'], 'Given target and N numbers, print 0-based indices of two numbers adding to target (smaller index first). Exactly one solution.', 'Line1: N target. Line2: N integers.', 'Two indices.', '2 <= N <= 1000', [{ input: '4 9\n2 7 11 15', expected: '0 1' }], [{ input: '3 6\n3 2 4', expected: '1 2' }], 20),
  Q('Longest Word', 'hard', ['Strings'], 'Print the longest word (first one if tie).', 'A line of space-separated words.', 'The longest word.', '1 <= len <= 1000', [{ input: 'the quick brown', expected: 'quick' }], [{ input: 'a bb ccc', expected: 'ccc' }], 20),
  Q('Binary Search', 'hard', ['Arrays', 'Searching'], 'Given N, target and a sorted array, print the 0-based index of target (-1 if absent).', 'Line1: N target. Line2: N sorted integers.', 'Index or -1.', '1 <= N <= 1e5', [{ input: '5 7\n1 3 5 7 9', expected: '3' }], [{ input: '4 1\n1 2 3 4', expected: '0' }], 20),
  Q('Sum of Primes', 'hard', ['Math'], 'Print the sum of all primes <= N.', 'An integer N.', 'Sum of primes.', '1 <= N <= 1e5', [{ input: '10', expected: '17' }], [{ input: '5', expected: '10' }], 20),
  Q('Decimal to Hexadecimal', 'hard', ['Math'], 'Print the uppercase hexadecimal representation of N.', 'A non-negative integer N.', 'Hex string (uppercase).', '0 <= N <= 1e9', [{ input: '255', expected: 'FF' }], [{ input: '16', expected: '10' }, { input: '10', expected: 'A' }], 20),
  Q('Count Set Bits', 'hard', ['Bit Manipulation'], 'Print the number of 1 bits in the binary representation of N.', 'A non-negative integer N.', 'Set-bit count.', '0 <= N <= 1e9', [{ input: '7', expected: '3' }], [{ input: '8', expected: '1' }, { input: '255', expected: '8' }], 20),
  Q('Pascal Triangle Row', 'hard', ['Dynamic Programming', 'Math'], 'Print the Nth row (0-indexed) of Pascal triangle, space-separated.', 'A non-negative integer N.', 'Row values.', '0 <= N <= 30', [{ input: '3', expected: '1 3 3 1' }], [{ input: '0', expected: '1' }, { input: '4', expected: '1 4 6 4 1' }], 20),
  Q('Caesar Cipher', 'hard', ['Strings'], 'Shift each lowercase letter forward by 3 (wrapping z->c). Print the result.', 'A lowercase string.', 'Encoded string.', '1 <= len <= 1000', [{ input: 'abc', expected: 'def' }], [{ input: 'xyz', expected: 'abc' }], 20),
  Q('Balanced Parentheses', 'hard', ['Stacks', 'Strings'], 'Print YES if the parentheses string is balanced else NO.', 'A string of ( and ).', 'YES or NO.', '1 <= len <= 1000', [{ input: '(())', expected: 'YES' }], [{ input: '(()', expected: 'NO' }, { input: '()()', expected: 'YES' }], 20),
  Q('String Compression', 'hard', ['Strings'], 'Run-length encode the string: each run becomes char+count (e.g. aaabbc -> a3b2c1).', 'A single line string.', 'Compressed string.', '1 <= len <= 1000', [{ input: 'aaabbc', expected: 'a3b2c1' }], [{ input: 'abc', expected: 'a1b1c1' }], 20),
  Q('Sum of Squares', 'hard', ['Math'], 'Print the sum of squares from 1 to N (1^2 + 2^2 + ... + N^2).', 'An integer N.', 'Sum of squares.', '1 <= N <= 1e4', [{ input: '3', expected: '14' }], [{ input: '5', expected: '55' }], 20),
  Q('Number of Divisors', 'hard', ['Math'], 'Print the number of positive divisors of N.', 'A positive integer N.', 'Divisor count.', '1 <= N <= 1e6', [{ input: '12', expected: '6' }], [{ input: '7', expected: '2' }, { input: '1', expected: '1' }], 20),
];

// Seed the library — additive (inserts any titles not already present).
router.post('/seed', verifyToken, async (req, res) => {
  try {
    const { data: existing, error: exErr } = await supabase
      .from('question_library')
      .select('title');
    if (exErr) throw exErr;

    const have = new Set((existing || []).map((r) => r.title));
    const toInsert = SEED.filter((q) => !have.has(q.title));
    if (toInsert.length === 0) {
      return res.json({ message: 'Library already up to date', inserted: 0, total: have.size });
    }
    const { error } = await supabase.from('question_library').insert(toInsert);
    if (error) throw error;
    res.json({ message: 'Library seeded', inserted: toInsert.length, total: have.size + toInsert.length });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List / search / filter library questions.
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, difficulty, tag } = req.query;
    let q = supabase.from('question_library').select('*').order('difficulty', { ascending: true });
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

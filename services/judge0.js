const axios = require('axios');

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_HOST = (() => {
  try {
    return new URL(JUDGE0_URL).host;
  } catch {
    return 'judge0-ce.p.rapidapi.com';
  }
})();

const languageMap = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
  c: 50
};

const headers = {
  'content-type': 'application/json',
  'x-rapidapi-key': JUDGE0_KEY,
  'x-rapidapi-host': JUDGE0_HOST
};

const executeCode = async (code, language = 'python', input = '') => {
  if (!JUDGE0_KEY) {
    throw new Error('Judge0 not configured: JUDGE0_API_KEY is missing.');
  }

  try {
    const languageId = languageMap[language] || languageMap.python;

    const createResponse = await axios.post(
      `${JUDGE0_URL}/submissions`,
      { source_code: code, language_id: languageId, stdin: input },
      { headers }
    );

    const tokenId = createResponse.data.token;

    let result = null;
    for (let i = 0; i < 20; i++) {
      const checkResponse = await axios.get(
        `${JUDGE0_URL}/submissions/${tokenId}`,
        { headers }
      );
      result = checkResponse.data;

      if (result.status && result.status.id <= 2) {
        // Still in queue / processing
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        break;
      }
    }

    return {
      status: result.status ? result.status.description : 'Unknown',
      output: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || ''
    };
  } catch (error) {
    console.error('Judge0 execution error:', error.message);
    throw new Error('Code execution failed');
  }
};

/**
 * Run code against a list of test cases.
 * tests: [{ input, expected }]
 * Returns [{ input, expected, output, passed, status }]
 */
const runAgainstTests = async (code, language = 'python', tests = []) => {
  const results = [];
  for (const t of tests) {
    let r;
    try {
      r = await executeCode(code, language, t.input || '');
    } catch {
      r = { status: 'Error', output: '', stderr: 'execution failed' };
    }
    const output = (r.output || '').replace(/\s+$/, '');
    const expected = (t.expected || '').replace(/\s+$/, '');
    results.push({
      input: t.input || '',
      expected,
      output,
      passed: output === expected && r.status === 'Accepted',
      status: r.status,
    });
  }
  return results;
};

module.exports = { executeCode, runAgainstTests, languageMap };

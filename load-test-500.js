// ====================================================================
// TestMakon - 500 Concurrent Students Load Test Script (k6)
// Scenario: 500 simultaneous students taking an exam
//
// Usage:
//   1. Install k6 (https://k6.io/docs/get-started/installation/)
//   2. Run: k6 run load-test-500.js
// ====================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Warm up
    { duration: '1m', target: 500 },  // Ramp up to 500 concurrent students
    { duration: '2m', target: 500 },  // Stay at 500 concurrent students
    { duration: '30s', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests within 500ms, 99% within 1s
    http_req_failed: ['rate<0.01'],                 // Error rate below 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  const vuId = __VU;
  const iteration = __ITER;
  const studentPhone = `+998 99 ${String(vuId).padStart(3, '0')} 00 11`;

  // Step 1: Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
  });

  // Step 2: Request assigned tests list
  const testsRes = http.get(`${BASE_URL}/api/tests?studentId=prof-student-01`);
  check(testsRes, {
    'tests list retrieved': (r) => r.status === 200,
    'has tests': (r) => JSON.parse(r.body).tests.length > 0,
  });

  const tests = JSON.parse(testsRes.body).tests;
  const targetTest = tests[0];

  if (!targetTest) {
    sleep(1);
    return;
  }

  // Step 3: Start test attempt
  const startPayload = JSON.stringify({ studentId: 'prof-student-01' });
  const startRes = http.post(
    `${BASE_URL}/api/tests/${targetTest.id}/start`,
    startPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  const startSuccess = check(startRes, {
    'test started or resumed': (r) => r.status === 200,
  });

  if (!startSuccess) {
    sleep(1);
    return;
  }

  const attemptData = JSON.parse(startRes.body);
  const attemptId = attemptData.attempt?.id;
  const questions = attemptData.test?.questions || [];

  sleep(1);

  // Step 4: Simulate answering questions and autosaving
  const simulatedAnswers = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const optionLetters = ['A', 'B', 'C', 'D'];
    simulatedAnswers[q.id] = optionLetters[i % optionLetters.length];

    // Autosave every 2 questions
    if (i % 2 === 0 && attemptId) {
      const savePayload = JSON.stringify({
        answers: simulatedAnswers,
        tabExitsCount: 0,
      });

      const saveRes = http.post(
        `${BASE_URL}/api/tests/attempts/${attemptId}/save`,
        savePayload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      check(saveRes, {
        'autosave successful': (r) => r.status === 200,
      });

      sleep(0.5); // Debounced typing delay
    }
  }

  // Step 5: Final submission with server-side scoring
  if (attemptId) {
    const submitPayload = JSON.stringify({
      finalAnswers: simulatedAnswers,
      tabExitsCount: 0,
    });

    const submitRes = http.post(
      `${BASE_URL}/api/tests/attempts/${attemptId}/submit`,
      submitPayload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(submitRes, {
      'test submitted and scored': (r) => r.status === 200,
      'score received': (r) => JSON.parse(r.body).result !== undefined,
    });
  }

  sleep(2);
}

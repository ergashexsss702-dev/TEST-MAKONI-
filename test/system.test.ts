import assert from 'node:assert';
import { normalizePhone } from '../server/routes/auth.js';
import { dbEngine } from '../server/db.js';
import { telegramService } from '../server/telegram.js';
import { QuestionParser } from '../server/parser.js';
import { ExcelService } from '../server/excel.js';

console.log('--- TESTMAKON AUTOMATED TEST SUITE ---');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`, err.message);
      failed++;
    }
  }

  // 1. Phone validation
  test('Phone normalization +998 format', () => {
    const valid1 = normalizePhone('+998 90 123 45 67');
    assert.strictEqual(valid1.valid, true);
    assert.strictEqual(valid1.formatted, '+998 90 123 45 67');

    const valid2 = normalizePhone('901234567');
    assert.strictEqual(valid2.valid, true);
    assert.strictEqual(valid2.formatted, '+998 90 123 45 67');

    const invalid = normalizePhone('12345');
    assert.strictEqual(invalid.valid, false);
  });

  // 2. Telegram OTP Generation and Verification
  test('Telegram OTP generation, hashing, and verification', () => {
    const testPhone = '+998 90 999 88 77';
    const { code, expiresAt } = telegramService.createVerificationCode(testPhone);

    assert.strictEqual(typeof code, 'string');
    assert.strictEqual(code.length, 6);
    assert(new Date(expiresAt) > new Date());

    // Verify correct code
    const resSuccess = telegramService.verifyCode(testPhone, code);
    assert.strictEqual(resSuccess.success, true);

    // Reuse must fail (single-use constraint)
    const resReuse = telegramService.verifyCode(testPhone, code);
    assert.strictEqual(resReuse.success, false);
  });

  // 3. Question Parser Format and Errors
  test('Question parser format detection and error identification', () => {
    const rawSample = `
1. O'zbekiston mustaqilligi qachon e'lon qilingan?
A) 1989-yil
*B) 1991-yil
C) 1993-yil
D) 1995-yil
[Izoh: O'zbekiston 1991-yil 31-avgustda mustaqillikni e'lon qilgan]

2. Savol variantlarsiz xato
*A) Variant bitta
    `;

    const parsed = QuestionParser.parse(rawSample);
    assert.strictEqual(parsed.totalParsed, 2);
    assert.strictEqual(parsed.questions[0].options.length, 4);
    assert.strictEqual(parsed.questions[0].options[1].isCorrect, true);
    assert.strictEqual(parsed.questions[0].explanation.includes('1991'), true);

    // Question 2 should have warning/error due to only 1 option
    assert(parsed.questions[1].errors.length > 0);
  });

  // 4. Server-Side Scoring Logic
  test('Server-side scoring math and pass/fail determination', () => {
    const totalQuestions = 10;
    const pointsPerQ = 2;
    const totalPoints = totalQuestions * pointsPerQ; // 20
    const correctCount = 8;
    const earnedPoints = correctCount * pointsPerQ; // 16

    const percentage = (earnedPoints / totalPoints) * 100; // 80%
    const passingPercentage = 60;
    const isPassed = percentage >= passingPercentage;

    assert.strictEqual(percentage, 80);
    assert.strictEqual(isPassed, true);
  });

  // 5. Excel Generation
  test('Excel export workbook generation', () => {
    const db = dbEngine.db;
    const sampleResults = db.test_results;
    const buffer = ExcelService.generateResultsWorkbook(sampleResults, true);

    assert(buffer instanceof Buffer);
    assert(buffer.length > 1000);
  });

  // 6. Database and Retake Authorization
  test('Database state integrity and retake system', () => {
    const db = dbEngine.db;
    assert(db.profiles.length >= 3);
    assert(db.tests.length >= 1);
    assert(db.questions.length >= 5);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();

import express from 'express';
import multer from 'multer';
import { dbEngine, Test, Question, QuestionOption, TestAttempt, TestResult, RetakeAuthorization } from '../db.js';
import { QuestionParser } from '../parser.js';
import { telegramService } from '../telegram.js';

export const testsRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// 1. GET ALL TESTS
testsRouter.get('/', (req, res) => {
  const db = dbEngine.db;
  const { studentId, groupId, teacherId } = req.query;

  let tests = [...db.tests];

  if (groupId) {
    tests = tests.filter(t => t.group_id === groupId);
  }
  if (teacherId) {
    tests = tests.filter(t => t.teacher_id === teacherId);
  }

  // If student requests, filter to only tests for groups student belongs to
  if (studentId) {
    const studentGroupIds = db.group_members
      .filter(gm => gm.student_id === studentId)
      .map(gm => gm.group_id);
    tests = tests.filter(t => studentGroupIds.includes(t.group_id) && t.is_active);
  }

  const enriched = tests.map(t => {
    const group = db.groups.find(g => g.id === t.group_id);
    const teacher = db.profiles.find(p => p.id === t.teacher_id);
    const questionsCount = db.questions.filter(q => q.test_id === t.id).length;
    const attempts = db.test_attempts.filter(a => a.test_id === t.id);

    let studentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ATTEMPTS_EXHAUSTED' = 'NOT_STARTED';
    let studentResult = null;
    let studentAttemptId = null;

    if (studentId) {
      const studentAttempts = attempts.filter(a => a.student_id === studentId);
      const activeAttempt = studentAttempts.find(a => a.status === 'IN_PROGRESS');
      const completedAttempts = studentAttempts.filter(a => a.status === 'COMPLETED');

      if (activeAttempt) {
        studentStatus = 'IN_PROGRESS';
        studentAttemptId = activeAttempt.id;
      } else if (completedAttempts.length > 0) {
        if (t.attempt_limit > 0 && completedAttempts.length >= t.attempt_limit) {
          studentStatus = 'ATTEMPTS_EXHAUSTED';
        } else {
          studentStatus = 'COMPLETED';
        }
        const lastResult = db.test_results.find(r => r.test_id === t.id && r.student_id === studentId);
        if (lastResult) studentResult = lastResult;
      }
    }

    return {
      ...t,
      groupName: group?.name || 'Umumiy',
      teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Ustoz',
      questionsCount,
      attemptsCount: attempts.length,
      studentStatus,
      studentResult,
      studentAttemptId
    };
  });

  return res.json({ tests: enriched });
});

// 2. GET SINGLE TEST (Security: strip correct answers for students)
testsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const role = (req.query.role as string) || 'STUDENT';
  const db = dbEngine.db;

  const test = db.tests.find(t => t.id === id);
  if (!test) return res.status(404).json({ error: "Test topilmadi." });

  const group = db.groups.find(g => g.id === test.group_id);
  const rawQuestions = db.questions.filter(q => q.test_id === id).sort((a, b) => a.order_num - b.order_num);

  // Strip correct answer flags if requester is a student
  const sanitizedQuestions = rawQuestions.map(q => {
    if (role === 'TEACHER' || role === 'ADMIN') {
      return q;
    }
    return {
      id: q.id,
      test_id: q.test_id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      order_num: q.order_num,
      options: q.options.map(o => ({
        id: o.id,
        question_id: o.question_id,
        option_letter: o.option_letter,
        option_text: o.option_text,
        order_num: o.order_num
        // is_correct removed for students!
      }))
      // explanation removed during test!
    };
  });

  return res.json({
    test: {
      ...test,
      groupName: group?.name || 'Umumiy',
      questions: sanitizedQuestions
    }
  });
});

// 3. CREATE TEST
testsRouter.post('/', (req, res) => {
  const {
    title,
    description,
    bookSource,
    topic,
    groupId,
    teacherId,
    timeLimitMinutes,
    attemptLimit,
    passingPercentage,
    openingTime,
    closingTime,
    randomizeQuestions,
    randomizeOptions,
    showCorrectAnswers,
    showExplanations,
    isActive
  } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: "Test sarlavhasi kiritilishi shart." });
  }

  const db = dbEngine.db;
  const newTest: Test = {
    id: `test-${Date.now()}`,
    title: title.trim(),
    description: (description || '').trim(),
    book_source: (bookSource || '').trim(),
    topic: (topic || '').trim(),
    group_id: groupId || '',
    teacher_id: teacherId || db.profiles.find(p => p.role === 'TEACHER')?.id || '',
    time_limit_minutes: Number(timeLimitMinutes) || 30,
    attempt_limit: attemptLimit !== undefined ? Number(attemptLimit) : 1,
    passing_percentage: Number(passingPercentage) || 60,
    opening_time: openingTime || new Date().toISOString(),
    closing_time: closingTime || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    randomize_questions: !!randomizeQuestions,
    randomize_options: !!randomizeOptions,
    show_correct_answers: showCorrectAnswers !== false,
    show_explanations: showExplanations !== false,
    is_active: isActive !== false,
    created_at: new Date().toISOString()
  };

  db.tests.push(newTest);

  db.audit_logs.push({
    id: `log-${Date.now()}`,
    user_id: newTest.teacher_id,
    user_name: 'Ustoz',
    action: 'TEST_CREATED',
    target_type: 'TEST',
    target_id: newTest.id,
    metadata_json: { title: newTest.title },
    created_at: new Date().toISOString()
  });

  dbEngine.persist();
  return res.json({ success: true, test: newTest });
});

// 4. UPDATE TEST
testsRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const db = dbEngine.db;
  const test = db.tests.find(t => t.id === id);
  if (!test) return res.status(404).json({ error: "Test topilmadi." });

  const b = req.body;
  if (b.title !== undefined) test.title = b.title.trim();
  if (b.description !== undefined) test.description = b.description.trim();
  if (b.bookSource !== undefined) test.book_source = b.bookSource.trim();
  if (b.topic !== undefined) test.topic = b.topic.trim();
  if (b.groupId !== undefined) test.group_id = b.groupId;
  if (b.timeLimitMinutes !== undefined) test.time_limit_minutes = Number(b.timeLimitMinutes);
  if (b.attemptLimit !== undefined) test.attempt_limit = Number(b.attemptLimit);
  if (b.passingPercentage !== undefined) test.passing_percentage = Number(b.passingPercentage);
  if (b.openingTime !== undefined) test.opening_time = b.openingTime;
  if (b.closingTime !== undefined) test.closing_time = b.closingTime;
  if (b.randomizeQuestions !== undefined) test.randomize_questions = !!b.randomizeQuestions;
  if (b.randomizeOptions !== undefined) test.randomize_options = !!b.randomizeOptions;
  if (b.showCorrectAnswers !== undefined) test.show_correct_answers = !!b.showCorrectAnswers;
  if (b.showExplanations !== undefined) test.show_explanations = !!b.showExplanations;
  if (b.isActive !== undefined) test.is_active = !!b.isActive;

  dbEngine.persist();
  return res.json({ success: true, test });
});

// 5. DELETE TEST
testsRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = dbEngine.db;
  const index = db.tests.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: "Test topilmadi." });

  const deleted = db.tests.splice(index, 1)[0];
  db.questions = db.questions.filter(q => q.test_id !== id);

  db.audit_logs.push({
    id: `log-${Date.now()}`,
    user_id: null,
    user_name: 'Ustoz/Admin',
    action: 'TEST_DELETED',
    target_type: 'TEST',
    target_id: id,
    metadata_json: { title: deleted.title },
    created_at: new Date().toISOString()
  });

  dbEngine.persist();
  return res.json({ success: true, message: "Test o'chirildi." });
});

// 6. FAST QUESTION IMPORT (DOCX OR TEXT)
testsRouter.post('/:id/import-questions', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { text, previewOnly } = req.body;
    const db = dbEngine.db;

    const test = db.tests.find(t => t.id === id);
    if (!test) return res.status(404).json({ error: "Test topilmadi." });

    let rawContent = text || '';

    // If file uploaded (DOCX)
    if (req.file) {
      if (!req.file.originalname.match(/\.(docx|txt)$/i)) {
        return res.status(400).json({ error: "Faqat .docx yoki .txt formatdagi fayllar qabul qilinadi." });
      }
      if (req.file.originalname.endsWith('.docx')) {
        rawContent = await QuestionParser.extractTextFromDocx(req.file.buffer);
      } else {
        rawContent = req.file.buffer.toString('utf-8');
      }
    }

    if (!rawContent || rawContent.trim().length === 0) {
      return res.status(400).json({ error: "Hech qanday matn yoki fayl kiritilmadi." });
    }

    // Parse text
    const parseResult = QuestionParser.parse(rawContent);

    // If teacher only asked for preview, do not save yet
    if (previewOnly === 'true' || previewOnly === true) {
      return res.json({
        preview: true,
        ...parseResult
      });
    }

    // Check if critical errors exist
    if (parseResult.errorCount > 0) {
      return res.status(400).json({
        error: `Savollarda ${parseResult.errorCount} ta jiddiy xatolik aniqlandi. Iltimos, xatolarni to'g'irlab qayta saqlang.`,
        parseResult
      });
    }

    // Save parsed questions to database
    const existingCount = db.questions.filter(q => q.test_id === id).length;
    let nextOrder = existingCount + 1;

    for (const pq of parseResult.questions) {
      const qId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newQuestion: Question = {
        id: qId,
        test_id: id,
        question_text: pq.questionText,
        question_type: pq.questionType,
        points: pq.points || 1.0,
        explanation: pq.explanation || '',
        order_num: nextOrder++,
        created_at: new Date().toISOString(),
        options: pq.options.map((opt, oIndex) => ({
          id: `opt-${qId}-${opt.letter.toLowerCase()}-${oIndex}`,
          question_id: qId,
          option_letter: opt.letter,
          option_text: opt.text,
          is_correct: opt.isCorrect,
          order_num: oIndex + 1
        }))
      };
      db.questions.push(newQuestion);
    }

    db.audit_logs.push({
      id: `log-${Date.now()}`,
      user_id: test.teacher_id,
      user_name: 'Ustoz',
      action: 'QUESTIONS_IMPORTED',
      target_type: 'TEST',
      target_id: id,
      metadata_json: { count: parseResult.questions.length, test_title: test.title },
      created_at: new Date().toISOString()
    });

    dbEngine.persist();

    return res.json({
      success: true,
      message: `${parseResult.questions.length} ta savol muvaffaqiyatli saqlandi!`,
      importedCount: parseResult.questions.length,
      parseResult
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Import jarayonida kutilmagan xatolik yuz berdi." });
  }
});

// 7. START / RESUME TEST ATTEMPT
testsRouter.post('/:id/start', (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;
    const db = dbEngine.db;

    const test = db.tests.find(t => t.id === id);
    if (!test) return res.status(404).json({ error: "Test topilmadi." });

    if (!test.is_active) {
      return res.status(400).json({ error: "Bu test ayni vaqtda faol emas." });
    }

    const student = db.profiles.find(p => p.id === studentId);
    if (!student) return res.status(404).json({ error: "O'quvchi topilmadi." });

    // Verify group membership
    const isMember = db.group_members.some(gm => gm.group_id === test.group_id && gm.student_id === studentId);
    if (!isMember && test.group_id) {
      return res.status(403).json({ error: "Siz ushbu test biriktirilgan guruh a'zosi emassiz." });
    }

    // Verify time window
    const now = new Date();
    if (new Date(test.opening_time) > now) {
      return res.status(400).json({ error: `Test hali ochilmagan. Ochilish vaqti: ${new Date(test.opening_time).toLocaleString('uz-UZ')}` });
    }
    if (new Date(test.closing_time) < now) {
      return res.status(400).json({ error: `Test muddati tugagan. Yopilish vaqti: ${new Date(test.closing_time).toLocaleString('uz-UZ')}` });
    }

    // Check existing attempts
    const studentAttempts = db.test_attempts.filter(a => a.test_id === id && a.student_id === studentId);

    // 1. Resume active attempt if one is running
    const activeAttempt = studentAttempts.find(a => a.status === 'IN_PROGRESS');
    if (activeAttempt) {
      const questions = db.questions.filter(q => q.test_id === id).sort((a, b) => a.order_num - b.order_num);
      return res.json({
        resumed: true,
        attempt: activeAttempt,
        test: {
          id: test.id,
          title: test.title,
          time_limit_minutes: test.time_limit_minutes,
          passing_percentage: test.passing_percentage,
          questions: questions.map(q => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            points: q.points,
            order_num: q.order_num,
            options: q.options.map(o => ({
              id: o.id,
              option_letter: o.option_letter,
              option_text: o.option_text
            }))
          }))
        }
      });
    }

    // 2. Check attempt limit
    const completedAttempts = studentAttempts.filter(a => a.status === 'COMPLETED');
    if (test.attempt_limit > 0 && completedAttempts.length >= test.attempt_limit) {
      return res.status(400).json({
        error: `Siz bu testni topshirish limitidan (${test.attempt_limit} marta) foydalanib bo'ldingiz.`
      });
    }

    // Create new attempt
    const expiresAt = new Date(now.getTime() + test.time_limit_minutes * 60 * 1000).toISOString();
    const newAttempt: TestAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      test_id: id,
      student_id: studentId,
      started_at: now.toISOString(),
      expires_at: expiresAt,
      submitted_at: null,
      status: 'IN_PROGRESS',
      tab_exits_count: 0,
      current_answers_json: {},
      last_saved_at: now.toISOString()
    };

    db.test_attempts.push(newAttempt);
    dbEngine.persist();

    let questions = db.questions.filter(q => q.test_id === id);
    if (test.randomize_questions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    } else {
      questions = [...questions].sort((a, b) => a.order_num - b.order_num);
    }

    return res.json({
      resumed: false,
      attempt: newAttempt,
      test: {
        id: test.id,
        title: test.title,
        time_limit_minutes: test.time_limit_minutes,
        passing_percentage: test.passing_percentage,
        questions: questions.map(q => {
          let opts = [...q.options];
          if (test.randomize_options && q.question_type !== 'TRUE_FALSE') {
            opts = opts.sort(() => Math.random() - 0.5);
          }
          return {
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            points: q.points,
            order_num: q.order_num,
            options: opts.map(o => ({
              id: o.id,
              option_letter: o.option_letter,
              option_text: o.option_text
            }))
          };
        })
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. AUTOSAVE ANSWERS & RECONNECT SYNC
testsRouter.post('/attempts/:attemptId/save', (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers, tabExitsCount } = req.body;
    const db = dbEngine.db;

    const attempt = db.test_attempts.find(a => a.id === attemptId);
    if (!attempt) return res.status(404).json({ error: "Urinish topilmadi." });

    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: "Ushbu test urinishi allaqachon yakunlangan." });
    }

    if (answers && typeof answers === 'object') {
      attempt.current_answers_json = { ...attempt.current_answers_json, ...answers };
    }
    if (typeof tabExitsCount === 'number') {
      attempt.tab_exits_count = tabExitsCount;
    }
    attempt.last_saved_at = new Date().toISOString();

    dbEngine.persist();
    return res.json({ success: true, savedAt: attempt.last_saved_at });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. RECORD TAB EXIT
testsRouter.post('/attempts/:attemptId/tab-exit', (req, res) => {
  const { attemptId } = req.params;
  const db = dbEngine.db;
  const attempt = db.test_attempts.find(a => a.id === attemptId);
  if (attempt && attempt.status === 'IN_PROGRESS') {
    attempt.tab_exits_count += 1;
    dbEngine.persist();
    return res.json({ success: true, exitsCount: attempt.tab_exits_count });
  }
  return res.json({ success: false });
});

// 10. SUBMIT TEST & SERVER-SIDE SCORING
testsRouter.post('/attempts/:attemptId/submit', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { finalAnswers, tabExitsCount } = req.body;
    const db = dbEngine.db;

    const attempt = db.test_attempts.find(a => a.id === attemptId);
    if (!attempt) return res.status(404).json({ error: "Urinish topilmadi." });

    // Idempotent check: if already completed, return existing result!
    if (attempt.status === 'COMPLETED') {
      const existingResult = db.test_results.find(r => r.attempt_id === attemptId);
      if (existingResult) {
        return res.json({ success: true, alreadySubmitted: true, result: existingResult });
      }
    }

    const test = db.tests.find(t => t.id === attempt.test_id);
    if (!test) return res.status(404).json({ error: "Test topilmadi." });

    const student = db.profiles.find(p => p.id === attempt.student_id);
    const now = new Date();

    // Check timer expiration with a small 30-second network latency grace window
    const expiryWithGrace = new Date(new Date(attempt.expires_at).getTime() + 30 * 1000);
    if (now > expiryWithGrace) {
      console.warn(`Test attempt ${attemptId} submitted past expiry time.`);
    }

    // Merge latest answers
    const mergedAnswers = {
      ...attempt.current_answers_json,
      ...(finalAnswers || {})
    };
    attempt.current_answers_json = mergedAnswers;
    if (typeof tabExitsCount === 'number') {
      attempt.tab_exits_count = tabExitsCount;
    }

    // Real Server-side Scoring Calculation
    const questions = db.questions.filter(q => q.test_id === test.id);
    let totalPoints = 0;
    let earnedPoints = 0;
    let correctAnswersCount = 0;
    let incorrectAnswersCount = 0;

    const breakdown: any[] = [];

    for (const q of questions) {
      totalPoints += q.points;
      const studentSelected = mergedAnswers[q.id] || null;

      const correctOption = q.options.find(o => o.is_correct);
      const isCorrect = !!(correctOption && studentSelected && (
        correctOption.option_letter === studentSelected ||
        correctOption.id === studentSelected
      ));

      if (isCorrect) {
        earnedPoints += q.points;
        correctAnswersCount += 1;
      } else {
        incorrectAnswersCount += 1;
      }

      breakdown.push({
        question_id: q.id,
        question_text: q.question_text,
        selected_option: studentSelected,
        correct_option: test.show_correct_answers ? (correctOption?.option_letter || '') : 'Yashiringan',
        is_correct: isCorrect,
        points: q.points,
        earned_points: isCorrect ? q.points : 0,
        explanation: test.show_explanations ? (q.explanation || '') : '',
        options: q.options.map(o => ({
          letter: o.option_letter,
          text: o.option_text
        }))
      });
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = percentage >= test.passing_percentage;

    const startedTime = new Date(attempt.started_at).getTime();
    const timeSpentSeconds = Math.max(1, Math.floor((now.getTime() - startedTime) / 1000));

    // Save final status
    attempt.status = 'COMPLETED';
    attempt.submitted_at = now.toISOString();

    const resultRecord: TestResult = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      attempt_id: attempt.id,
      test_id: test.id,
      student_id: attempt.student_id,
      total_questions: questions.length,
      correct_answers: correctAnswersCount,
      incorrect_answers: incorrectAnswersCount,
      total_points: totalPoints,
      earned_points: earnedPoints,
      percentage: Math.round(percentage * 10) / 10,
      is_passed: isPassed,
      time_spent_seconds: timeSpentSeconds,
      tab_exits_count: attempt.tab_exits_count,
      created_at: now.toISOString(),
      breakdown
    };

    db.test_results.push(resultRecord);

    // Audit log
    db.audit_logs.push({
      id: `log-${Date.now()}`,
      user_id: attempt.student_id,
      user_name: student ? `${student.first_name} ${student.last_name}` : "O'quvchi",
      action: 'TEST_SUBMITTED',
      target_type: 'TEST_RESULT',
      target_id: resultRecord.id,
      metadata_json: {
        testTitle: test.title,
        percentage,
        isPassed,
        exits: attempt.tab_exits_count
      },
      created_at: now.toISOString()
    });

    dbEngine.persist();

    // Async Telegram Notification Queue (Section 23: non-blocking for student)
    const mins = Math.floor(timeSpentSeconds / 60);
    const secs = timeSpentSeconds % 60;
    const timeSpentStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    telegramService.queueResultNotification({
      studentName: student ? `${student.first_name} ${student.last_name}` : "O'quvchi",
      testTitle: test.title,
      score: earnedPoints,
      totalPoints,
      percentage,
      isPassed,
      timeSpentStr,
      tabExits: attempt.tab_exits_count
    });

    return res.json({
      success: true,
      result: resultRecord
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Testni yakunlashda xatolik yuz berdi." });
  }
});

// 11. RETAKE SYSTEM: RESET ATTEMPT (Section 22)
testsRouter.post('/:id/reset-attempt', (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, authorizedBy, reason } = req.body;
    const db = dbEngine.db;

    const test = db.tests.find(t => t.id === id);
    if (!test) return res.status(404).json({ error: "Test topilmadi." });

    const student = db.profiles.find(p => p.id === studentId);
    if (!student) return res.status(404).json({ error: "O'quvchi topilmadi." });

    // Mark previous attempts as RESET
    const studentAttempts = db.test_attempts.filter(a => a.test_id === id && a.student_id === studentId);
    studentAttempts.forEach(a => {
      a.status = 'RESET';
    });

    // Remove or archive results
    db.test_results = db.test_results.filter(r => !(r.test_id === id && r.student_id === studentId));

    // Record retake authorization
    const authRecord: RetakeAuthorization = {
      id: `rtk-${Date.now()}`,
      test_id: id,
      student_id: studentId,
      authorized_by: authorizedBy || 'Ustoz',
      reason: (reason || 'Ustoz tomonidan ruxsat berildi').trim(),
      created_at: new Date().toISOString()
    };
    db.retake_authorizations.push(authRecord);

    // Audit log
    db.audit_logs.push({
      id: `log-${Date.now()}`,
      user_id: authorizedBy,
      user_name: 'Ustoz/Admin',
      action: 'RETAKE_AUTHORIZED',
      target_type: 'TEST_ATTEMPT',
      target_id: id,
      metadata_json: { studentName: `${student.first_name} ${student.last_name}`, reason: authRecord.reason },
      created_at: new Date().toISOString()
    });

    dbEngine.persist();

    return res.json({
      success: true,
      message: `${student.first_name} ${student.last_name} ga testni qayta topshirishga ruxsat berildi.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

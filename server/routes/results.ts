import express from 'express';
import { dbEngine, TestResult } from '../db.js';
import { ExcelService } from '../excel.js';

export const resultsRouter = express.Router();

// 1. GET ALL RESULTS WITH COMPREHENSIVE FILTERING
resultsRouter.get('/', (req, res) => {
  const db = dbEngine.db;
  const { groupId, testId, studentId, status, search, limit = '100', offset = '0' } = req.query;

  let results = [...db.test_results].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (testId) {
    results = results.filter(r => r.test_id === testId);
  }
  if (studentId) {
    results = results.filter(r => r.student_id === studentId);
  }
  if (status === 'passed') {
    results = results.filter(r => r.is_passed);
  } else if (status === 'failed') {
    results = results.filter(r => !r.is_passed);
  }

  // Group filter
  if (groupId) {
    const groupTestIds = db.tests.filter(t => t.group_id === groupId).map(t => t.id);
    results = results.filter(r => groupTestIds.includes(r.test_id));
  }

  // Enrich results
  const enriched = results.map(r => {
    const student = db.profiles.find(p => p.id === r.student_id);
    const test = db.tests.find(t => t.id === r.test_id);
    const group = test ? db.groups.find(g => g.id === test.group_id) : null;

    return {
      ...r,
      studentName: student ? `${student.first_name} ${student.last_name}` : "Noma'lum",
      studentPhone: student?.phone || '',
      testTitle: test?.title || 'Test',
      groupName: group?.name || 'Umumiy'
    };
  });

  // Search filter by student name or phone
  let filtered = enriched;
  if (search) {
    const s = (search as string).toLowerCase();
    filtered = filtered.filter(r => 
      r.studentName.toLowerCase().includes(s) || 
      r.studentPhone.includes(s) ||
      r.testTitle.toLowerCase().includes(s)
    );
  }

  const l = parseInt(limit as string, 10) || 100;
  const o = parseInt(offset as string, 10) || 0;
  const paginated = filtered.slice(o, o + l);

  return res.json({
    total: filtered.length,
    results: paginated
  });
});

// 2. GET RESULT BY ID (with full question breakdown)
resultsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const db = dbEngine.db;
  const result = db.test_results.find(r => r.id === id || r.attempt_id === id);

  if (!result) return res.status(404).json({ error: "Natija topilmadi." });

  const student = db.profiles.find(p => p.id === result.student_id);
  const test = db.tests.find(t => t.id === result.test_id);
  const group = test ? db.groups.find(g => g.id === test.group_id) : null;
  const attempt = db.test_attempts.find(a => a.id === result.attempt_id);

  // If breakdown not cached, reconstruct it
  let breakdown = result.breakdown;
  if (!breakdown || breakdown.length === 0) {
    const questions = db.questions.filter(q => q.test_id === result.test_id);
    const answers = attempt?.current_answers_json || {};

    breakdown = questions.map(q => {
      const selected = answers[q.id] || null;
      const correctOpt = q.options.find(o => o.is_correct);
      const isCorrect = !!(correctOpt && selected && (correctOpt.option_letter === selected || correctOpt.id === selected));
      return {
        question_id: q.id,
        question_text: q.question_text,
        selected_option: selected,
        correct_option: test?.show_correct_answers ? (correctOpt?.option_letter || '') : 'Yashiringan',
        is_correct: isCorrect,
        points: q.points,
        earned_points: isCorrect ? q.points : 0,
        explanation: test?.show_explanations ? (q.explanation || '') : '',
        options: q.options.map(o => ({
          letter: o.option_letter,
          text: o.option_text
        }))
      };
    });
  }

  return res.json({
    result: {
      ...result,
      studentName: student ? `${student.first_name} ${student.last_name}` : "Noma'lum",
      studentPhone: student?.phone || '',
      testTitle: test?.title || 'Test',
      groupName: group?.name || 'Umumiy',
      breakdown
    }
  });
});

// 3. EXCEL EXPORT (Section 21)
resultsRouter.get('/export/excel', (req, res) => {
  try {
    const db = dbEngine.db;
    const { groupId, testId, studentId, status, detailed } = req.query;

    let results = [...db.test_results].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (testId) results = results.filter(r => r.test_id === testId);
    if (studentId) results = results.filter(r => r.student_id === studentId);
    if (status === 'passed') results = results.filter(r => r.is_passed);
    if (status === 'failed') results = results.filter(r => !r.is_passed);
    if (groupId) {
      const groupTestIds = db.tests.filter(t => t.group_id === groupId).map(t => t.id);
      results = results.filter(r => groupTestIds.includes(r.test_id));
    }

    const isDetailed = detailed === 'true';
    const excelBuffer = ExcelService.generateResultsWorkbook(results, isDetailed);

    const fileName = `testmakon_natijalar_${new Date().toISOString().substring(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(excelBuffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Excel eksportida xatolik." });
  }
});

// 4. STUDENT ANALYTICS & TIMELINE FOR CHARTS (Section 17)
resultsRouter.get('/students/:studentId/analytics', (req, res) => {
  const { studentId } = req.params;
  const db = dbEngine.db;

  const results = db.test_results
    .filter(r => r.student_id === studentId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const totalCompleted = results.length;
  const passedCount = results.filter(r => r.is_passed).length;
  const failedCount = totalCompleted - passedCount;

  const avgScore = totalCompleted > 0
    ? results.reduce((acc, r) => acc + r.percentage, 0) / totalCompleted
    : 0;

  const bestScore = totalCompleted > 0
    ? Math.max(...results.map(r => r.percentage))
    : 0;

  // Chart data: X axis: Date, Y axis: Percentage
  const timelineData = results.map(r => {
    const test = db.tests.find(t => t.id === r.test_id);
    return {
      date: new Date(r.created_at).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
      fullDate: new Date(r.created_at).toLocaleString('uz-UZ'),
      testTitle: test?.title || 'Test',
      percentage: r.percentage,
      score: r.earned_points,
      total: r.total_points,
      isPassed: r.is_passed
    };
  });

  return res.json({
    totalCompleted,
    passedCount,
    failedCount,
    averageScore: Math.round(avgScore * 10) / 10,
    bestScore: Math.round(bestScore * 10) / 10,
    passRate: totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0,
    timelineData
  });
});

// 5. UNATTEMPTED STUDENTS (Section 19)
resultsRouter.get('/tests/:testId/unattempted', (req, res) => {
  const { testId } = req.params;
  const db = dbEngine.db;

  const test = db.tests.find(t => t.id === testId);
  if (!test) return res.status(404).json({ error: "Test topilmadi." });

  // Get all students enrolled in the test's group
  const groupMembers = db.group_members.filter(gm => gm.group_id === test.group_id);
  const enrolledStudentIds = groupMembers.map(gm => gm.student_id);

  // Get students who have attempted this test
  const attemptedStudentIds = new Set(
    db.test_attempts.filter(a => a.test_id === testId).map(a => a.student_id)
  );

  // Filter unattempted
  const unattempted = enrolledStudentIds
    .filter(sId => !attemptedStudentIds.has(sId))
    .map(sId => {
      const student = db.profiles.find(p => p.id === sId);
      const group = db.groups.find(g => g.id === test.group_id);
      return {
        id: student?.id,
        first_name: student?.first_name || '',
        last_name: student?.last_name || '',
        phone: student?.phone || '',
        group_name: group?.name || '',
        is_verified: student?.is_verified || false
      };
    })
    .filter(s => s.id);

  return res.json({
    testTitle: test.title,
    unattemptedCount: unattempted.length,
    unattempted
  });
});

// 6. QUESTION STATISTICS & DIFFICULTY ANALYSIS (Section 20)
resultsRouter.get('/tests/:testId/question-stats', (req, res) => {
  const { testId } = req.params;
  const db = dbEngine.db;

  const test = db.tests.find(t => t.id === testId);
  if (!test) return res.status(404).json({ error: "Test topilmadi." });

  const questions = db.questions.filter(q => q.test_id === testId).sort((a, b) => a.order_num - b.order_num);
  const attempts = db.test_attempts.filter(a => a.test_id === testId && a.status === 'COMPLETED');

  const stats = questions.map(q => {
    let totalAnswers = 0;
    let correctCount = 0;

    const correctOption = q.options.find(o => o.is_correct);

    attempts.forEach(att => {
      const ans = att.current_answers_json[q.id];
      if (ans) {
        totalAnswers += 1;
        if (correctOption && (ans === correctOption.option_letter || ans === correctOption.id)) {
          correctCount += 1;
        }
      }
    });

    const incorrectCount = totalAnswers - correctCount;
    const correctPercentage = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
    const incorrectPercentage = totalAnswers > 0 ? 100 - correctPercentage : 0;

    // Difficulty tag: >= 75% -> Oson, 45-74% -> O'rtacha, < 45% -> Qiyin
    let difficulty = "O'rtacha";
    let difficultyColor = 'text-amber-600 bg-amber-50';
    if (correctPercentage >= 75) {
      difficulty = 'Oson';
      difficultyColor = 'text-emerald-600 bg-emerald-50';
    } else if (correctPercentage < 45 && totalAnswers > 0) {
      difficulty = 'Qiyin';
      difficultyColor = 'text-rose-600 bg-rose-50';
    }

    return {
      questionId: q.id,
      orderNum: q.order_num,
      questionText: q.question_text,
      totalAttempts: totalAnswers,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      correctPercentage,
      incorrectPercentage,
      difficulty,
      difficultyColor,
      points: q.points
    };
  });

  return res.json({
    testTitle: test.title,
    totalCompletedAttempts: attempts.length,
    questionStats: stats
  });
});

// 7. DELETE RESULT
resultsRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = dbEngine.db;
  const index = db.test_results.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ error: "Natija topilmadi." });

  const deleted = db.test_results.splice(index, 1)[0];

  db.audit_logs.push({
    id: `log-${Date.now()}`,
    user_id: null,
    user_name: 'Ustoz/Admin',
    action: 'RESULT_DELETED',
    target_type: 'RESULT',
    target_id: id,
    metadata_json: { test_id: deleted.test_id, student_id: deleted.student_id },
    created_at: new Date().toISOString()
  });

  dbEngine.persist();
  return res.json({ success: true, message: "Natija o'chirildi." });
});

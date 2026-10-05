import * as XLSX from 'xlsx';
import { TestResult, dbEngine } from './db.js';

export interface ExcelExportFilter {
  groupId?: string;
  testId?: string;
  studentId?: string;
  status?: string; // 'passed' | 'failed' | 'all'
  startDate?: string;
  endDate?: string;
}

export class ExcelService {
  public static generateResultsWorkbook(results: TestResult[], isDetailed = false): Buffer {
    const db = dbEngine.db;

    // Build main results table
    const rows = results.map((r, idx) => {
      const student = db.profiles.find(p => p.id === r.student_id);
      const test = db.tests.find(t => t.id === r.test_id);
      const group = test ? db.groups.find(g => g.id === test.group_id) : null;

      const mins = Math.floor(r.time_spent_seconds / 60);
      const secs = r.time_spent_seconds % 60;
      const timeSpentStr = `${mins} daq ${secs} son`;

      const formattedDate = new Date(r.created_at).toLocaleString('uz-UZ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        'T/r': idx + 1,
        'Ism': student?.first_name || "Noma'lum",
        'Familiya': student?.last_name || "Noma'lum",
        'Telefon': student?.phone || "Noma'lum",
        'Guruh': group?.name || "Biriktirilmagan",
        'Test nomi': test?.title || "Test",
        'Sana': formattedDate,
        'To‘plangan ball': r.earned_points,
        'Jami ball': r.total_points,
        'Foiz': `${r.percentage.toFixed(1)}%`,
        'Natija': r.is_passed ? 'O‘tdi' : 'O‘tmadi',
        'Sarflangan vaqt': timeSpentStr,
        'Oynadan chiqishlar': r.tab_exits_count
      };
    });

    const wb = XLSX.utils.book_new();

    // Sheet 1: Umumiy Natijalar
    const wsResults = XLSX.utils.json_to_sheet(rows);

    // Set column widths for readability
    wsResults['!cols'] = [
      { wch: 5 },  // T/r
      { wch: 15 }, // Ism
      { wch: 16 }, // Familiya
      { wch: 18 }, // Telefon
      { wch: 14 }, // Guruh
      { wch: 32 }, // Test nomi
      { wch: 18 }, // Sana
      { wch: 14 }, // To‘plangan ball
      { wch: 12 }, // Jami ball
      { wch: 10 }, // Foiz
      { wch: 12 }, // Natija
      { wch: 18 }, // Sarflangan vaqt
      { wch: 18 }  // Oynadan chiqishlar
    ];

    XLSX.utils.book_append_sheet(wb, wsResults, 'Natijalar');

    // If detailed export is requested, build sheet 2: Savollar bo'yicha tahlil
    if (isDetailed) {
      const detailedRows: any[] = [];
      let dIndex = 1;

      for (const r of results) {
        const student = db.profiles.find(p => p.id === r.student_id);
        const test = db.tests.find(t => t.id === r.test_id);
        const attempt = db.test_attempts.find(a => a.id === r.attempt_id);
        const questions = db.questions.filter(q => q.test_id === r.test_id);

        if (attempt) {
          questions.forEach(q => {
            const studentAnswer = attempt.current_answers_json[q.id] || '(Belgilanmagan)';
            const correctOpt = q.options.find(o => o.is_correct);
            const isCorrect = correctOpt ? correctOpt.option_letter === studentAnswer : false;

            detailedRows.push({
              '#': dIndex++,
              'O‘quvchi': `${student?.first_name} ${student?.last_name}`,
              'Test': test?.title,
              'Savol tartibi': q.order_num,
              'Savol matni': q.question_text,
              'O‘quvchi javobi': studentAnswer,
              'To‘g‘ri javob': correctOpt ? correctOpt.option_letter : '-',
              'To‘g‘riligi': isCorrect ? 'To‘g‘ri' : 'Noto‘g‘ri',
              'Savol bali': q.points,
              'Olingan ball': isCorrect ? q.points : 0
            });
          });
        }
      }

      if (detailedRows.length > 0) {
        const wsDetailed = XLSX.utils.json_to_sheet(detailedRows);
        wsDetailed['!cols'] = [
          { wch: 5 },
          { wch: 22 },
          { wch: 26 },
          { wch: 12 },
          { wch: 40 },
          { wch: 16 },
          { wch: 14 },
          { wch: 12 },
          { wch: 10 },
          { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, wsDetailed, 'Savollar tahlili');
      }
    }

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

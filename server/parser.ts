import mammoth from 'mammoth';

export interface ParsedOption {
  letter: string;
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  orderNum: number;
  questionText: string;
  questionType: 'SINGLE' | 'TRUE_FALSE';
  options: ParsedOption[];
  points: number;
  explanation: string;
  errors: string[];
  warnings: string[];
}

export interface ParseResult {
  questions: ParsedQuestion[];
  totalParsed: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
  rawIssues: string[];
}

export class QuestionParser {
  // Extract text from DOCX buffer
  public static async extractTextFromDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err: any) {
      throw new Error(`DOCX faylni o'qishda xatolik: ${err.message}`);
    }
  }

  // Parse text into structured questions
  public static parse(rawText: string): ParseResult {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const questions: ParsedQuestion[] = [];
    const rawIssues: string[] = [];

    // Split text into question blocks based on numbering like "1.", "1)", "Savol 1.", etc.
    const blocks: string[][] = [];
    let currentBlock: string[] = [];

    const questionStartRegex = /^(\d+)[\.\)]\s*(.*)$|^Savol\s+(\d+)[\.\:]?\s*(.*)$/i;

    for (const line of lines) {
      if (questionStartRegex.test(line)) {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = [line];
      } else {
        if (currentBlock.length > 0) {
          currentBlock.push(line);
        } else {
          // Lines before first question
          currentBlock.push(line);
        }
      }
    }
    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }

    let expectedOrder = 1;

    for (let bIndex = 0; bIndex < blocks.length; bIndex++) {
      const block = blocks[bIndex];
      const firstLine = block[0];

      const match = firstLine.match(questionStartRegex);
      let detectedNumber = expectedOrder;
      let questionText = firstLine;

      if (match) {
        const numStr = match[1] || match[3];
        detectedNumber = parseInt(numStr, 10) || expectedOrder;
        questionText = (match[2] || match[4] || '').trim();
      }

      const options: ParsedOption[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      let explanation = '';
      let points = 1.0;

      // Iterate remaining lines in the block
      for (let i = 1; i < block.length; i++) {
        const line = block[i];

        // Check for points metadata: [Ball: 2], [2 ball], etc.
        const pointsMatch = line.match(/\[(?:Ball|ball|Points|points)\s*:\s*([\d\.]+)\]|\[([\d\.]+)\s*(?:ball|points)\]/i);
        if (pointsMatch) {
          const p = parseFloat(pointsMatch[1] || pointsMatch[2]);
          if (!isNaN(p) && p > 0) points = p;
          continue;
        }

        // Check for explanation: [Izoh: ...], Izoh: ...
        const explanationMatch = line.match(/^\[?(?:Izoh|Tushuntirish|Explanation)\s*:\s*(.*?)\]?$/i);
        if (explanationMatch) {
          explanation = explanationMatch[1].trim();
          continue;
        }

        // Option detection: A) text, *A) text, A. text, *A. text, A - text
        // Handles * prefix or suffix or anywhere at start
        const isStarPrefix = line.startsWith('*');
        const cleanOptionLine = isStarPrefix ? line.substring(1).trim() : line;

        const optionMatch = cleanOptionLine.match(/^([A-Da-d]|TRUE|FALSE|To‘g‘ri|Noto‘g‘ri)[\)\.\-\:]\s*(.*)$/i);

        if (optionMatch) {
          const rawLetter = optionMatch[1].toUpperCase();
          const optionText = optionMatch[2].trim();
          const isCorrect = isStarPrefix || line.includes('*');
          const cleanText = optionText.replace(/\*/g, '').trim();

          let normalizedLetter = rawLetter;
          if (rawLetter === 'TO‘G‘RI' || rawLetter === 'TOGRI' || rawLetter === 'TRUE') {
            normalizedLetter = 'A';
          } else if (rawLetter === 'NOTO‘G‘RI' || rawLetter === 'NOTOGRI' || rawLetter === 'FALSE') {
            normalizedLetter = 'B';
          }

          options.push({
            letter: normalizedLetter,
            text: cleanText,
            isCorrect
          });
        } else {
          // If line does not match option pattern, it might be continuation of question text
          if (options.length === 0) {
            questionText += (questionText ? ' ' : '') + line;
          } else {
            // Continuation of last option
            options[options.length - 1].text += ' ' + line;
          }
        }
      }

      // Check question type
      const isTrueFalse = options.length === 2 && 
        (options.some(o => /^(To‘g‘ri|To'g'ri|Togri|True)$/i.test(o.text)) || 
         options.some(o => /^(Noto‘g‘ri|Noto'g'ri|Notogri|False)$/i.test(o.text)));
      
      const questionType = isTrueFalse ? 'TRUE_FALSE' : 'SINGLE';

      // Validation Rules
      if (!questionText || questionText.trim().length === 0) {
        errors.push("Savol matni bo'sh bo'lishi mumkin emas.");
      }

      if (detectedNumber !== expectedOrder) {
        warnings.push(`Tartib raqamida nomuvofiqlik: kutilgan raqam ${expectedOrder}, yozilgani ${detectedNumber}.`);
      }

      if (options.length === 0) {
        errors.push("Savolga javob variantlari topilmadi.");
      } else if (options.length === 1) {
        errors.push("Faqat bitta variant mavjud. Kamida 2 ta variant bo'lishi shart.");
      } else if (options.length < 4 && !isTrueFalse) {
        warnings.push(`Variantlar soni kam (${options.length} ta). Standart testlarda 4 ta variant (A, B, C, D) tavsiya etiladi.`);
      }

      // Check duplicates
      const optionTexts = options.map(o => o.text.toLowerCase().trim());
      const hasDuplicates = new Set(optionTexts).size !== optionTexts.length;
      if (hasDuplicates) {
        warnings.push("Variantlar orasida bir xil takrorlangan matnlar mavjud.");
      }

      // Check correct answers count
      const correctCount = options.filter(o => o.isCorrect).length;
      if (correctCount === 0) {
        errors.push("To'g'ri javob belgilanmagan (* belgisi qo'yilmagan).");
      } else if (correctCount > 1 && questionType === 'SINGLE') {
        errors.push(`Bir nechta to'g'ri javob belgilangan (${correctCount} ta *). Faqat bitta to'g'ri variant ruxsat etiladi.`);
      }

      if (errors.length > 0) {
        rawIssues.push(`Savol #${detectedNumber}: ${errors.join(', ')}`);
      }

      questions.push({
        orderNum: expectedOrder,
        questionText: questionText.trim(),
        questionType,
        options,
        points,
        explanation: explanation || '',
        errors,
        warnings
      });

      expectedOrder++;
    }

    const errorCount = questions.filter(q => q.errors.length > 0).length;
    const warningCount = questions.filter(q => q.warnings.length > 0).length;

    return {
      questions,
      totalParsed: questions.length,
      validCount: questions.length - errorCount,
      errorCount,
      warningCount,
      rawIssues
    };
  }
}

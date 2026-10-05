import fs from 'fs';
import path from 'path';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type QuestionType = 'SINGLE' | 'TRUE_FALSE';
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'RESET';

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  telegram_user_id?: number | null;
  telegram_username?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  is_active: boolean;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  joined_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_letter: string; // 'A', 'B', 'C', 'D' or 'TRUE', 'FALSE'
  option_text: string;
  is_correct: boolean;
  order_num: number;
}

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  explanation: string;
  order_num: number;
  created_at: string;
  options: QuestionOption[];
}

export interface Test {
  id: string;
  title: string;
  description: string;
  book_source: string;
  topic: string;
  group_id: string;
  teacher_id: string;
  time_limit_minutes: number;
  attempt_limit: number; // 0 = unlimited, 1 = 1 attempt, etc.
  passing_percentage: number;
  opening_time: string;
  closing_time: string;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_correct_answers: boolean;
  show_explanations: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
  status: AttemptStatus;
  tab_exits_count: number;
  current_answers_json: Record<string, string>; // questionId -> optionLetter/Id
  last_saved_at: string;
}

export interface TestResult {
  id: string;
  attempt_id: string;
  test_id: string;
  student_id: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  total_points: number;
  earned_points: number;
  percentage: number;
  is_passed: boolean;
  time_spent_seconds: number;
  tab_exits_count: number;
  created_at: string;
  breakdown?: Array<{
    question_id: string;
    question_text: string;
    selected_option: string | null;
    correct_option: string;
    is_correct: boolean;
    points: number;
    earned_points: number;
    explanation: string;
    options: Array<{ letter: string; text: string }>;
  }>;
}

export interface VerificationCode {
  id: string;
  phone: string;
  code_hash: string;
  plain_code: string;
  telegram_user_id?: number | null;
  expires_at: string;
  is_used: boolean;
  attempts_count: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

export interface RetakeAuthorization {
  id: string;
  test_id: string;
  student_id: string;
  authorized_by: string;
  reason: string;
  created_at: string;
}

export interface DatabaseState {
  profiles: Profile[];
  groups: Group[];
  group_members: GroupMember[];
  tests: Test[];
  questions: Question[];
  test_attempts: TestAttempt[];
  test_results: TestResult[];
  verification_codes: VerificationCode[];
  audit_logs: AuditLog[];
  retake_authorizations: RetakeAuthorization[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'testmakon.db.json');

class DatabaseEngine {
  private data: DatabaseState = {
    profiles: [],
    groups: [],
    group_members: [],
    tests: [],
    questions: [],
    test_attempts: [],
    test_results: [],
    verification_codes: [],
    audit_logs: [],
    retake_authorizations: []
  };

  private isLoaded = false;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        this.isLoaded = true;
      } else {
        this.seedInitialData();
        this.persistSync();
        this.isLoaded = true;
      }
    } catch (err) {
      console.error('Error initializing database, using seed data:', err);
      this.seedInitialData();
      this.isLoaded = true;
    }
  }

  private persistSync() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public persist() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.persistSync();
    }, 150);
  }

  public get db(): DatabaseState {
    return this.data;
  }

  private seedInitialData() {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    // Profiles
    const admin: Profile = {
      id: 'prof-admin-01',
      user_id: 'usr-admin-01',
      first_name: 'Anvar',
      last_name: 'Qodirov',
      phone: '+998 90 123 45 67',
      role: 'ADMIN',
      telegram_user_id: 99887766,
      telegram_username: 'anvar_admin',
      is_verified: true,
      created_at: pastDate,
      updated_at: pastDate
    };

    const teacher1: Profile = {
      id: 'prof-teacher-01',
      user_id: 'usr-teacher-01',
      first_name: 'Malika',
      last_name: 'Rahimova',
      phone: '+998 93 987 65 43',
      role: 'TEACHER',
      telegram_user_id: 11223344,
      telegram_username: 'malika_teacher',
      is_verified: true,
      created_at: pastDate,
      updated_at: pastDate
    };

    const student1: Profile = {
      id: 'prof-student-01',
      user_id: 'usr-student-01',
      first_name: 'Muhammad',
      last_name: 'Aliyev',
      phone: '+998 99 111 22 33',
      role: 'STUDENT',
      telegram_user_id: 55667788,
      telegram_username: 'muhammad_a',
      is_verified: true,
      created_at: pastDate,
      updated_at: pastDate
    };

    const student2: Profile = {
      id: 'prof-student-02',
      user_id: 'usr-student-02',
      first_name: 'Madina',
      last_name: 'Karimova',
      phone: '+998 97 444 55 66',
      role: 'STUDENT',
      telegram_user_id: 77889900,
      telegram_username: 'madina_k',
      is_verified: true,
      created_at: pastDate,
      updated_at: pastDate
    };

    const student3: Profile = {
      id: 'prof-student-03',
      user_id: 'usr-student-03',
      first_name: 'Javohir',
      last_name: 'Toshmatov',
      phone: '+998 91 777 88 99',
      role: 'STUDENT',
      telegram_user_id: null,
      telegram_username: null,
      is_verified: true,
      created_at: pastDate,
      updated_at: pastDate
    };

    const student4: Profile = {
      id: 'prof-student-04',
      user_id: 'usr-student-04',
      first_name: 'Nilufar',
      last_name: 'Yusupova',
      phone: '+998 94 333 22 11',
      role: 'STUDENT',
      telegram_user_id: null,
      telegram_username: null,
      is_verified: true,
      created_at: pastDate,
      updated_at: pastDate
    };

    this.data.profiles = [admin, teacher1, student1, student2, student3, student4];

    // Groups
    const group1: Group = {
      id: 'grp-01',
      name: '7-B',
      description: '7-sinf o\'quvchilari uchun umumiy guruh',
      teacher_id: teacher1.id,
      is_active: true,
      created_at: pastDate
    };

    const group2: Group = {
      id: 'grp-02',
      name: 'English A2',
      description: 'Ingliz tili A2 darajadagi boshlang\'ich guruh',
      teacher_id: teacher1.id,
      is_active: true,
      created_at: pastDate
    };

    const group3: Group = {
      id: 'grp-03',
      name: 'IELTS Beginner',
      description: 'Xalqaro imtihonga tayyorgarlik kursi',
      teacher_id: teacher1.id,
      is_active: true,
      created_at: pastDate
    };

    const group4: Group = {
      id: 'grp-04',
      name: 'Flyers Group 1',
      description: 'Cambridge Flyers darajasi o\'quvchilari',
      teacher_id: teacher1.id,
      is_active: true,
      created_at: pastDate
    };

    this.data.groups = [group1, group2, group3, group4];

    // Group Members
    this.data.group_members = [
      { id: 'gm-1', group_id: group1.id, student_id: student1.id, joined_at: pastDate },
      { id: 'gm-2', group_id: group1.id, student_id: student2.id, joined_at: pastDate },
      { id: 'gm-3', group_id: group1.id, student_id: student3.id, joined_at: pastDate },
      { id: 'gm-4', group_id: group2.id, student_id: student1.id, joined_at: pastDate },
      { id: 'gm-5', group_id: group2.id, student_id: student4.id, joined_at: pastDate },
      { id: 'gm-6', group_id: group3.id, student_id: student2.id, joined_at: pastDate }
    ];

    // Test 1: English A2
    const test1: Test = {
      id: 'test-01',
      title: 'Present Simple & Past Simple — Unit 3',
      description: 'Zamonaviy grammatika va fe\'llarning o\'tgan zamon shakllari bo\'yicha nazorat testi.',
      book_source: 'English Grammar in Use (Raymond Murphy)',
      topic: 'Grammar: Present & Past Tenses',
      group_id: group2.id,
      teacher_id: teacher1.id,
      time_limit_minutes: 20,
      attempt_limit: 1,
      passing_percentage: 60,
      opening_time: pastDate,
      closing_time: futureDate,
      randomize_questions: false,
      randomize_options: false,
      show_correct_answers: true,
      show_explanations: true,
      is_active: true,
      created_at: pastDate
    };

    // Test 2: Math 7-B
    const test2: Test = {
      id: 'test-02',
      title: 'Matematika: Oddiy Kasrlar va Foizlar',
      description: 'Kasrlarni qo\'shish, ayirish, ko\'paytirish va foiz hisoblash amaliyoti.',
      book_source: '7-sinf Matematika darsligi',
      topic: 'Kasrlar va foizlar',
      group_id: group1.id,
      teacher_id: teacher1.id,
      time_limit_minutes: 25,
      attempt_limit: 2,
      passing_percentage: 70,
      opening_time: pastDate,
      closing_time: futureDate,
      randomize_questions: true,
      randomize_options: true,
      show_correct_answers: true,
      show_explanations: true,
      is_active: true,
      created_at: pastDate
    };

    this.data.tests = [test1, test2];

    // Questions for Test 1 (10 realistic questions)
    const questionsTest1: Question[] = [
      {
        id: 'q-101',
        test_id: test1.id,
        question_text: "She _______ to school by bus every morning.",
        question_type: 'SINGLE',
        points: 2,
        explanation: "She uchinchi shaxs birlikda (he/she/it), shuning uchun Present Simple zamonida fe'lga -s/es qo'shiladi: goes.",
        order_num: 1,
        created_at: pastDate,
        options: [
          { id: 'opt-101-a', question_id: 'q-101', option_letter: 'A', option_text: 'go', is_correct: false, order_num: 1 },
          { id: 'opt-101-b', question_id: 'q-101', option_letter: 'B', option_text: 'goes', is_correct: true, order_num: 2 },
          { id: 'opt-101-c', question_id: 'q-101', option_letter: 'C', option_text: 'going', is_correct: false, order_num: 3 },
          { id: 'opt-101-d', question_id: 'q-101', option_letter: 'D', option_text: 'went', is_correct: false, order_num: 4 }
        ]
      },
      {
        id: 'q-102',
        test_id: test1.id,
        question_text: "Yesterday, we _______ a very interesting movie at the cinema.",
        question_type: 'SINGLE',
        points: 2,
        explanation: "'Yesterday' o'tgan zamon (Past Simple) belgisi bo'lib, see fe'lining II shakli 'saw' ishlatiladi.",
        order_num: 2,
        created_at: pastDate,
        options: [
          { id: 'opt-102-a', question_id: 'q-102', option_letter: 'A', option_text: 'see', is_correct: false, order_num: 1 },
          { id: 'opt-102-b', question_id: 'q-102', option_letter: 'B', option_text: 'seen', is_correct: false, order_num: 2 },
          { id: 'opt-102-c', question_id: 'q-102', option_letter: 'C', option_text: 'saw', is_correct: true, order_num: 3 },
          { id: 'opt-102-d', question_id: 'q-102', option_letter: 'D', option_text: 'sees', is_correct: false, order_num: 4 }
        ]
      },
      {
        id: 'q-103',
        test_id: test1.id,
        question_text: "_______ they live in Tashkent?",
        question_type: 'SINGLE',
        points: 2,
        explanation: "'They' olmoshi bilan Present Simple so'roq shaklida 'Do' yordamchi fe'li ishlatiladi.",
        order_num: 3,
        created_at: pastDate,
        options: [
          { id: 'opt-103-a', question_id: 'q-103', option_letter: 'A', option_text: 'Does', is_correct: false, order_num: 1 },
          { id: 'opt-103-b', question_id: 'q-103', option_letter: 'B', option_text: 'Do', is_correct: true, order_num: 2 },
          { id: 'opt-103-c', question_id: 'q-103', option_letter: 'C', option_text: 'Are', is_correct: false, order_num: 3 },
          { id: 'opt-103-d', question_id: 'q-103', option_letter: 'D', option_text: 'Did', is_correct: false, order_num: 4 }
        ]
      },
      {
        id: 'q-104',
        test_id: test1.id,
        question_text: "The sun rises in the east and sets in the west.",
        question_type: 'TRUE_FALSE',
        points: 1,
        explanation: "Bu tabiat qonuniyati (universal truth) bo'lib, har doim haqiqat hisoblanadi.",
        order_num: 4,
        created_at: pastDate,
        options: [
          { id: 'opt-104-a', question_id: 'q-104', option_letter: 'TRUE', option_text: 'To‘g‘ri', is_correct: true, order_num: 1 },
          { id: 'opt-104-b', question_id: 'q-104', option_letter: 'FALSE', option_text: 'Noto‘g‘ri', is_correct: false, order_num: 2 }
        ]
      },
      {
        id: 'q-105',
        test_id: test1.id,
        question_text: "Where _______ you go on vacation last summer?",
        question_type: 'SINGLE',
        points: 2,
        explanation: "'last summer' o'tgan zamonda bo'lganligi uchun so'roq shaklida 'did' yordamchi fe'li qo'llanadi.",
        order_num: 5,
        created_at: pastDate,
        options: [
          { id: 'opt-105-a', question_id: 'q-105', option_letter: 'A', option_text: 'do', is_correct: false, order_num: 1 },
          { id: 'opt-105-b', question_id: 'q-105', option_letter: 'B', option_text: 'did', is_correct: true, order_num: 2 },
          { id: 'opt-105-c', question_id: 'q-105', option_letter: 'C', option_text: 'were', is_correct: false, order_num: 3 },
          { id: 'opt-105-d', question_id: 'q-105', option_letter: 'D', option_text: 'have', is_correct: false, order_num: 4 }
        ]
      },
      {
        id: 'q-106',
        test_id: test1.id,
        question_text: "He didn't _______ coffee this morning.",
        question_type: 'SINGLE',
        points: 2,
        explanation: "O'tgan zamon inkor shaklida 'didn't' dan keyin fe'lning asosiy (infinitive) shakli keladi: drink.",
        order_num: 6,
        created_at: pastDate,
        options: [
          { id: 'opt-106-a', question_id: 'q-106', option_letter: 'A', option_text: 'drank', is_correct: false, order_num: 1 },
          { id: 'opt-106-b', question_id: 'q-106', option_letter: 'B', option_text: 'drink', is_correct: true, order_num: 2 },
          { id: 'opt-106-c', question_id: 'q-106', option_letter: 'C', option_text: 'drinks', is_correct: false, order_num: 3 },
          { id: 'opt-106-d', question_id: 'q-106', option_letter: 'D', option_text: 'drinking', is_correct: false, order_num: 4 }
        ]
      },
      {
        id: 'q-107',
        test_id: test1.id,
        question_text: "In English, the past form of 'buy' is 'buyed'.",
        question_type: 'TRUE_FALSE',
        points: 1,
        explanation: "'Buy' noto'g'ri fe'l (irregular verb), uning o'tgan zamon shakli 'bought' bo'ladi.",
        order_num: 7,
        created_at: pastDate,
        options: [
          { id: 'opt-107-a', question_id: 'q-107', option_letter: 'TRUE', option_text: 'To‘g‘ri', is_correct: false, order_num: 1 },
          { id: 'opt-107-b', question_id: 'q-107', option_letter: 'FALSE', option_text: 'Noto‘g‘ri', is_correct: true, order_num: 2 }
        ]
      },
      {
        id: 'q-108',
        test_id: test1.id,
        question_text: "My brother usually _______ books in the evening.",
        question_type: 'SINGLE',
        points: 2,
        explanation: "'Usually' odatiy harakatni ifodalaydi. My brother (he) bo'lgani uchun 'reads' to'g'ri keladi.",
        order_num: 8,
        created_at: pastDate,
        options: [
          { id: 'opt-108-a', question_id: 'q-108', option_letter: 'A', option_text: 'read', is_correct: false, order_num: 1 },
          { id: 'opt-108-b', question_id: 'q-108', option_letter: 'B', option_text: 'reads', is_correct: true, order_num: 2 },
          { id: 'opt-108-c', question_id: 'q-108', option_letter: 'C', option_text: 'is reading', is_correct: false, order_num: 3 },
          { id: 'opt-108-d', question_id: 'q-108', option_letter: 'D', option_text: 'has read', is_correct: false, order_num: 4 }
        ]
      }
    ];

    // Questions for Test 2 (Math)
    const questionsTest2: Question[] = [
      {
        id: 'q-201',
        test_id: test2.id,
        question_text: "1/4 kasr necha foizga teng?",
        question_type: 'SINGLE',
        points: 2.5,
        explanation: "1/4 * 100% = 25%.",
        order_num: 1,
        created_at: pastDate,
        options: [
          { id: 'opt-201-a', question_id: 'q-201', option_letter: 'A', option_text: '20%', is_correct: false, order_num: 1 },
          { id: 'opt-201-b', question_id: 'q-201', option_letter: 'B', option_text: '25%', is_correct: true, order_num: 2 },
          { id: 'opt-201-c', question_id: 'q-201', option_letter: 'C', option_text: '40%', is_correct: false, order_num: 3 },
          { id: 'opt-201-d', question_id: 'q-201', option_letter: 'D', option_text: '50%', is_correct: false, order_num: 4 }
        ]
      },
      {
        id: 'q-202',
        test_id: test2.id,
        question_text: "200 ning 15 foizini toping.",
        question_type: 'SINGLE',
        points: 2.5,
        explanation: "200 * 0.15 = 30.",
        order_num: 2,
        created_at: pastDate,
        options: [
          { id: 'opt-202-a', question_id: 'q-202', option_letter: 'A', option_text: '25', is_correct: false, order_num: 1 },
          { id: 'opt-202-b', question_id: 'q-202', option_letter: 'B', option_text: '30', is_correct: true, order_num: 2 },
          { id: 'opt-202-c', question_id: 'q-202', option_letter: 'C', option_text: '35', is_correct: false, order_num: 3 },
          { id: 'opt-202-d', question_id: 'q-202', option_letter: 'D', option_text: '40', is_correct: false, order_num: 4 }
        ]
      },
      {
        id: 'q-203',
        test_id: test2.id,
        question_text: "3/5 kasr 0.6 o'nli kasriga teng.",
        question_type: 'TRUE_FALSE',
        points: 2,
        explanation: "3 ni 5 ga bo'lsak 0.6 chiqadi, shuning uchun to'g'ri.",
        order_num: 3,
        created_at: pastDate,
        options: [
          { id: 'opt-203-a', question_id: 'q-203', option_letter: 'TRUE', option_text: 'To‘g‘ri', is_correct: true, order_num: 1 },
          { id: 'opt-203-b', question_id: 'q-203', option_letter: 'FALSE', option_text: 'Noto‘g‘ri', is_correct: false, order_num: 2 }
        ]
      },
      {
        id: 'q-204',
        test_id: test2.id,
        question_text: "Hisoblang: 1/2 + 1/3 = ?",
        question_type: 'SINGLE',
        points: 3,
        explanation: "Umumiy maxraj 6. (3 + 2) / 6 = 5/6.",
        order_num: 4,
        created_at: pastDate,
        options: [
          { id: 'opt-204-a', question_id: 'q-204', option_letter: 'A', option_text: '2/5', is_correct: false, order_num: 1 },
          { id: 'opt-204-b', question_id: 'q-204', option_letter: 'B', option_text: '5/6', is_correct: true, order_num: 2 },
          { id: 'opt-204-c', question_id: 'q-204', option_letter: 'C', option_text: '1/6', is_correct: false, order_num: 3 },
          { id: 'opt-204-d', question_id: 'q-204', option_letter: 'D', option_text: '3/6', is_correct: false, order_num: 4 }
        ]
      }
    ];

    this.data.questions = [...questionsTest1, ...questionsTest2];

    // Completed sample attempt for student1 (Muhammad Aliyev)
    const completedAttempt: TestAttempt = {
      id: 'att-sample-01',
      test_id: test1.id,
      student_id: student1.id,
      started_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      expires_at: new Date(Date.now() - 2400 * 1000).toISOString(),
      submitted_at: new Date(Date.now() - 2500 * 1000).toISOString(),
      status: 'COMPLETED',
      tab_exits_count: 1,
      current_answers_json: {
        'q-101': 'B',
        'q-102': 'C',
        'q-103': 'B',
        'q-104': 'TRUE',
        'q-105': 'B',
        'q-106': 'B',
        'q-107': 'FALSE',
        'q-108': 'A' // answered incorrectly to demonstrate real score
      },
      last_saved_at: new Date(Date.now() - 2500 * 1000).toISOString()
    };

    const sampleResult: TestResult = {
      id: 'res-sample-01',
      attempt_id: completedAttempt.id,
      test_id: test1.id,
      student_id: student1.id,
      total_questions: 8,
      correct_answers: 7,
      incorrect_answers: 1,
      total_points: 14,
      earned_points: 12,
      percentage: 85.7,
      is_passed: true,
      time_spent_seconds: 1100, // ~18 minutes
      tab_exits_count: 1,
      created_at: new Date(Date.now() - 2500 * 1000).toISOString()
    };

    this.data.test_attempts = [completedAttempt];
    this.data.test_results = [sampleResult];

    // Seed audit logs
    this.data.audit_logs = [
      {
        id: 'log-01',
        user_id: admin.id,
        user_name: 'Anvar Qodirov',
        action: 'SYSTEM_INITIALIZATION',
        target_type: 'SYSTEM',
        target_id: 'SYSTEM',
        metadata_json: { version: '2.0.0', platform: 'TestMakon' },
        created_at: pastDate
      },
      {
        id: 'log-02',
        user_id: teacher1.id,
        user_name: 'Malika Rahimova',
        action: 'TEST_CREATED',
        target_type: 'TEST',
        target_id: test1.id,
        metadata_json: { test_title: test1.title, group: group2.name },
        created_at: pastDate
      }
    ];
  }
}

export const dbEngine = new DatabaseEngine();

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type QuestionType = 'SINGLE' | 'TRUE_FALSE';
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'RESET';

export interface UserProfile {
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
  groupCount?: number;
  resultsCount?: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  teacherName?: string;
  is_active: boolean;
  memberCount?: number;
  testsCount?: number;
  created_at: string;
  students?: UserProfile[];
}

export interface QuestionOption {
  id: string;
  question_id?: string;
  option_letter: string;
  option_text: string;
  is_correct?: boolean;
}

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  explanation?: string;
  order_num: number;
  options: QuestionOption[];
}

export interface Test {
  id: string;
  title: string;
  description: string;
  book_source: string;
  topic: string;
  group_id: string;
  groupName?: string;
  teacher_id: string;
  teacherName?: string;
  time_limit_minutes: number;
  attempt_limit: number;
  passing_percentage: number;
  opening_time: string;
  closing_time: string;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_correct_answers: boolean;
  show_explanations: boolean;
  is_active: boolean;
  created_at: string;
  questionsCount?: number;
  attemptsCount?: number;
  studentStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ATTEMPTS_EXHAUSTED';
  studentResult?: TestResult;
  studentAttemptId?: string;
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
  current_answers_json: Record<string, string>;
  last_saved_at: string;
}

export interface QuestionBreakdown {
  question_id: string;
  question_text: string;
  selected_option: string | null;
  correct_option: string;
  is_correct: boolean;
  points: number;
  earned_points: number;
  explanation: string;
  options: Array<{ letter: string; text: string }>;
}

export interface TestResult {
  id: string;
  attempt_id: string;
  test_id: string;
  student_id: string;
  studentName?: string;
  studentPhone?: string;
  testTitle?: string;
  groupName?: string;
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
  breakdown?: QuestionBreakdown[];
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

export interface TelegramConfig {
  isConfigured: boolean;
  hasAdminChat: boolean;
  botUsername: string;
  botTokenMasked: string | null;
  adminChatId: string | null;
}

export interface QuestionStat {
  questionId: string;
  orderNum: number;
  questionText: string;
  totalAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  correctPercentage: number;
  incorrectPercentage: number;
  difficulty: string;
  difficultyColor: string;
  points: number;
}

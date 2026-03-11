export interface Student {
  id: string;
  nisn: string;
  name: string;
}

export interface ExamSession {
  id: string;
  studentId: string;
  studentName: string;
  startTime: string;
  endTime?: string;
  score?: number;
  violations: number;
  status: 'active' | 'completed' | 'terminated';
  lastActive: string;
  answers?: Record<string, number>;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  category: 'hardware' | 'assembly' | 'windows';
}

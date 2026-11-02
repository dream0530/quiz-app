// 문제 파일의 한 문항. correctAnswer는 1~4이며 1이 options[0]을 뜻한다.
export type Question = {
  question: string;
  options: [string, string, string, string];
  correctAnswer: 1 | 2 | 3 | 4;
  explanation: string;
};

// 이용자가 고른 보기 번호(1~4). 아직 고르지 않았으면 null.
export type Answer = 1 | 2 | 3 | 4 | null;

export type QuestionResult = {
  chosen: Answer;
  isCorrect: boolean;
};

export type GradeResult = {
  results: QuestionResult[];
  correctCount: number;
  total: number;
  score: number;
};

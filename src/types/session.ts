export interface SessionData {
  guestId?: string;
  userId?: string; // For future registered users
  resumeText?: string;
  resumePath?: string;
  uploadedAt?: string;
  phase1Answers?: any;
  dynamicQuestions?: any;
  assessmentProgress?: {
    phase1Complete: boolean;
    phase2Complete: boolean;
    phase3Complete: boolean;
  };
  isGuest: boolean;
  isLoggedIn: boolean;
}

export interface SessionOptions {
  password: string;
  cookieName: string;
  cookieOptions: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
  };
}

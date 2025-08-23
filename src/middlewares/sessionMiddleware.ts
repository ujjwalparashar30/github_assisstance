import { Request, Response } from 'express';
import { getIronSession, IronSession } from 'iron-session';
import { SessionData } from '../types/session';

export async function getSessionFromRequest(req: Request, res: Response): Promise<IronSession<SessionData>> {
  // Define sessionOptions inside the function to ensure env vars are loaded
  const sessionOptions = {
    password: process.env.SESSION_SECRET!,
    cookieName: "career-session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    },
  };

  console.log("SESSION_SECRET is: ", process.env.SESSION_SECRET);
  console.log("sessionOptions.password: ", sessionOptions.password);
  
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  
  // Auto-create guest session if none exists
  if (!session.guestId && !session.userId) {
    session.guestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    session.isGuest = true;
    session.isLoggedIn = false;
    session.assessmentProgress = {
      phase1Complete: false,
      phase2Complete: false,
      phase3Complete: false,
    };
    await session.save();
  }
  
  return session;
}

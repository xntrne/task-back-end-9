import { Session } from "../models/Session.js";

export const SESSION_COOKIE = "movie_session";

export async function checkAuth(req, res, next) {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    const session = await Session.validateSession(sessionId);

    if (!session || !session.user) {
      return res.status(401).json({ error: "invalid session" });
    }

    req.user = session.user;
    req.sessionId = session.sessionId;

    next();
  } catch (error) {
    next(error);
  }
}

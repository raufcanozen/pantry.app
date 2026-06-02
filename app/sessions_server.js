import { createCookieSessionStorage } from "react-router";

const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-in-production";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 gün
    httpOnly: true,
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
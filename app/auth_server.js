import bcrypt from "bcryptjs";
import { redirect } from "react-router";
import { prisma } from "~/db.server";
import { getSession, commitSession, destroySession } from "~/sessions_server";

// Yeni kullanıcı oluştur
export async function register(email, password) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Bu email adresi zaten kayıtlı" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  return { user };
}

// Kullanıcı girişi
export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Email veya şifre hatalı" };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { error: "Email veya şifre hatalı" };
  }

  return { user };
}

// Session'a kullanıcı kaydet ve yönlendir
export async function createUserSession(userId, redirectTo) {
  const session = await getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

// Çıkış
export async function logout(request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

// Mevcut kullanıcı id'si (null dönebilir)
export async function getUserId(request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  return userId || null;
}

// Mevcut kullanıcı objesi (null dönebilir)
export async function getUser(request) {
  const userId = await getUserId(request);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  });

  return user;
}

// Korumalı route'lar için: kullanıcı yoksa login'e yönlendir
export async function requireUserId(request, redirectTo) {
  const userId = await getUserId(request);
  if (!userId) {
    const url = new URL(request.url);
    const fromUrl = redirectTo || url.pathname + url.search;
    throw redirect(`/login?from=${encodeURIComponent(fromUrl)}`);
  }
  return userId;
}
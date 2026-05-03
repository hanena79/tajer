import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import * as bcrypt from 'bcryptjs'
import { jwtVerify, SignJWT } from 'jose'

export type SessionPayload = {
  userId: string
  role: string
  storeId?: string
  expiresAt: Date
}

const secretKey = process.env.SESSION_SECRET || "tajer-secret-key-change-in-production"
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = ""): Promise<SessionPayload | null> {
  if (!session) return null
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string, role: string, storeId?: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, role, storeId, expiresAt })
  const cookieStore = await cookies()
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export const verifySession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("session")?.value
  const session = await decrypt(cookie)
  return session
})

export async function requireAuth(locale = "ar"): Promise<SessionPayload> {
  const session = await verifySession()
  if (!session?.userId) {
    redirect(`/${locale}/login`)
  }
  return session
}

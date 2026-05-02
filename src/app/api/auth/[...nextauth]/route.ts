// This route is kept for backward compatibility but uses custom jose sessions
// Login is handled via /api/auth/login
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

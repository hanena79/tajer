import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tajer - نظام نقطة البيع',
  description: 'Modern POS System for Algerian businesses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

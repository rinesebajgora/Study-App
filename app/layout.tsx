import type { Metadata } from "next"
import "./globals.css"
import React, { ReactNode } from "react"
import { AuthProvider } from "./context/AuthContext"

export const metadata: Metadata = {
  title: "StudyAI",
  description: "Study AI - Assistant for studying",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f5f5f5' }}>
        <AuthProvider>
          <main style={{ padding: '24px' }}>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}

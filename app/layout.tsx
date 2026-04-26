import type { Metadata } from "next"
import "./globals.css"
import React, { ReactNode } from "react"
import { AuthProvider } from "./context/AuthContext"

export const metadata: Metadata = {
  title: "StudyAI",
  description: "Study smarter with AI-generated explanations and saved study history.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

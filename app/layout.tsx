import type { Metadata } from "next"
import "./globals.css"
import React, { ReactNode } from "react"
import { AuthProvider } from "./context/AuthContext"

export const metadata: Metadata = {
  title: "StudyMate AI",
  description: "AI study workspace for notes, flashcards, exam planning, imports, and revision analytics.",
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

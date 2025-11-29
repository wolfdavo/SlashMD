import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SlashMD — Block-Based Markdown Editor for VS Code',
  description: 'A Notion-like WYSIWYG editor for Markdown files. Edit your docs with blocks, slash commands, and drag-and-drop — all while keeping plain Markdown.',
  keywords: ['markdown', 'vscode', 'cursor', 'wysiwyg', 'notion', 'block editor', 'markdown editor'],
  authors: [{ name: 'SlashMD' }],
  openGraph: {
    title: 'SlashMD — Block-Based Markdown Editor',
    description: 'A Notion-like WYSIWYG editor for Markdown files in VS Code and Cursor.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlashMD — Block-Based Markdown Editor',
    description: 'A Notion-like WYSIWYG editor for Markdown files in VS Code and Cursor.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Automation Command Center',
  description: 'Staged automation planning for n8n',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Silent Co-Driver | AI Race Engineer',
  description: 'Multimodal AI race engineer assistant — fusing driver radio, emotion analysis, and telemetry into actionable race insights.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

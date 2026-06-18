import './globals.css'

export const metadata = {
  title: 'Darkside Bros — DuoMity Geek Edition',
  description: 'Trivia geek para dos jugadores — Darkside Bros Café, Montevideo',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

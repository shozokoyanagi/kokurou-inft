export const metadata = {
  title: '黒狼 — 幽玄奇譚',
  description: '境界の怪異、黒狼に問いかける',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

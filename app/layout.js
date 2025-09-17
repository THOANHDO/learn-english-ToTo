import './globals.css';

export const metadata = {
  title: 'Learn English ToTo - TOEIC for Beginners',
  description: 'Adaptive TOEIC learning platform for beginners with placement test, flashcards, grammar lessons, mock tests, and progress tracking.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

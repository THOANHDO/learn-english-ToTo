'use client';

import PlacementTest from '@/components/PlacementTest';
import FlashcardSystem from '@/components/FlashcardSystem';
import GrammarLesson from '@/components/GrammarLesson';
import MockTest from '@/components/MockTest';
import ProgressDashboard from '@/components/ProgressDashboard';
import { ProgressProvider } from '@/context/ProgressContext';

export default function HomePage() {
  return (
    <ProgressProvider>
      <main>
        <header style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="badge">Learn English ToTo</div>
          <h1>Nền tảng TOEIC cho người mới bắt đầu</h1>
          <p>
            Hoàn thiện kỹ năng TOEIC với 5 mô-đun cốt lõi: Placement Test adaptive, Flashcard Spaced Repetition, Grammar interactive, Mock Test
            chuẩn TOEIC và Dashboard theo dõi tiến độ toàn diện.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <button className="primary">Bắt đầu lộ trình 90 ngày</button>
            <button className="secondary">Khám phá tài nguyên</button>
          </div>
        </header>

        <PlacementTest />
        <FlashcardSystem />
        <GrammarLesson />
        <MockTest />
        <ProgressDashboard />
      </main>
    </ProgressProvider>
  );
}

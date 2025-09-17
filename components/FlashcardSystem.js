'use client';

import { useEffect, useMemo, useState } from 'react';
import { flashcardDeck } from '@/lib/flashcards';
import { useProgress } from '@/context/ProgressContext';

const intervals = [1, 3, 7, 14, 28, 45];

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function initSchedule() {
  const base = {};
  flashcardDeck.forEach((card) => {
    base[card.word] = {
      stage: 0,
      nextReview: getTodayKey(),
      history: []
    };
  });
  return base;
}

function speakWord(word, pronunciation) {
  if (typeof window === 'undefined') return;
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = 'en-US';
    utter.rate = 0.9;
    utter.pitch = 1.1;
    window.speechSynthesis.speak(utter);
  }
}

function calculateDueCards(schedule) {
  const today = getTodayKey();
  return flashcardDeck.filter((card) => schedule[card.word]?.nextReview <= today);
}

export default function FlashcardSystem() {
  const { state, dispatch } = useProgress();
  const [schedule, setSchedule] = useState(() => {
    if (typeof window === 'undefined') return initSchedule();
    const stored = localStorage.getItem('flashcard-schedule');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...initSchedule(), ...parsed };
      } catch (error) {
        console.error('Failed to parse flashcard schedule', error);
      }
    }
    return initSchedule();
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [todayCount, setTodayCount] = useState(0);

  const dueCards = useMemo(() => calculateDueCards(schedule), [schedule]);
  const currentCard = dueCards[currentIndex % (dueCards.length || 1)] ?? flashcardDeck[currentIndex % flashcardDeck.length];
  const dueCount = dueCards.length;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('flashcard-schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    const today = getTodayKey();
    const lastStudy = state.flashcard.lastStudyDate;
    let streak = state.flashcard.streak;
    if (lastStudy !== today) {
      if (lastStudy) {
        const diff = Math.floor((new Date(today) - new Date(lastStudy)) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streak += 1;
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }
      dispatch({
        type: 'UPDATE_FLASHCARD',
        payload: {
          flashcard: {
            streak,
            lastStudyDate: today,
            todayStudied: 0,
            dueToday: dueCount,
            mastered: state.flashcard.mastered,
            dailyGoal: state.flashcard.dailyGoal
          },
          activity: {
            type: 'flashcard-refresh',
            label: 'Làm mới lịch ôn flashcard',
            timestamp: new Date().toISOString(),
            details: { dueCount }
          }
        }
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch({
      type: 'UPDATE_FLASHCARD',
      payload: {
        flashcard: {
          ...state.flashcard,
          todayStudied: todayCount,
          dueToday: dueCount
        },
        activity: {
          type: 'flashcard-session',
          label: 'Cập nhật tiến độ flashcard',
          timestamp: new Date().toISOString(),
          details: { studied: todayCount, due: dueCount }
        }
      }
    });
  }, [todayCount, dueCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveNextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(dueCount, flashcardDeck.length));
    setShowMeaning(false);
  };

  const updateSchedule = (card, rating) => {
    const today = getTodayKey();
    const currentData = schedule[card.word] ?? { stage: 0, nextReview: today, history: [] };
    let newStage = currentData.stage;
    if (rating === 'easy') {
      newStage += 2;
    } else if (rating === 'good') {
      newStage += 1;
    } else {
      newStage = Math.max(newStage - 1, 0);
    }
    const interval = intervals[Math.min(newStage, intervals.length - 1)];
    const nextReview = addDays(interval);
    const updatedSchedule = {
      ...schedule,
      [card.word]: {
        stage: newStage,
        nextReview,
        history: [
          ...currentData.history,
          {
            date: today,
            rating,
            interval
          }
        ]
      }
    };
    setSchedule(updatedSchedule);
    setTodayCount((prev) => prev + 1);
    if (newStage >= intervals.length - 1) {
      dispatch({
        type: 'ADD_ACHIEVEMENT',
        payload: {
          id: `master-${card.word}`,
          title: `Mastered ${card.word}`,
          description: 'Hoàn thành chu kỳ ôn luyện cho từ vựng quan trọng.'
        }
      });
      dispatch({
        type: 'UPDATE_FLASHCARD',
        payload: {
          flashcard: {
            ...state.flashcard,
            mastered: state.flashcard.mastered + 1,
            todayStudied: todayCount + 1,
            dueToday: calculateDueCards(updatedSchedule).length,
            streak: state.flashcard.streak,
            lastStudyDate: today
          },
          activity: {
            type: 'flashcard-mastered',
            label: `Đạt mastery cho từ ${card.word}`,
            timestamp: new Date().toISOString(),
            details: { word: card.word, stage: newStage }
          }
        }
      });
    }
  };

  const handleAssessment = (rating) => {
    updateSchedule(currentCard, rating);
    moveNextCard();
  };

  const toggleNightMode = () => setNightMode((prev) => !prev);

  return (
    <section className="gradient-border" style={{ background: nightMode ? 'rgba(2,6,23,0.9)' : undefined }}>
      <div className="badge">Flashcards • Spaced Repetition</div>
      <h2>2. Hệ thống thẻ từ vựng TOEIC</h2>
      <p>
        Ôn luyện 3000+ từ vựng cùng thuật toán <strong>Spaced Repetition</strong>, tự động điều chỉnh lịch ôn, hỗ trợ phát âm, chế độ tối và
        theo dõi streak mỗi ngày.
      </p>

      <div className="flex-between" style={{ marginTop: 24 }}>
        <div>
          <p><strong>Thẻ cần ôn hôm nay:</strong> {dueCount}</p>
          <p><strong>Đã học hôm nay:</strong> {todayCount} / Mục tiêu {state.flashcard.dailyGoal}</p>
          <p><strong>Study streak:</strong> 🔥 {state.flashcard.streak} ngày liên tục</p>
        </div>
        <button className="secondary" onClick={toggleNightMode}>
          {nightMode ? '🌞 Chế độ sáng' : '🌙 Night mode'}
        </button>
      </div>

      <div className="card" style={{ marginTop: 24, background: nightMode ? 'rgba(15,23,42,0.95)' : 'rgba(30,41,59,0.9)' }}>
        <div className="badge" style={{ marginBottom: 12 }}>#{currentIndex + 1}</div>
        <h3 style={{ fontSize: '2rem' }}>{currentCard.word}</h3>
        <p style={{ color: '#94a3b8', marginTop: 4 }}>{currentCard.pronunciation}</p>
        <div className="chip-list" style={{ marginTop: 12 }}>
          <span className="chip">Topic: {currentCard.topic}</span>
          <span className="chip">Độ khó: {currentCard.difficulty_level}</span>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="secondary" onClick={() => speakWord(currentCard.word, currentCard.pronunciation)}>
            🔊 Nghe phát âm
          </button>
          <button className="secondary" onClick={() => setShowMeaning((prev) => !prev)}>
            {showMeaning ? 'Ẩn nghĩa' : 'Hiển thị nghĩa'}
          </button>
        </div>

        {showMeaning && (
          <div style={{ marginTop: 16 }}>
            <p><strong>Định nghĩa:</strong> {currentCard.definition}</p>
            <p><strong>Nghĩa tiếng Việt:</strong> {currentCard.vietnamese}</p>
            <p style={{ fontStyle: 'italic' }}>{currentCard.example}</p>
            <p style={{ color: '#94a3b8', marginTop: 8 }}>Lần ôn tiếp theo: {schedule[currentCard.word]?.nextReview}</p>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button className="secondary" onClick={() => handleAssessment('hard')}>Khó</button>
          <button className="primary" onClick={() => handleAssessment('good')} style={{ flex: '0 0 auto' }}>
            Bình thường
          </button>
          <button className="secondary" onClick={() => handleAssessment('easy')}>Dễ</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Daily Goal & Analytics</h3>
        <label htmlFor="daily-goal">Mục tiêu số thẻ mỗi ngày</label>
        <input
          id="daily-goal"
          type="range"
          min="10"
          max="50"
          value={state.flashcard.dailyGoal}
          onChange={(event) => {
            const value = Number(event.target.value);
            dispatch({
              type: 'UPDATE_GOALS',
              payload: { dailyGoal: value }
            });
          }}
        />
        <p>Mục tiêu hiện tại: {state.flashcard.dailyGoal} thẻ/ngày</p>
        <div className="progress-bar" style={{ marginTop: 12 }}>
          <span style={{ width: `${Math.min(100, (todayCount / state.flashcard.dailyGoal) * 100)}%` }} />
        </div>
        <p style={{ marginTop: 12 }}>
          Thuật toán nhắc ôn: lần 1 sau 1 ngày → lần 2 sau 3 ngày → lần 3 sau 7 ngày → tiếp tục tăng gấp đôi khoảng cách khi bạn đánh giá
          "Dễ" hoặc "Bình thường".
        </p>
      </div>
    </section>
  );
}

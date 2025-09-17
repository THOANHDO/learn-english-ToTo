'use client';

import { useEffect, useMemo, useState } from 'react';
import { placementQuestions } from '@/lib/placementQuestions';
import { useProgress } from '@/context/ProgressContext';

const TOTAL_QUESTIONS = 20;
const TOTAL_SECONDS = 15 * 60;

const difficultyScore = {
  1: 200,
  2: 320,
  3: 460,
  4: 620,
  5: 780,
  6: 900
};

const levelBrackets = [
  { min: 0, max: 200, label: 'Beginner', color: '#38bdf8', recommendation: 'Bắt đầu với khóa nền tảng từ vựng và phát âm.' },
  { min: 201, max: 400, label: 'Elementary', color: '#4ade80', recommendation: 'Tập trung củng cố ngữ pháp cơ bản và nghe chậm.' },
  { min: 401, max: 600, label: 'Intermediate', color: '#facc15', recommendation: 'Luyện phản xạ nghe-nói và bài tập part 3-6.' },
  { min: 601, max: 800, label: 'Upper-Intermediate', color: '#f97316', recommendation: 'Tăng cường mini test theo thời gian thực.' },
  { min: 801, max: 990, label: 'Advanced', color: '#ec4899', recommendation: 'Tập trung tối ưu chiến lược làm bài và tốc độ đọc.' }
];

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${sec}`;
}

function classifyLevel(score) {
  return levelBrackets.find((level) => score >= level.min && score <= level.max) ?? levelBrackets[0];
}

function estimateScore(responses) {
  if (!responses.length) return 0;
  const base = responses.reduce((sum, item) => {
    const difficultyBase = difficultyScore[item.difficulty];
    const adjustment = item.correct ? 80 : -60;
    return sum + (difficultyBase + adjustment);
  }, 0);
  const normalized = Math.round(base / responses.length);
  return Math.max(0, Math.min(990, normalized));
}

function getSuggestedTimeline(levelLabel) {
  switch (levelLabel) {
    case 'Beginner':
      return '6 tháng';
    case 'Elementary':
      return '6 tháng';
    case 'Intermediate':
      return '4 tháng';
    case 'Upper-Intermediate':
      return '3 tháng';
    case 'Advanced':
      return '3 tháng';
    default:
      return '6 tháng';
  }
}

function getInitialPool() {
  const pool = new Map();
  placementQuestions.forEach((question) => {
    if (!pool.has(question.difficulty)) {
      pool.set(question.difficulty, []);
    }
    pool.get(question.difficulty).push(question);
  });
  return pool;
}

function drawQuestion(pool, difficulty) {
  if (pool.get(difficulty)?.length) {
    return pool.get(difficulty).shift();
  }
  // fallback nearest difficulty
  for (let offset = 1; offset < 6; offset += 1) {
    const higher = pool.get(difficulty + offset);
    if (higher?.length) {
      return higher.shift();
    }
    const lower = pool.get(difficulty - offset);
    if (lower?.length) {
      return lower.shift();
    }
  }
  return null;
}

export default function PlacementTest() {
  const { dispatch } = useProgress();
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [currentDifficulty, setCurrentDifficulty] = useState(3);
  const [questionPool, setQuestionPool] = useState(() => getInitialPool());
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [finished, setFinished] = useState(false);
  const [pendingExplanation, setPendingExplanation] = useState(null);

  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft <= 0) {
      setFinished(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, finished]);

  const progress = useMemo(() => Math.round((responses.length / TOTAL_QUESTIONS) * 100), [responses.length]);

  const score = useMemo(() => estimateScore(responses), [responses]);
  const levelInfo = useMemo(() => classifyLevel(score), [score]);

  useEffect(() => {
    if (!started) return;
    if (responses.length >= TOTAL_QUESTIONS) {
      setFinished(true);
    }
  }, [responses, started]);

  useEffect(() => {
    if (!finished || !responses.length) return;
    const activityEntry = {
      type: 'placement-test',
      label: 'Hoàn thành Placement Test',
      timestamp: new Date().toISOString(),
      details: {
        score,
        accuracy: Math.round((responses.filter((r) => r.correct).length / responses.length) * 100),
        level: levelInfo.label
      }
    };
    dispatch({
      type: 'UPDATE_PLACEMENT',
      payload: {
        result: {
          score,
          level: levelInfo.label,
          recommendation: levelInfo.recommendation,
          responses
        },
        recommendedScore: levelInfo.max,
        recommendedTimeline: getSuggestedTimeline(levelInfo.label),
        activity: activityEntry
      }
    });
  }, [finished, responses, dispatch, levelInfo, score]);

  const startTest = () => {
    const pool = getInitialPool();
    const firstQuestion = drawQuestion(pool, 3);
    setQuestionPool(pool);
    setCurrentQuestion(firstQuestion);
    setStarted(true);
    setFinished(false);
    setResponses([]);
    setCurrentDifficulty(3);
    setTimeLeft(TOTAL_SECONDS);
    setPendingExplanation(null);
  };

  const handleAnswer = (option) => {
    if (!currentQuestion || finished) return;
    const isCorrect = option === currentQuestion.answer;
    const updatedResponses = [
      ...responses,
      {
        ...currentQuestion,
        selected: option,
        correct: isCorrect,
        difficulty: currentDifficulty,
        timestamp: new Date().toISOString()
      }
    ];
    setResponses(updatedResponses);
    const nextDifficulty = Math.min(6, Math.max(1, currentDifficulty + (isCorrect ? 1 : -1)));
    setCurrentDifficulty(nextDifficulty);
    const nextQuestion = drawQuestion(questionPool, nextDifficulty);
    setCurrentQuestion(nextQuestion);
    setPendingExplanation({
      wasCorrect: isCorrect,
      explanation: currentQuestion.explanation,
      skill: currentQuestion.skill
    });
    if (!nextQuestion) {
      setFinished(true);
    }
  };

  const resetTest = () => {
    setStarted(false);
    setFinished(false);
    setResponses([]);
    setTimeLeft(TOTAL_SECONDS);
    setCurrentQuestion(null);
    setQuestionPool(getInitialPool());
    setPendingExplanation(null);
  };

  return (
    <section className="gradient-border">
      <div className="badge">Placement Test • Adaptive 20 câu</div>
      <h2>1. Hệ thống Placement Test</h2>
      <p>
        Xác định chính xác trình độ hiện tại với thuật toán adaptive điều chỉnh độ khó theo từng câu trả lời. Bạn sẽ có
        15 phút cho 20 câu hỏi và <strong>không thể quay lại</strong> câu trước.
      </p>

      {!started && !finished && (
        <div className="card" style={{ background: 'rgba(30,41,59,0.8)', marginTop: 24 }}>
          <h3>Bắt đầu kiểm tra trình độ</h3>
          <ul>
            <li>20 câu hỏi, thời gian 15 phút.</li>
            <li>Bắt đầu ở mức độ trung bình (400-500 TOEIC).</li>
            <li>Trả lời đúng → câu tiếp theo khó hơn. Trả lời sai → câu tiếp theo dễ hơn.</li>
            <li>Không thể quay lại câu trước.</li>
          </ul>
          <button className="primary" onClick={startTest}>
            Bắt đầu kiểm tra trình độ
          </button>
        </div>
      )}

      {started && !finished && (
        <div className="card" style={{ background: 'rgba(15,23,42,0.8)', marginTop: 24 }}>
          <div className="flex-between">
            <div>
              <div className="badge">Thời gian còn lại: {formatTime(timeLeft)}</div>
              <p style={{ marginTop: 12 }}>Câu {responses.length + 1} / {TOTAL_QUESTIONS}</p>
            </div>
            <div className="progress-bar" style={{ width: '200px' }}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          {currentQuestion ? (
            <div style={{ marginTop: 24 }}>
              <h3>{currentQuestion.prompt}</h3>
              <div className="list-grid" style={{ marginTop: 16 }}>
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="secondary"
                    style={{ textAlign: 'left' }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p>Đang tải câu hỏi tiếp theo...</p>
          )}

          {pendingExplanation && (
            <div className="alert" style={{ marginTop: 24 }}>
              <strong>{pendingExplanation.wasCorrect ? '✔️ Chính xác!' : '❌ Chưa chính xác.'}</strong>
              <p style={{ margin: '8px 0 0' }}>{pendingExplanation.explanation}</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Kỹ năng: {pendingExplanation.skill}</p>
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="card" style={{ background: 'rgba(15,23,42,0.9)', marginTop: 24 }}>
          <h3>Kết quả Placement Test</h3>
          <div className="grid two" style={{ marginTop: 16 }}>
            <div>
              <p style={{ fontSize: '1.2rem' }}>
                <strong>Điểm ước tính:</strong> {score} / 990
              </p>
              <div className="badge" style={{ background: `${levelInfo.color}33`, color: levelInfo.color }}>
                Level: {levelInfo.label}
              </div>
              <p style={{ marginTop: 12 }}>{levelInfo.recommendation}</p>
            </div>
            <div>
              <p><strong>Đề xuất tiếp theo</strong></p>
              <ul>
                <li>Hiển thị level trên dashboard và cập nhật mục tiêu {levelInfo.max} TOEIC.</li>
                <li>Khuyến nghị lộ trình {getSuggestedTimeline(levelInfo.label)} với các khóa học phù hợp.</li>
                <li>Đặt mục tiêu tăng {Math.max(100, levelInfo.max - score)} điểm trong 3-6 tháng.</li>
              </ul>
            </div>
          </div>

          <div className="table-responsive" style={{ marginTop: 24 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kỹ năng</th>
                  <th>Độ khó</th>
                  <th>Đáp án đã chọn</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((response, index) => (
                  <tr key={response.id}>
                    <td>{index + 1}</td>
                    <td>{response.skill}</td>
                    <td>{response.difficulty}</td>
                    <td>{response.selected}</td>
                    <td>{response.correct ? 'Đúng' : 'Sai'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="secondary" style={{ marginTop: 24 }} onClick={resetTest}>
            Làm lại bài kiểm tra
          </button>
        </div>
      )}
    </section>
  );
}

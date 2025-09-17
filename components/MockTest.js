'use client';

import { useEffect, useMemo, useState } from 'react';
import { analyseWeaknesses, buildPartSummary, convertToScaledScore, generateMockTest, suggestDifficultyTrend } from '@/lib/mockTestData';
import { useProgress } from '@/context/ProgressContext';

const TEST_CONFIG = {
  full: { label: 'Full Test 200 câu', duration: 120 * 60 },
  mini: { label: 'Mini Test 50 câu', duration: 30 * 60 }
};

function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function speakStem(stem) {
  if (typeof window === 'undefined') return;
  if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(stem);
    utter.lang = 'en-US';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }
}

export default function MockTest() {
  const { state, dispatch } = useProgress();
  const [mode, setMode] = useState('full');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(TEST_CONFIG.full.duration);
  const [questionStart, setQuestionStart] = useState(null);
  const [timePerQuestion, setTimePerQuestion] = useState({});

  useEffect(() => {
    if (!started || finished) return;
    if (timeLeft <= 0) {
      finishTest();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [started, finished, timeLeft]);

  useEffect(() => {
    if (started) {
      setQuestionStart(Date.now());
    }
  }, [currentIndex, started]);

  const currentQuestion = questions[currentIndex];

  const recordTime = () => {
    if (!questionStart) return;
    const spent = Math.max(1, Math.floor((Date.now() - questionStart) / 1000));
    setTimePerQuestion((prev) => ({
      ...prev,
      [currentQuestion?.id ?? `q-${currentIndex}`]: (prev[currentQuestion?.id] || 0) + spent
    }));
  };

  const startTest = () => {
    const generated = generateMockTest(mode);
    setQuestions(generated);
    setStarted(true);
    setFinished(false);
    setCurrentIndex(0);
    setAnswers({});
    setMarked({});
    setTimePerQuestion({});
    setTimeLeft(TEST_CONFIG[mode].duration);
    setQuestionStart(Date.now());
  };

  const selectAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const goNext = () => {
    if (currentIndex >= questions.length - 1) return;
    recordTime();
    setCurrentIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    if (currentIndex <= 0) return;
    recordTime();
    setCurrentIndex((prev) => prev - 1);
  };

  const toggleMark = (questionId) => {
    setMarked((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const finishTest = () => {
    recordTime();
    setFinished(true);
    setStarted(false);
  };

  const answerDetails = useMemo(() => questions.map((question) => ({
    ...question,
    selected: answers[question.id] ?? null,
    correct: (answers[question.id] ?? null) === question.answer,
    timeSpent: timePerQuestion[question.id] ?? 0
  })), [questions, answers, timePerQuestion]);

  const listeningQuestions = useMemo(() => answerDetails.filter((item) => item.section === 'listening'), [answerDetails]);
  const readingQuestions = useMemo(() => answerDetails.filter((item) => item.section === 'reading'), [answerDetails]);

  const listeningCorrect = listeningQuestions.filter((item) => item.correct).length;
  const readingCorrect = readingQuestions.filter((item) => item.correct).length;

  const listeningScore = convertToScaledScore(listeningCorrect, listeningQuestions.length, 'listening');
  const readingScore = convertToScaledScore(readingCorrect, readingQuestions.length, 'reading');
  const totalScore = listeningScore + readingScore;

  const partSummary = useMemo(() => buildPartSummary(answerDetails), [answerDetails]);
  const weaknesses = useMemo(() => analyseWeaknesses(partSummary), [partSummary]);

  useEffect(() => {
    if (!finished) return;
    const result = {
      mode,
      totalScore,
      listeningScore,
      readingScore,
      listeningCorrect,
      readingCorrect,
      questionCount: questions.length,
      completedAt: new Date().toISOString(),
      partSummary,
      weaknesses,
      difficultySuggestion: suggestDifficultyTrend([{ totalScore }, ...state.mockTests])
    };
    dispatch({
      type: 'LOG_MOCK_TEST',
      payload: {
        result,
        activity: {
          type: 'mock-test',
          label: `Hoàn thành ${mode === 'full' ? 'Full TOEIC test' : 'Mini test'}`,
          timestamp: new Date().toISOString(),
          details: {
            score: totalScore,
            listening: listeningScore,
            reading: readingScore,
            accuracy: Math.round(((listeningCorrect + readingCorrect) / questions.length) * 100)
          }
        }
      }
    });
    if (totalScore >= 800) {
      dispatch({
        type: 'ADD_ACHIEVEMENT',
        payload: {
          id: 'test-warrior',
          title: 'Test Warrior',
          description: 'Chạm mốc 800 điểm trong bài thi thử TOEIC.'
        }
      });
    }
  }, [finished, totalScore, listeningScore, readingScore, listeningCorrect, readingCorrect, partSummary, weaknesses, dispatch, mode, questions.length, state.mockTests]);

  const questionGrid = (
    <div className="card" style={{ marginTop: 24 }}>
      <h4>Điều hướng câu hỏi</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))', gap: 8, marginTop: 12 }}>
        {questions.map((question, index) => {
          const answered = answers[question.id];
          const isCurrent = index === currentIndex;
          const isMarked = marked[question.id];
          return (
            <button
              key={question.id}
              className="secondary"
              onClick={() => {
                recordTime();
                setCurrentIndex(index);
              }}
              style={{
                border: isCurrent ? '2px solid #38bdf8' : '1px solid rgba(148,163,184,0.3)',
                background: isMarked ? 'rgba(250,204,21,0.2)' : answered ? 'rgba(56,189,248,0.2)' : 'rgba(15,23,42,0.8)'
              }}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );

  const timeAnalysis = useMemo(() => {
    const totalTime = Object.values(timePerQuestion).reduce((sum, value) => sum + value, 0);
    const avg = questions.length ? Math.round(totalTime / questions.length) : 0;
    const slowest = answerDetails.reduce((prev, curr) => (curr.timeSpent > (prev?.timeSpent ?? 0) ? curr : prev), null);
    return {
      totalTime,
      avg,
      slowest
    };
  }, [timePerQuestion, questions.length, answerDetails]);

  return (
    <section className="gradient-border">
      <div className="badge">TOEIC Mock Test</div>
      <h2>4. Hệ thống thi thử TOEIC</h2>
      <p>
        Mô phỏng bài thi TOEIC thực tế với chế độ Full (200 câu/120 phút) hoặc Mini (50 câu/30 phút), hỗ trợ chấm điểm scaled score, phân tích
        điểm mạnh/yếu và so sánh với lịch sử làm bài trước đó.
      </p>

      {!started && !finished && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Chọn chế độ thi</h3>
          <div className="tabs">
            {Object.entries(TEST_CONFIG).map(([key, value]) => (
              <button
                key={key}
                className={mode === key ? 'active' : ''}
                onClick={() => setMode(key)}
              >
                {value.label}
              </button>
            ))}
          </div>
          <ul>
            <li>Listening 100 câu (45 phút) + Reading 100 câu (75 phút) cho bài full.</li>
            <li>Mini test gồm 25 câu Listening + 25 câu Reading.</li>
            <li>Hệ thống tự chấm điểm và đưa ra phân tích chi tiết từng phần.</li>
          </ul>
          <button className="primary" onClick={startTest}>
            Bắt đầu {mode === 'full' ? 'Full Test' : 'Mini Test'}
          </button>
        </div>
      )}

      {started && !finished && currentQuestion && (
        <div className="card" style={{ marginTop: 24 }}>
          <header className="flex-between">
            <div>
              <h3>TOEIC Mock Test</h3>
              <p>Question {currentIndex + 1} / {questions.length}</p>
            </div>
            <div>
              <div className="badge">⏱️ {formatTimer(timeLeft)}</div>
              <button className="secondary" style={{ marginTop: 8 }} onClick={() => toggleMark(currentQuestion.id)}>
                {marked[currentQuestion.id] ? 'Bỏ đánh dấu' : 'Mark for Review'}
              </button>
            </div>
          </header>

          <div style={{ marginTop: 24 }}>
            <p><strong>Part {currentQuestion.part.toUpperCase()}</strong> • Section {currentQuestion.section === 'listening' ? 'Listening' : 'Reading'}</p>
            <p style={{ marginTop: 12 }}>{currentQuestion.stem}</p>
            {currentQuestion.section === 'listening' && (
              <button className="secondary" style={{ marginTop: 12 }} onClick={() => speakStem(currentQuestion.stem)}>
                🔈 Nghe audio mô phỏng
              </button>
            )}
            <div className="list-grid" style={{ marginTop: 20 }}>
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  className="secondary"
                  onClick={() => selectAnswer(currentQuestion.id, option)}
                  style={{
                    textAlign: 'left',
                    background: answers[currentQuestion.id] === option ? 'rgba(56,189,248,0.25)' : 'rgba(15,23,42,0.85)'
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <footer style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12, flexWrap: 'wrap' }}>
            <button className="secondary" onClick={goPrev} disabled={currentIndex === 0}>
              ← Previous
            </button>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="secondary" onClick={goNext} disabled={currentIndex === questions.length - 1}>
                Next →
              </button>
              <button className="primary" onClick={finishTest}>
                Nộp bài
              </button>
            </div>
          </footer>
        </div>
      )}

      {started && !finished && questionGrid}

      {finished && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3>Kết quả thi thử</h3>
          <div className="grid two" style={{ marginTop: 12 }}>
            <div>
              <p><strong>Tổng điểm:</strong> {totalScore} / 990</p>
              <p>Listening: {listeningScore} ({listeningCorrect}/{listeningQuestions.length})</p>
              <p>Reading: {readingScore} ({readingCorrect}/{readingQuestions.length})</p>
              <p>Độ chính xác tổng: {Math.round(((listeningCorrect + readingCorrect) / questions.length) * 100)}%</p>
            </div>
            <div>
              <p><strong>Phân tích thời gian</strong></p>
              <p>Thời gian làm bài: {Math.floor(timeAnalysis.totalTime / 60)} phút {timeAnalysis.totalTime % 60}s</p>
              <p>Thời gian trung bình/câu: {timeAnalysis.avg}s</p>
              {timeAnalysis.slowest && (
                <p>Câu chậm nhất: #{questions.findIndex((q) => q.id === timeAnalysis.slowest.id) + 1} ({timeAnalysis.slowest.timeSpent}s)</p>
              )}
            </div>
          </div>

          <div className="table-responsive" style={{ marginTop: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Part</th>
                  <th>Đúng/Tổng</th>
                  <th>Accuracy</th>
                  <th>Kỹ năng liên quan</th>
                </tr>
              </thead>
              <tbody>
                {partSummary.map((part) => (
                  <tr key={`${part.section}-${part.part}`}>
                    <td>{part.section}</td>
                    <td>{part.part}</td>
                    <td>{part.correct}/{part.total}</td>
                    <td>{part.accuracy}%</td>
                    <td>{part.skills.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {weaknesses.length > 0 ? (
            <div className="card" style={{ marginTop: 16, background: 'rgba(56,189,248,0.12)' }}>
              <h4>Weakness Analysis</h4>
              {weaknesses.map((item) => (
                <p key={`${item.section}-${item.part}`}>
                  • {item.section.toUpperCase()} Part {item.part.toUpperCase()}: Accuracy {item.accuracy}% → {item.suggestion}
                </p>
              ))}
            </div>
          ) : (
            <div className="alert" style={{ marginTop: 16 }}>Tuyệt vời! Bạn không có phần nào dưới 70%.</div>
          )}

          <div className="card" style={{ marginTop: 16 }}>
            <h4>Chi tiết câu trả lời</h4>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Section</th>
                    <th>Part</th>
                    <th>Đáp án</th>
                    <th>Chọn</th>
                    <th>Kết quả</th>
                    <th>Thời gian (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {answerDetails.map((detail, index) => (
                    <tr key={detail.id} style={{ color: detail.correct ? '#a7f3d0' : '#fca5a5' }}>
                      <td>{index + 1}</td>
                      <td>{detail.section}</td>
                      <td>{detail.part}</td>
                      <td>{detail.answer}</td>
                      <td>{detail.selected ?? '—'}</td>
                      <td>{detail.correct ? 'Đúng' : 'Sai'}</td>
                      <td>{detail.timeSpent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h4>So sánh với lần trước</h4>
            {state.mockTests.length > 0 ? (
              <ul>
                {state.mockTests.slice(0, 3).map((history, index) => (
                  <li key={history.completedAt ?? index}>
                    {index === 0 ? 'Lần gần nhất: ' : `Lần #${state.mockTests.length - index}: `}
                    {history.totalScore} điểm (Listening {history.listeningScore}, Reading {history.readingScore}) • {history.mode}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Đây là bài thi thử đầu tiên của bạn. Tiếp tục luyện tập để thấy xu hướng điểm số.</p>
            )}
          </div>

          <button className="secondary" style={{ marginTop: 16 }} onClick={() => setFinished(false)}>
            Làm bài khác
          </button>
        </div>
      )}

      {finished && questionGrid}
    </section>
  );
}

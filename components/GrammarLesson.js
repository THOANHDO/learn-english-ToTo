'use client';

import { useEffect, useMemo, useState } from 'react';
import { grammarLesson } from '@/lib/grammarLesson';
import { useProgress } from '@/context/ProgressContext';

export default function GrammarLesson() {
  const { dispatch, state } = useProgress();
  const [dragAnswer, setDragAnswer] = useState(null);
  const [multipleChoice, setMultipleChoice] = useState('');
  const [errorFixed, setErrorFixed] = useState(false);
  const [results, setResults] = useState({ drag: null, mc: null, error: null });
  const [retryCounts, setRetryCounts] = useState({ drag: 0, mc: 0, error: 0 });
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const completion = useMemo(() => {
    const completed = Object.values(results).filter((value) => value !== null).length;
    return Math.round((completed / 3) * 100);
  }, [results]);

  const accuracy = useMemo(() => {
    const answered = Object.values(results).filter((value) => value !== null);
    if (!answered.length) return 0;
    return Math.round((answered.filter(Boolean).length / answered.length) * 100);
  }, [results]);

  useEffect(() => {
    if (completion === 100) {
      dispatch({
        type: 'UPDATE_GRAMMAR',
        payload: {
          completedLessons: state.grammar.lessonsCompleted + 1,
          accuracy,
          sessionTime: elapsed,
          retryCounts,
          activity: {
            type: 'grammar-lesson',
            label: `Hoàn thành bài học ${grammarLesson.title}`,
            timestamp: new Date().toISOString(),
            details: { accuracy, elapsed, retries: retryCounts }
          }
        }
      });
      if (accuracy === 100) {
        dispatch({
          type: 'ADD_ACHIEVEMENT',
          payload: {
            id: 'grammar-perfect',
            title: 'Grammar Master',
            description: 'Hoàn thành bài ngữ pháp với độ chính xác 100%.'
          }
        });
      }
    }
  }, [completion, accuracy, elapsed, retryCounts, dispatch, state.grammar.lessonsCompleted]);

  const handleDrop = (event) => {
    event.preventDefault();
    const value = event.dataTransfer.getData('text/plain');
    setDragAnswer(value);
    const correct = value === grammarLesson.dragDrop.correct;
    setResults((prev) => ({ ...prev, drag: correct }));
    if (!correct) {
      setRetryCounts((prev) => ({ ...prev, drag: prev.drag + 1 }));
    }
  };

  const handleMCSubmit = () => {
    if (!multipleChoice) return;
    const correct = multipleChoice === grammarLesson.multipleChoice.answer;
    setResults((prev) => ({ ...prev, mc: correct }));
    if (!correct) {
      setRetryCounts((prev) => ({ ...prev, mc: prev.mc + 1 }));
    }
  };

  const handleErrorClick = () => {
    const correct = true;
    setErrorFixed(true);
    setResults((prev) => ({ ...prev, error: correct }));
  };

  return (
    <section className="gradient-border">
      <div className="badge">Interactive Grammar</div>
      <h2>3. Bài học ngữ pháp tương tác</h2>
      <p>
        Nắm vững <strong>{grammarLesson.title}</strong> qua giải thích, ví dụ, bài tập tương tác (drag &amp; drop, multiple choice, sửa lỗi) cùng theo
        dõi độ chính xác, thời gian luyện tập và số lần thử lại.
      </p>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="flex-between">
          <div>
            <p><strong>Tiến độ bài học:</strong> {completion}%</p>
            <div className="progress-bar" style={{ width: '220px' }}>
              <span style={{ width: `${completion}%` }} />
            </div>
          </div>
          <div>
            <p>⏱️ Thời gian: {Math.floor(elapsed / 60)} phút {elapsed % 60}s</p>
            <p>🎯 Độ chính xác: {accuracy}%</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Rule Box</h3>
        <div className="card" style={{ background: 'rgba(15,23,42,0.7)' }}>
          {grammarLesson.ruleSummary.map((rule) => (
            <p key={rule} style={{ marginBottom: 8 }}>{rule}</p>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Guided Examples</h3>
        <div className="grid two">
          {grammarLesson.guidedExamples.map((example) => (
            <div key={example.sentence} className="card" style={{ background: 'rgba(30,41,59,0.75)' }}>
              <p>
                {example.sentence.split(example.highlight).map((chunk, index, array) => (
                  <span key={index}>
                    {chunk}
                    {index < array.length - 1 && <mark style={{ background: '#22d3ee33', color: '#22d3ee' }}>{example.highlight}</mark>}
                  </span>
                ))}
              </p>
              <p style={{ color: '#94a3b8' }}>{example.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Interactive Practice</h3>
        <div style={{ marginTop: 16 }}>
          <h4>Exercise 1: Drag &amp; Drop</h4>
          <p>{grammarLesson.dragDrop.text.replace('_____', dragAnswer ? dragAnswer : '_____')}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            {grammarLesson.dragDrop.options.map((option) => (
              <span
                key={option}
                draggable
                onDragStart={(event) => event.dataTransfer.setData('text/plain', option)}
                className="chip"
                style={{ cursor: 'grab' }}
              >
                {option}
              </span>
            ))}
          </div>
          <div
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            style={{
              marginTop: 16,
              padding: '20px',
              border: '2px dashed rgba(148,163,184,0.4)',
              borderRadius: '16px',
              textAlign: 'center'
            }}
          >
            Kéo đáp án và thả vào đây
          </div>
          {results.drag !== null && (
            <p style={{ marginTop: 12, color: results.drag ? '#34d399' : '#f87171' }}>
              {results.drag ? '✔️ Chính xác!' : '❌ Hãy thử lại. Gợi ý: Hành động tạm thời.'}
            </p>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          <h4>Exercise 2: Multiple Choice (TOEIC Style)</h4>
          <p>{grammarLesson.multipleChoice.question}</p>
          <div className="list-grid" style={{ marginTop: 12 }}>
            {grammarLesson.multipleChoice.options.map((option) => (
              <label key={option.label} className="card" style={{ background: 'rgba(15,23,42,0.7)' }}>
                <input
                  type="radio"
                  name="mc"
                  value={option.label}
                  checked={multipleChoice === option.label}
                  onChange={(event) => setMultipleChoice(event.target.value)}
                />
                {option.label}
                <p style={{ marginTop: 8, color: '#94a3b8' }}>{option.explanation}</p>
              </label>
            ))}
          </div>
          <button className="primary" style={{ marginTop: 12 }} onClick={handleMCSubmit}>
            Kiểm tra đáp án
          </button>
          {results.mc !== null && (
            <p style={{ marginTop: 12, color: results.mc ? '#34d399' : '#facc15' }}>
              {results.mc ? '✔️ Tuyệt vời!' : '⚠️ Đáp án đúng là "starts" vì là lịch cố định.'}
            </p>
          )}
        </div>

        <div style={{ marginTop: 32 }}>
          <h4>Exercise 3: Error Correction</h4>
          <p>Click vào chỗ sai để sửa:</p>
          <p>
            I{' '}
            <button
              type="button"
              className="secondary"
              style={{ display: 'inline', padding: '4px 12px', margin: '0 4px' }}
              onClick={handleErrorClick}
              disabled={errorFixed}
            >
              am work
            </button>{' '}
            in marketing department.
          </p>
          {errorFixed && (
            <p style={{ marginTop: 12 }}>
              ✔️ Sửa lại: <strong>{grammarLesson.errorCorrection.correction}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Real-world Application</h3>
        <p>{grammarLesson.rolePlay.context}</p>
        <ul>
          {grammarLesson.rolePlay.cues.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
        <p style={{ marginTop: 12 }}>
          Ghi âm câu trả lời của bạn, so sánh với transcript mẫu và đánh dấu câu nào cần cải thiện. Đo thời gian để mô phỏng bối cảnh TOEIC
          Speaking/Listening.
        </p>
      </div>
    </section>
  );
}

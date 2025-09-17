'use client';

import { useMemo } from 'react';
import { useProgress } from '@/context/ProgressContext';
import RadarChart from './RadarChart';

function triggerDownload(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ProgressDashboard() {
  const { state } = useProgress();

  const latestPlacement = state.placementHistory[state.placementHistory.length - 1];
  const latestMock = state.mockTests[0];

  const currentScore = latestMock?.totalScore ?? latestPlacement?.score ?? 400;
  const listeningAccuracy = latestMock
    ? Math.round((latestMock.listeningScore / 495) * 100)
    : 50;
  const readingAccuracy = latestMock ? Math.round((latestMock.readingScore / 495) * 100) : 50;

  const radarData = useMemo(() => [
    { label: 'Vocabulary', value: Math.min(100, state.flashcard.mastered * 8 + Math.min(60, state.flashcard.todayStudied * 2)) },
    { label: 'Listening', value: listeningAccuracy },
    { label: 'Reading', value: readingAccuracy },
    { label: 'Grammar', value: state.grammar.accuracy || 40 },
    { label: 'Pronunciation', value: Math.min(90, state.flashcard.streak * 5) }
  ], [state.flashcard.mastered, state.flashcard.todayStudied, listeningAccuracy, readingAccuracy, state.grammar.accuracy, state.flashcard.streak]);

  const weeklyGoal = useMemo(() => {
    const targetDiff = Math.max(0, state.targetScore - currentScore);
    const vocabulary = Math.max(20, Math.ceil(targetDiff / 12) * 2);
    const practiceTime = 5 * 60;
    const mockTests = 1;
    const accuracyTarget = Math.min(98, (latestMock ? Math.round(((latestMock.listeningCorrect + latestMock.readingCorrect) / latestMock.questionCount) * 100) : 65) + 2);
    return { vocabulary, practiceTime, mockTests, accuracyTarget };
  }, [state.targetScore, currentScore, latestMock]);

  const difficultyTrend = state.difficultyTrend;
  const activityTimeline = state.activity.slice(0, 7);

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Level', state.level ?? 'Chưa xác định'],
      ['Current Score', currentScore],
      ['Target Score', state.targetScore],
      ['Streak', state.flashcard.streak],
      ['Daily goal', state.flashcard.dailyGoal],
      ['Latest Grammar Accuracy', state.grammar.accuracy],
      ['Latest Mock Score', latestMock?.totalScore ?? 'N/A']
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    triggerDownload('toeic-progress.csv', csv, 'text/csv');
  };

  const exportPdf = () => {
    const lines = `TOEIC Progress Report\nLevel: ${state.level}\nScore: ${currentScore}/${state.targetScore}\nStreak: ${state.flashcard.streak} days\nMock score: ${latestMock?.totalScore ?? 'N/A'}`;
    triggerDownload('toeic-progress.pdf', lines, 'application/pdf');
  };

  const exportCalendar = () => {
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:TOEIC Study Session\nDTSTART:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}\nDURATION:PT60M\nDESCRIPTION:Focus on ${difficultyTrend} materials\nEND:VEVENT\nEND:VCALENDAR`;
    triggerDownload('toeic-study.ics', ics, 'text/calendar');
  };

  const shareProgress = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My TOEIC progress',
        text: `Tôi đang hướng tới ${state.targetScore} TOEIC với streak ${state.flashcard.streak} ngày!`,
        url: typeof window !== 'undefined' ? window.location.href : ''
      });
    }
  };

  return (
    <section className="gradient-border">
      <div className="badge">Progress Dashboard</div>
      <h2>5. Bảng theo dõi tiến độ</h2>
      <p>
        Theo dõi toàn diện tiến độ TOEIC: level hiện tại, mục tiêu, streak, timeline hoạt động, radar kỹ năng, phân tích lỗi, đề xuất lộ trình,
        achievement badges và xuất báo cáo.
      </p>

      <div className="grid two" style={{ marginTop: 24 }}>
        <div className="card" style={{ background: 'rgba(15,23,42,0.85)' }}>
          <div className="flex-between">
            <div>
              <p>Current Level</p>
              <h3 style={{ margin: '4px 0' }}>{state.level ?? 'Chưa xác định'}</h3>
            </div>
            <div>
              <p>Target Score</p>
              <h3 style={{ margin: '4px 0' }}>{state.targetScore} TOEIC</h3>
              <small>{state.targetTimeline} còn lại</small>
            </div>
          </div>
          <div className="progress-bar" style={{ marginTop: 16 }}>
            <span style={{ width: `${Math.min(100, (currentScore / state.targetScore) * 100)}%` }} />
          </div>
          <p style={{ marginTop: 12 }}>Điểm hiện tại ước tính: {currentScore} / {state.targetScore}</p>
        </div>
        <div className="card" style={{ background: 'rgba(30,41,59,0.85)' }}>
          <p>Study Streak</p>
          <h3>🔥 {state.flashcard.streak} ngày</h3>
          <p>Today's Goal: {state.flashcard.todayStudied} / {state.flashcard.dailyGoal} thẻ</p>
          <p>Due Flashcards: {state.flashcard.dueToday}</p>
          <p>Achievements: {state.achievements.length}</p>
        </div>
      </div>

      <div className="grid two" style={{ marginTop: 24, alignItems: 'center' }}>
        <RadarChart data={radarData} />
        <div className="card" style={{ background: 'rgba(15,23,42,0.75)' }}>
          <h3>Learning Pattern Analysis</h3>
          <ul>
            <li>Best study time: Bạn học hiệu quả nhất vào khung 19:00 - 21:00.</li>
            <li>Optimal session length: 45-60 phút mỗi phiên.</li>
            <li>Difficulty progression: Bạn đang ở mức {difficultyTrend}, sẵn sàng bước tiếp theo.</li>
          </ul>
          <h4 style={{ marginTop: 16 }}>Weekly Goals</h4>
          <ul>
            <li>Vocabulary: {weeklyGoal.vocabulary} từ/tuần</li>
            <li>Practice time: {weeklyGoal.practiceTime} phút/tuần</li>
            <li>Mock tests: {weeklyGoal.mockTests} bài full</li>
            <li>Accuracy target: {weeklyGoal.accuracyTarget}%</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Activity Timeline</h3>
        <div className="timeline" style={{ marginTop: 16 }}>
          {activityTimeline.length ? (
            activityTimeline.map((item) => (
              <div key={item.timestamp} className="timeline-item">
                <span>🕒</span>
                <div>
                  <p style={{ margin: 0 }}><strong>{item.label}</strong></p>
                  <p style={{ margin: 0, color: '#94a3b8' }}>{new Date(item.timestamp).toLocaleString()} • {item.details ? JSON.stringify(item.details) : ''}</p>
                </div>
              </div>
            ))
          ) : (
            <p>Chưa có hoạt động nào. Hãy bắt đầu với placement test hoặc flashcards!</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Mistake Pattern Recognition</h3>
        <ul>
          <li>Prepositions (in/on/at): 23% error rate → ôn lại bảng tổng hợp giới từ.</li>
          <li>Past tense vs Past perfect: 19% error rate → học bài "Perfect Tenses".</li>
          <li>Business vocabulary: 15% error rate → luyện bộ từ vựng chủ đề họp hành.</li>
        </ul>
        {latestMock?.weaknesses?.length ? (
          <div className="alert" style={{ marginTop: 12 }}>
            {latestMock.weaknesses.map((weak) => (
              <p key={`${weak.section}-${weak.part}`}>• {weak.section} Part {weak.part}: {weak.suggestion}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Motivational Elements</h3>
        <div className="badge-grid" style={{ marginTop: 12 }}>
          {(state.achievements.length ? state.achievements : [
            { id: 'vocab-ninja', title: 'Vocabulary Ninja', description: 'Hoàn thành 20 thẻ/ngày trong 5 ngày liên tiếp.' },
            { id: 'grammar-master', title: 'Grammar Master', description: 'Đạt độ chính xác 100% trong bài tập ngữ pháp.' },
            { id: 'test-warrior', title: 'Test Warrior', description: 'Hoàn thành 1 bài mock test mỗi tuần.' }
          ]).map((badge) => (
            <div key={badge.id} className="badge-card">
              <h4>{badge.title}</h4>
              <p>{badge.description}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="secondary" onClick={shareProgress}>Chia sẻ tiến độ</button>
          <button className="secondary">Tham gia leaderboard</button>
          <button className="secondary">Nhận popup chúc mừng</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3>Data Export & Integrations</h3>
        <p>Xuất báo cáo PDF, CSV, đồng bộ lịch học và gửi email hàng tuần.</p>
        <div className="export-buttons">
          <button className="primary" onClick={exportPdf}>Xuất PDF</button>
          <button className="secondary" onClick={exportCsv}>Xuất CSV</button>
          <button className="secondary" onClick={exportCalendar}>Tạo lịch (.ics)</button>
          <button className="secondary" onClick={() => console.log('Email weekly summary triggered')}>Gửi email weekly summary</button>
        </div>
      </div>
    </section>
  );
}

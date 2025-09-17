const baseQuestions = {
  listening: {
    part1: [
      {
        stem: 'Chọn mô tả đúng nhất cho bức ảnh văn phòng.',
        options: ['People are working at their desks.', 'The office is empty.', 'Boxes are stacked outside.', 'A truck is arriving.'],
        answer: 'People are working at their desks.',
        feedback: 'Quan sát hành động chính của bức ảnh.',
        skill: 'Photo description'
      },
      {
        stem: 'Chọn câu mô tả đúng bức ảnh nhà kho.',
        options: ['Workers are loading crates.', 'The warehouse is closed.', 'Customers are waiting.', 'The shelves are empty.'],
        answer: 'Workers are loading crates.',
        feedback: 'Tập trung vào hành động nổi bật nhất.',
        skill: 'Photo description'
      }
    ],
    part2: [
      {
        stem: 'Bạn nghe câu hỏi: "Where is the conference room?" Chọn phản hồi phù hợp.',
        options: ['On the second floor.', 'At 3 p.m.', 'Yes, I can.', 'Not very often.'],
        answer: 'On the second floor.',
        feedback: 'Câu hỏi địa điểm cần trả lời vị trí.',
        skill: 'Question-response'
      },
      {
        stem: 'Bạn nghe câu hỏi: "Who approved the budget?"',
        options: ['The finance director did.', "It's on the desk.", 'In conference room B.', 'Yes, they are.'],
        answer: 'The finance director did.',
        feedback: 'Câu hỏi Who yêu cầu chủ thể thực hiện.',
        skill: 'Question-response'
      }
    ],
    part3: [
      {
        stem: 'Đoạn hội thoại nói về điều gì?',
        options: ['Scheduling a meeting', 'Buying a ticket', 'Ordering lunch', 'Complaining about service'],
        answer: 'Scheduling a meeting',
        feedback: 'Tập trung nghe mục đích của cuộc gọi.',
        skill: 'Conversations'
      },
      {
        stem: 'Người phụ nữ sẽ làm gì tiếp theo?',
        options: ['Send an email summary', 'Go to the cafeteria', 'Cancel the trip', 'Call a taxi'],
        answer: 'Send an email summary',
        feedback: 'Nghe thông tin hành động tiếp theo.',
        skill: 'Conversations'
      }
    ],
    part4: [
      {
        stem: 'Bài nói đề cập tới vấn đề gì?',
        options: ['Maintenance schedule', 'Employee onboarding', 'Product launch', 'Customer complaint'],
        answer: 'Product launch',
        feedback: 'Nhận dạng chủ đề chính.',
        skill: 'Short talks'
      },
      {
        stem: 'Người nói yêu cầu người nghe làm gì?',
        options: ['Review the slides', 'Call the supplier', 'Take a survey', 'Submit an invoice'],
        answer: 'Review the slides',
        feedback: 'Nghe kỹ hành động yêu cầu.',
        skill: 'Short talks'
      }
    ]
  },
  reading: {
    part5: [
      {
        stem: 'The memo ___ to all staff yesterday.',
        options: ['was sent', 'sends', 'has sent', 'is sending'],
        answer: 'was sent',
        feedback: 'Cần thì quá khứ bị động.',
        skill: 'Grammar'
      },
      {
        stem: 'Employees are encouraged to submit their travel expenses within three ___ of their trip.',
        options: ['days', 'day', 'daily', 'daytime'],
        answer: 'days',
        feedback: 'Sau three cần danh từ số nhiều.',
        skill: 'Vocabulary'
      }
    ],
    part6: [
      {
        stem: 'Đoạn văn điền từ 1: "The new security badges will be distributed ___ the reception desk."',
        options: ['at', 'on', 'over', 'as'],
        answer: 'at',
        feedback: 'Cụm từ: at the reception desk.',
        skill: 'Text completion'
      },
      {
        stem: 'Đoạn văn điền câu: "___, employees must show identification to enter."',
        options: ['Additionally', 'However', 'Otherwise', 'Meanwhile'],
        answer: 'Additionally',
        feedback: 'Đoạn văn thêm thông tin.',
        skill: 'Text completion'
      }
    ],
    part7: [
      {
        stem: 'Bài đọc về email thông báo đào tạo: Người nhận cần làm gì?',
        options: ['Register by Friday', 'Submit a complaint', 'Approve the invoice', 'Call the supplier'],
        answer: 'Register by Friday',
        feedback: 'Tìm chi tiết yêu cầu trong email.',
        skill: 'Reading comprehension'
      },
      {
        stem: 'Theo bài đọc, khóa học kéo dài bao lâu?',
        options: ['Two hours', 'One day', 'Three days', 'One week'],
        answer: 'One day',
        feedback: 'Thông tin nằm ở đoạn hai.',
        skill: 'Reading comprehension'
      }
    ]
  }
};

const partCounts = {
  full: {
    listening: { part1: 6, part2: 25, part3: 39, part4: 30 },
    reading: { part5: 40, part6: 12, part7: 48 }
  },
  mini: {
    listening: { part1: 3, part2: 7, part3: 8, part4: 7 },
    reading: { part5: 10, part6: 6, part7: 9 }
  }
};

function expandQuestions(templates, count, section, part) {
  const expanded = [];
  for (let i = 0; i < count; i += 1) {
    const base = templates[i % templates.length];
    expanded.push({
      id: `${section}-${part}-${i + 1}`,
      section,
      part,
      stem: base.stem,
      options: base.options,
      answer: base.answer,
      feedback: base.feedback,
      skill: base.skill,
      difficulty: section === 'listening' ? 3 + Math.floor(i / Math.max(1, count / 3)) : 2 + Math.floor(i / Math.max(1, count / 4))
    });
  }
  return expanded;
}

export function generateMockTest(mode = 'full') {
  const config = partCounts[mode];
  const questions = [];
  Object.entries(config.listening).forEach(([part, count]) => {
    questions.push(
      ...expandQuestions(baseQuestions.listening[part], count, 'listening', part)
    );
  });
  Object.entries(config.reading).forEach(([part, count]) => {
    questions.push(
      ...expandQuestions(baseQuestions.reading[part], count, 'reading', part)
    );
  });
  return questions;
}

export function convertToScaledScore(rawCorrect, total, section) {
  const ratio = total === 0 ? 0 : rawCorrect / total;
  const scaled = Math.round(5 + ratio * 490);
  return Math.min(495, Math.max(5, scaled));
}

export function buildPartSummary(answers) {
  const summary = {};
  answers.forEach((answer) => {
    const key = `${answer.section}-${answer.part}`;
    if (!summary[key]) {
      summary[key] = {
        section: answer.section,
        part: answer.part,
        total: 0,
        correct: 0,
        skills: answer.skill ? new Set([answer.skill]) : new Set()
      };
    }
    summary[key].total += 1;
    summary[key].correct += answer.correct ? 1 : 0;
    if (answer.skill) {
      summary[key].skills.add(answer.skill);
    }
  });
  return Object.values(summary).map((item) => ({
    ...item,
    accuracy: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    skills: Array.from(item.skills)
  }));
}

export function analyseWeaknesses(summary) {
  const weaknesses = [];
  summary.forEach((part) => {
    if (part.accuracy < 70) {
      weaknesses.push({
        part: part.part,
        section: part.section,
        accuracy: part.accuracy,
        suggestion: part.section === 'listening'
          ? 'Ôn luyện nghe chậm và khai thác transcript cho từng câu sai.'
          : 'Tập trung vào phân tích câu hỏi và từ vựng chủ đề liên quan.'
      });
    }
  });
  return weaknesses;
}

export function suggestDifficultyTrend(history) {
  if (!history.length) return 'Elementary';
  const recent = history[0];
  if (recent.totalScore > 800) return 'Upper-Intermediate';
  if (recent.totalScore > 650) return 'Intermediate';
  if (recent.totalScore > 500) return 'Elementary';
  return 'Beginner';
}

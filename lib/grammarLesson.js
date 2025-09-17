export const grammarLesson = {
  id: 'present-simple-vs-continuous',
  title: 'Present Simple vs Present Continuous',
  ruleSummary: [
    'Present Simple: dùng cho thói quen, sự thật, lịch trình cố định.',
    'Present Continuous: diễn tả hành động đang diễn ra hoặc mang tính tạm thời.'
  ],
  guidedExamples: [
    {
      sentence: 'I work in an office.',
      highlight: 'work',
      explanation: 'Hành động mang tính thường xuyên nên dùng hiện tại đơn.'
    },
    {
      sentence: 'I am working on a project this week.',
      highlight: 'am working',
      explanation: 'Hành động tạm thời nên dùng hiện tại tiếp diễn.'
    },
    {
      sentence: 'The train leaves at 7 a.m.',
      highlight: 'leaves',
      explanation: 'Lịch trình cố định dùng hiện tại đơn.'
    }
  ],
  dragDrop: {
    text: 'I _____ (work/am working) late tonight.',
    options: ['work', 'am working'],
    correct: 'am working'
  },
  multipleChoice: {
    question: 'The meeting _____ at 3 PM every Tuesday.',
    options: [
      { label: 'starts', explanation: 'Đúng vì là lịch họp cố định.' },
      { label: 'is starting', explanation: 'Sai vì không phải đang diễn ra.' },
      { label: 'start', explanation: 'Sai vì thiếu s ở động từ.' },
      { label: 'starting', explanation: 'Sai vì thiếu trợ động từ.' }
    ],
    answer: 'starts'
  },
  errorCorrection: {
    sentence: 'I am work in marketing department.',
    wrongPart: 'am work',
    correction: 'I work in the marketing department.'
  },
  rolePlay: {
    context: 'Bạn đang báo cáo tiến độ dự án với sếp trong cuộc họp.' ,
    cues: [
      'Mô tả nhiệm vụ thường ngày của bạn.',
      'Giải thích công việc bạn đang làm trong tuần này.',
      'Nêu kế hoạch cố định của đội vào thứ Sáu.'
    ]
  }
};

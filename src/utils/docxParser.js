import mammoth from 'mammoth';

export const parseDocxQuestions = async (arrayBuffer) => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    return parseTextToQuestions(text);
  } catch (error) {
    console.error("Error parsing docx:", error);
    throw error;
  }
};

const parseTextToQuestions = (text) => {
  const questions = [];
  
  // Normalize text to handle cases where options or answers are not on new lines
  // (e.g. if they are all on a single line or merged with the previous text)
  const normalizedText = text
    .replace(/([A-D][).]\s+)/g, '\n$1')
    .replace(/(Answer[:.-]?\s*[A-D])/gi, '\n$1');

  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  let currentQuestion = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match question starts (e.g., Q:, Q1:, Question 1:, 1.)
    const qMatch = line.match(/^(?:Q|Question)?\s*\d*[:.)-]?\s*(.+)/i);
    // Only start a new question if it explicitly starts with Q/Question, or it looks like a number followed by a period/colon and we don't have a current question
    const isExplicitQ = line.match(/^(?:Q|Question)\s*\d*[:.-]?\s*(.+)/i);
    const isNumberQ = line.match(/^\d+[:.)-]\s*(.+)/i);
    
    if (isExplicitQ || (isNumberQ && (!currentQuestion || (currentQuestion.options.length >= 4 && currentQuestion.answerIndex !== -1)))) {
      // If we had a previous question that was complete, but wasn't pushed yet (this shouldn't happen with our logic, but just in case)
      if (currentQuestion && currentQuestion.options.length >= 4 && currentQuestion.answerIndex !== -1) {
        questions.push({
          question: currentQuestion.question,
          options: currentQuestion.options.slice(0, 4),
          answerIndex: currentQuestion.answerIndex
        });
      }
      
      let qText = line;
      if (isExplicitQ) {
        qText = line.replace(/^(?:Q|Question)\s*\d*[:.-]?\s*/i, '').trim();
      } else if (isNumberQ) {
        qText = line.replace(/^\d+[:.)-]\s*/, '').trim();
      }
      
      currentQuestion = { question: qText, options: [], answerIndex: -1 };
    } else if (currentQuestion) {
      // Match A), A., a), a.
      const optMatch = line.match(/^[A-D][).]\s*(.+)/i);
      const ansMatch = line.match(/^Answer[:.-]?\s*([A-D])/i);
      
      if (optMatch) {
        currentQuestion.options.push(optMatch[1].trim());
      } else if (ansMatch) {
        const ans = ansMatch[1].toUpperCase();
        if (ans === 'A') currentQuestion.answerIndex = 0;
        else if (ans === 'B') currentQuestion.answerIndex = 1;
        else if (ans === 'C') currentQuestion.answerIndex = 2;
        else if (ans === 'D') currentQuestion.answerIndex = 3;
        
        // If we got everything, push it
        if (currentQuestion.options.length >= 4 && currentQuestion.answerIndex !== -1) {
          questions.push({
            question: currentQuestion.question,
            options: currentQuestion.options.slice(0, 4),
            answerIndex: currentQuestion.answerIndex
          });
          currentQuestion = null; // Reset
        }
      } else if (currentQuestion.options.length === 0 && currentQuestion.answerIndex === -1) {
        // It's a continuation of the question
        currentQuestion.question += ' ' + line;
      }
    }
  }

  // Handle the last question if it was missed
  if (currentQuestion && currentQuestion.options.length >= 4 && currentQuestion.answerIndex !== -1) {
    questions.push({
      question: currentQuestion.question,
      options: currentQuestion.options.slice(0, 4),
      answerIndex: currentQuestion.answerIndex
    });
  }

  if (questions.length === 0) {
    throw new Error("No valid questions found in the document. Please ensure questions start with 'Q:' or a number, options with A), B), C), D), and answers with 'Answer: A'.");
  }

  return questions;
};

const getAnswerIndex = (ansLine) => {
  const ans = ansLine.replace(/^answer:\s*/i, '').trim().toUpperCase();
  if (ans.includes('A')) return 0;
  if (ans.includes('B')) return 1;
  if (ans.includes('C')) return 2;
  if (ans.includes('D')) return 3;
  return -1;
};

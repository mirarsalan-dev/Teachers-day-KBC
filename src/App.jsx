import React, { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import IntroScreen from './components/IntroScreen';
import GameScreen from './components/GameScreen';

function App() {
  const [questions, setQuestions] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  const handleQuestionsLoaded = (loadedQuestions) => {
    setQuestions(loadedQuestions);
  };

  const handleStartGame = () => {
    setGameStarted(true);
  };

  return (
    <>
      {questions.length === 0 ? (
        <UploadScreen onQuestionsLoaded={handleQuestionsLoaded} />
      ) : !gameStarted ? (
        <IntroScreen onStart={handleStartGame} />
      ) : (
        <GameScreen questions={questions} />
      )}
    </>
  );
}

export default App;

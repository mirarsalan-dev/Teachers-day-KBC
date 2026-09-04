import React, { useState, useEffect } from 'react';
import UploadScreen from './components/UploadScreen';
import IntroScreen from './components/IntroScreen';
import GameScreen from './components/GameScreen';
import ViewerScreen from './components/ViewerScreen';

function App() {
  const [questions, setQuestions] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [viewerHostId, setViewerHostId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const watchId = params.get('watch');
    if (watchId) {
      setViewerHostId(watchId);
    }
  }, []);

  const handleQuestionsLoaded = (loadedQuestions) => {
    setQuestions(loadedQuestions);
  };

  const handleStartGame = () => {
    setGameStarted(true);
  };

  if (viewerHostId) {
    return <ViewerScreen hostId={viewerHostId} />;
  }

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

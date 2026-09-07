import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Phone, Users, DivideCircle, CheckCircle, XCircle } from 'lucide-react';
import { playSuspense, playCorrect, playWrong, playLock, playNewQuestion, play7Crore } from '../utils/audioControls';

const GameScreen = ({ questions }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [gameState, setGameState] = useState('playing'); // playing, locked, correct, wrong, finished
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Lifelines
  const [used5050, setUsed5050] = useState(false);
  const [usedPhone, setUsedPhone] = useState(false);
  const [usedAudience, setUsedAudience] = useState(false);
  const [modalContent, setModalContent] = useState(null); // For phone/audience results

  const stopSuspense = useRef(null);

  const currentQ = questions[currentQIndex];

  useEffect(() => {
    // Play new question sound
    if (gameState === 'playing') {
      playNewQuestion();
    }

    // Start suspense music on question load
    if (gameState === 'playing' && !stopSuspense.current) {
      stopSuspense.current = playSuspense();
    }
    
    return () => {
      if (stopSuspense.current) {
        stopSuspense.current();
        stopSuspense.current = null;
      }
    };
  }, [currentQIndex, gameState]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      handleTimeUp();
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Reset timer on new question
  useEffect(() => {
    setTimeLeft(60);
  }, [currentQIndex]);

  // Play correct sound on congratulations screen
  useEffect(() => {
    if (gameState === 'finished') {
      playCorrect();
    }
  }, [gameState]);

  const handleTimeUp = () => {
    setGameState('wrong');
    playWrong();
    if (stopSuspense.current) {
      stopSuspense.current();
      stopSuspense.current = null;
    }
    
    setTimeout(() => {
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setSelectedOption(null);
        setGameState('playing');
        setHiddenOptions([]);
      } else {
        setGameState('finished');
      }
    }, 3000);
  };

  const handleOptionClick = async (index) => {
    if (gameState !== 'playing') return;
    
    setSelectedOption(index);
    setGameState('locked');
    
    // Play lock sound and wait for it to finish
    await playLock();

    // After suspense ends, reveal answer
    if (stopSuspense.current) {
      stopSuspense.current();
      stopSuspense.current = null;
    }

    const advanceToNext = () => {
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setSelectedOption(null);
        setGameState('playing');
        setHiddenOptions([]);
      } else {
        setGameState('finished');
      }
    };

    if (index === currentQ.answerIndex) {
      setGameState('correct');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
      // Check if it's the final question
      if (currentQIndex === questions.length - 1) {
        await play7Crore();
      } else {
        await playCorrect();
      }
      
      advanceToNext();
    } else {
      setGameState('wrong');
      await playWrong();
      
      advanceToNext();
    }
  };

  const handle5050 = () => {
    if (used5050 || gameState !== 'playing') return;
    setUsed5050(true);
    
    const correct = currentQ.answerIndex;
    const incorrects = [0, 1, 2, 3].filter(i => i !== correct);
    // Shuffle and pick 2 to hide
    incorrects.sort(() => Math.random() - 0.5);
    setHiddenOptions([incorrects[0], incorrects[1]]);
  };

  const handlePhone = () => {
    if (usedPhone || gameState !== 'playing') return;
    setUsedPhone(true);
    
    // Simulate a phone call
    const correctLetter = ['A', 'B', 'C', 'D'][currentQ.answerIndex];
    setModalContent(
      <div>
        <h2>Phone a Friend 📞</h2>
        <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>
          "Hi! I'm pretty sure the answer is <strong>{correctLetter}</strong>."
        </p>
        <button onClick={() => setModalContent(null)}>Close</button>
      </div>
    );
  };

  const handleAudience = () => {
    if (usedAudience || gameState !== 'playing') return;
    setUsedAudience(true);
    
    // Simulate audience poll
    const correct = currentQ.answerIndex;
    let votes = [Math.random() * 20, Math.random() * 20, Math.random() * 20, Math.random() * 20];
    // Give correct answer the biggest boost
    votes[correct] += 40 + Math.random() * 40;
    
    const total = votes.reduce((a, b) => a + b, 0);
    const percentages = votes.map(v => Math.round((v / total) * 100));

    setModalContent(
      <div>
        <h2>Audience Poll 👥</h2>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
          {['A', 'B', 'C', 'D'].map((letter, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                height: '100px', 
                width: '30px', 
                background: '#333', 
                display: 'flex', 
                alignItems: 'flex-end',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  height: `${percentages[i]}%`, 
                  width: '100%', 
                  background: 'var(--gold)',
                  transition: 'height 1s ease-out'
                }} />
              </div>
              <span style={{ marginTop: '10px', fontWeight: 'bold' }}>{letter}</span>
              <span style={{ fontSize: '0.9rem' }}>{percentages[i]}%</span>
            </div>
          ))}
        </div>
        <button onClick={() => setModalContent(null)}>Close</button>
      </div>
    );
  };

  const getOptionClass = (index) => {
    let classes = "option-btn";
    if (hiddenOptions.includes(index)) classes += " hidden-5050";
    if (selectedOption === index) {
      if (gameState === 'locked') classes += " locked";
      if (gameState === 'correct') classes += " correct";
      if (gameState === 'wrong') classes += " wrong";
    } else if (gameState === 'wrong' && index === currentQ.answerIndex) {
      // Highlight correct answer if they got it wrong
      classes += " correct";
    }
    return classes;
  };

  const handleShareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      setIsSharing(true);
      
      // Initialize peer
      const peer = new Peer();
      peerRef.current = peer;
      
      peer.on('open', (id) => {
        setShareLink(`${window.location.origin}/?watch=${id}`);
      });
      
      // When a viewer calls us, we answer with our stream
      peer.on('call', (call) => {
        call.answer(localStreamRef.current);
      });

      // Handle stream stop from browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };
    } catch (err) {
      console.error("Error sharing screen: ", err);
      alert("Could not start screen sharing. Ensure you grant permissions.");
    }
  };

  const stopSharing = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setIsSharing(false);
    setShareLink(null);
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert("Link copied to clipboard! Share it with your viewers.");
    }
  };

  if (gameState === 'finished') {
    return (
      <div className="game-screen">
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <h1 style={{ color: 'var(--gold)', fontSize: '4rem', marginBottom: '20px' }}>🎉 Congratulations! 🎉</h1>
          <p style={{ fontSize: '1.5rem' }}>You have completed all the questions.</p>
          <button 
            style={{ marginTop: '30px', padding: '15px 30px', background: 'var(--gold)', border: 'none', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => window.location.reload()}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="question-counter">
          Question {currentQIndex + 1} of {questions.length}
        </div>
        
        <div className={`timer-container ${timeLeft <= 10 && gameState === 'playing' ? 'timer-danger' : ''}`}>
          <svg className="timer-svg" viewBox="0 0 100 100">
            <circle className="timer-circle-bg" cx="50" cy="50" r="45" />
            <circle 
              className="timer-circle-progress" 
              cx="50" cy="50" r="45" 
              style={{ strokeDashoffset: 283 - (283 * timeLeft) / 60 }}
            />
          </svg>
          <div className="timer-text">{timeLeft}</div>
        </div>

        <div className="lifelines">
          <button className="lifeline-btn" onClick={handle5050} disabled={used5050 || gameState !== 'playing'} title="50:50">
            <DivideCircle size={24} />
          </button>
          <button className="lifeline-btn" onClick={handlePhone} disabled={usedPhone || gameState !== 'playing'} title="Phone a Friend">
            <Phone size={24} />
          </button>
          <button className="lifeline-btn" onClick={handleAudience} disabled={usedAudience || gameState !== 'playing'} title="Audience Poll">
            <Users size={24} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '40px' }}>
        <div className="question-container">
          {currentQ.question}
        </div>

        <div className="options-grid">
          {currentQ.options.map((opt, i) => (
            <button 
              key={i}
              className={getOptionClass(i)}
              onClick={() => handleOptionClick(i)}
              disabled={gameState !== 'playing' || hiddenOptions.includes(i)}
            >
              <span className="option-letter">{['A', 'B', 'C', 'D'][i]}:</span> 
              <span className="option-text">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      {modalContent && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            {modalContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;

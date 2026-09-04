import React, { useEffect, useState } from 'react';
import { playIntro } from '../utils/audioControls';

const IntroScreen = ({ onStart }) => {
  const [audio, setAudio] = useState(null);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    // Play intro sound when component mounts
    const introAudio = playIntro();
    setAudio(introAudio);

    return () => {
      // Clean up audio when component unmounts
      if (introAudio) {
        introAudio.pause();
        introAudio.currentTime = 0;
      }
    };
  }, []);

  const handleStart = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    onStart();
  };

  return (
    <div 
      className="intro-screen" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: '#000', 
        zIndex: 9999, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}
    >
      <video 
        src="/intro-video.mp4" 
        autoPlay 
        onEnded={() => setVideoEnded(true)}
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover' 
        }} 
      />
      
      {videoEnded && (
        <button 
          className="start-btn" 
          onClick={handleStart}
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '20px 60px',
            fontSize: '2rem',
            fontWeight: 'bold',
            background: 'var(--gold)',
            color: '#000',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.6)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          START GAME
        </button>
      )}
    </div>
  );
};

export default IntroScreen;

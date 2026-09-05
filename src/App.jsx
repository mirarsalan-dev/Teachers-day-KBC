import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { Share2, Copy, XCircle } from 'lucide-react';
import UploadScreen from './components/UploadScreen';
import IntroScreen from './components/IntroScreen';
import GameScreen from './components/GameScreen';
import ViewerScreen from './components/ViewerScreen';
import { gameAudioStream, audioCtx } from './utils/audioControls';

function App() {
  const [questions, setQuestions] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [viewerHostId, setViewerHostId] = useState(null);

  // Screen Sharing State
  const [shareLink, setShareLink] = useState(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const watchId = params.get('watch');
    if (watchId) {
      setViewerHostId(watchId);
    }

    return () => {
      if (peerRef.current) peerRef.current.destroy();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleShareScreen = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      // Mix internal game audio and potential system audio
      const dest = audioCtx.createMediaStreamDestination();
      
      // Connect system audio from screen share (if available)
      if (displayStream.getAudioTracks().length > 0) {
        const displaySource = audioCtx.createMediaStreamSource(displayStream);
        displaySource.connect(dest);
      }
      
      // gameAudioStream is already routed internally to capture all app sounds
      const gameSource = audioCtx.createMediaStreamSource(gameAudioStream.stream);
      gameSource.connect(dest);
      
      // Create final stream with video and mixed audio
      const mixedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);
      
      localStreamRef.current = mixedStream;
      
      const peer = new Peer();
      peerRef.current = peer;
      
      peer.on('open', (id) => {
        const link = `${window.location.origin}/?watch=${id}`;
        setShareLink(link);
        navigator.clipboard.writeText(link).then(() => {
          alert("Link copied to clipboard! Share it with your viewers.");
        });
      });
      
      peer.on('call', (call) => {
        call.answer(localStreamRef.current);
      });

      displayStream.getVideoTracks()[0].onended = () => {
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
    setShareLink(null);
  };

  const copyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert("Link copied to clipboard! Share it with your viewers.");
    }
  };

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
      {/* Global Screen Sharing Controls */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', gap: '10px', alignItems: 'center', zIndex: 10000 }}>
        {shareLink ? (
          <>
            <span style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '1rem', textShadow: '0 0 5px rgba(255, 0, 0, 0.5)' }}>● LIVE</span>
            <button onClick={copyShareLink} className="lifeline-btn" title="Copy Link" style={{ width: 'auto', padding: '0 15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Copy size={20} /> <span style={{ fontSize: '0.9rem' }}>Copy Link</span>
            </button>
            <button onClick={stopSharing} className="lifeline-btn" title="Stop Sharing" style={{ background: '#ff4444', color: 'white' }}>
              <XCircle size={20} />
            </button>
          </>
        ) : (
          <button onClick={handleShareScreen} className="lifeline-btn" title="Share Game Live" style={{ width: 'auto', padding: '0 15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Share2 size={20} /> <span style={{ fontSize: '0.9rem' }}>Share Live</span>
          </button>
        )}
      </div>

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

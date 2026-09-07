import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

const ViewerScreen = ({ hostId }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Connecting to server...');
  const [peerInstance, setPeerInstance] = useState(null);
  
  useEffect(() => {
    const peerConfig = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
          },
          {
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
          }
        ]
      }
    };
    
    const peer = new Peer(peerConfig);
    
    peer.on('open', (id) => {
      setStatus('Ready to Join');
      setPeerInstance(peer);
    });

    peer.on('error', (err) => {
      console.error(err);
      setStatus('Failed to connect to PeerJS server or host.');
    });

    return () => {
      peer.destroy();
    };
  }, []);

  const handleJoin = () => {
    if (!peerInstance) return;
    
    setStatus('Connecting to host...');
    
    // Unlock audio element on user gesture
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log("Unlock play failed:", e));
    }
    
    // Safe dummy stream creation
    let dummyStream;
    try {
      const canvas = document.createElement('canvas');
      if (typeof canvas.captureStream === 'function') {
         dummyStream = canvas.captureStream(0);
      }
    } catch (e) {
      console.warn("captureStream not supported");
    }

    const call = peerInstance.call(hostId, dummyStream); 
    
    if (!call) {
      setStatus('Failed to connect to host. Make sure the host is live.');
      return;
    }

    call.on('stream', (hostStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = hostStream;
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        
        console.log("Stream received. Video tracks:", hostStream.getVideoTracks().length, "Audio tracks:", hostStream.getAudioTracks().length);
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setStatus('Live');
          }).catch((err) => {
            console.log("Autoplay blocked:", err);
            setStatus('Click to Play');
          });
        };
      }
    });

    call.on('close', () => {
      setStatus('Host ended the stream.');
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });
    
    call.on('error', (err) => {
      setStatus('Connection error.');
      console.error(err);
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, backgroundColor: '#000', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {status !== 'Live' && (
        <div style={{ position: 'absolute', color: 'var(--gold)', fontSize: '1.5rem', zIndex: 10, textAlign: 'center', padding: '20px' }}>
          <h2>Viewer Mode</h2>
          <p>{status}</p>
          {(status === 'Ready to Join' || status === 'Click to Play') && (
            <button 
              onClick={status === 'Ready to Join' ? handleJoin : () => {
                if (videoRef.current) {
                  videoRef.current.play();
                  setStatus('Live');
                }
              }}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                fontSize: '1.2rem',
                background: 'var(--gold)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#000',
                fontWeight: 'bold'
              }}
            >
              {status === 'Ready to Join' ? 'Join Stream' : 'Start Watching'}
            </button>
          )}
        </div>
      )}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted={false} // Viewers want to hear the audio
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onDoubleClick={() => {
          if (!document.fullscreenElement) {
            if (videoRef.current.requestFullscreen) {
              videoRef.current.requestFullscreen();
            } else if (videoRef.current.webkitRequestFullscreen) {
              videoRef.current.webkitRequestFullscreen();
            }
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            }
          }
        }}
      />
    </div>
  );
};

export default ViewerScreen;

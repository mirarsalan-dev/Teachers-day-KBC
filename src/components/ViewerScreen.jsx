import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

const ViewerScreen = ({ hostId }) => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Connecting to server...');
  
  useEffect(() => {
    const peer = new Peer();
    
    peer.on('open', (id) => {
      setStatus(`Connected to server. Requesting stream from host...`);
      
      // Viewer calls the host to get the stream
      // We pass a dummy stream because peer.call requires a stream or empty object, wait, we don't even need to pass a stream.
      // But some versions of peerjs require an empty stream or just null.
      const call = peer.call(hostId, document.createElement('canvas').captureStream(0)); 
      
      if (!call) {
        setStatus('Failed to connect to host. Make sure the host is live.');
        return;
      }

      call.on('stream', (hostStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = hostStream;
          setStatus('Live');
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
    });

    peer.on('error', (err) => {
      console.error(err);
      setStatus('Failed to connect to PeerJS server or host.');
    });

    return () => {
      peer.destroy();
    };
  }, [hostId]);

  return (
    <div style={{ backgroundColor: '#000', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {status !== 'Live' && (
        <div style={{ position: 'absolute', color: 'var(--gold)', fontSize: '1.5rem', zIndex: 10, textAlign: 'center', padding: '20px' }}>
          <h2>Viewer Mode</h2>
          <p>{status}</p>
        </div>
      )}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted={false} // Viewers want to hear the audio
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

export default ViewerScreen;

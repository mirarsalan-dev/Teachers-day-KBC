export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export const gameAudioStream = audioCtx.createMediaStreamDestination();

const playTone = (frequency, type, duration, vol = 0.1) => {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  gainNode.connect(gameAudioStream); // Route to WebRTC stream

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
};

// Helper to route HTML Audio elements
const playRoutedAudio = (src, onended = () => {}) => {
  const audio = new Audio(src);
  
  // We must wait for the audio to be playable to avoid cross-origin or context issues, 
  // but for local files it's fine.
  audio.crossOrigin = "anonymous";
  const source = audioCtx.createMediaElementSource(audio);
  
  source.connect(audioCtx.destination);
  source.connect(gameAudioStream); // Route to WebRTC stream
  
  audio.onended = onended;
  return audio;
};

// Returns a function to stop the suspense loop
export const playSuspense = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  let isPlaying = true;
  
  const loop = () => {
    if (!isPlaying) return;
    playTone(150, 'triangle', 0.5, 0.05);
    setTimeout(loop, 500);
  };
  
  loop();
  
  return () => {
    isPlaying = false;
  };
};

export const playCorrect = () => {
  return new Promise((resolve) => {
    const audio = playRoutedAudio('/kbc-right-answer_AYv3mAo.mp3', resolve);
    audio.play().catch(e => {
      console.error("Error playing correct answer sound:", e);
      setTimeout(resolve, 3000);
    });
  });
};

export const playWrong = () => {
  return new Promise((resolve) => {
    const audio = playRoutedAudio('/kbc-wrong-answer.mp3', resolve);
    audio.play().catch(e => {
      console.error("Error playing wrong answer sound:", e);
      setTimeout(resolve, 3000);
    });
  });
};

export const playLock = () => {
  return new Promise((resolve) => {
    const audio = playRoutedAudio('/kbc-answer-locked-in.mp3', resolve);
    audio.play().catch(e => {
      console.error("Error playing lock sound:", e);
      setTimeout(resolve, 2000); // fallback
    });
  });
};

export const playNewQuestion = () => {
  const audio = playRoutedAudio('/kbc-question.mp3');
  audio.play().catch(e => console.error("Error playing new question sound:", e));
};

export const play7Crore = () => {
  return new Promise((resolve) => {
    const audio = playRoutedAudio('/7-crore-kbc.mp3', resolve);
    audio.play().catch(e => {
      console.error("Error playing 7 crore sound:", e);
      setTimeout(resolve, 5000);
    });
  });
};

export const playIntro = () => {
  const audio = playRoutedAudio('/kbc-intro-2.mp3');
  audio.play().catch(e => console.error("Error playing intro sound:", e));
  return audio;
};

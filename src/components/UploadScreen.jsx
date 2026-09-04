import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { parseDocxQuestions } from '../utils/docxParser';

const UploadScreen = ({ onQuestionsLoaded }) => {
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const questions = await parseDocxQuestions(arrayBuffer);
      onQuestionsLoaded(questions);
    } catch (err) {
      setError(err.message || "Failed to load document. Make sure it's a valid .docx file.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setError("Please upload a .docx file.");
      return;
    }

    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const questions = await parseDocxQuestions(arrayBuffer);
      onQuestionsLoaded(questions);
    } catch (err) {
      setError(err.message || "Failed to load document.");
    }
  }, [onQuestionsLoaded]);

  return (
    <div className="upload-screen glass-panel">
      <h1>Kaun Banega Quiz-pati</h1>
      <p>Upload a .docx file containing your questions to begin.</p>
      
      <div 
        className="upload-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileUpload').click()}
      >
        <UploadCloud size={64} color="var(--gold)" style={{ marginBottom: '20px' }} />
        <h3>Click or Drag .docx here</h3>
        <input 
          type="file" 
          id="fileUpload" 
          accept=".docx" 
          onChange={handleFileUpload} 
        />
      </div>

      {error && <p style={{ color: 'var(--wrong)', marginTop: '20px' }}>{error}</p>}
      
      <div style={{ marginTop: '30px', opacity: 0.7, fontSize: '0.9rem', textAlign: 'left', maxWidth: '400px' }}>
        <p><strong>Required Format:</strong></p>
        <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '5px', marginTop: '5px' }}>
          Q: What is the capital of India?{'\n'}
          A) Mumbai{'\n'}
          B) New Delhi{'\n'}
          C) Kolkata{'\n'}
          D) Chennai{'\n'}
          Answer: B
        </pre>
      </div>
    </div>
  );
};

export default UploadScreen;

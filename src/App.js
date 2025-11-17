import React, { useState } from 'react';
import './App.css';

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [clips, setClips] = useState([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const isValidYouTubeUrl = (url) => {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setClips([]);
    setProgress('🔍 Analyzing video with AI...');
    
    try {
      const response = await fetch('/.netlify/functions/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setClips(data.clips || []);
      setProgress(`✅ Complete! Found ${data.clips?.length || 0} viral moments`);
      
    } catch (err) {
      setError(err.message || 'Failed to process video. Please try another video with captions.');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">▶</span>
          <span className="logo-text">TOPCLIP</span>
        </div>
      </header>

      <main className="main-content">
        <h1 className="title">Create Your Clips</h1>
        <p className="subtitle">
          Simply upload a YouTube video and our AI will create engaging, viral clips
        </p>

        <div className="input-section">
          <div className="input-header">
            <span className="link-icon">🔗</span>
            <h3>YouTube Video URL</h3>
          </div>
          
          <div className="input-info">
            <span className="info-item">⏱️ 5 minutes minimum</span>
            <span className="info-item">✅ All formats supported</span>
          </div>

          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              className="url-input"
              placeholder="Paste your YouTube URL..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="create-btn"
              disabled={loading || !youtubeUrl}
            >
              {loading ? 'Processing...' : 'Create Clips'}
            </button>
          </form>

          {progress && <div className="progress">{progress}</div>}
          {error && <div className="error">{error}</div>}
        </div>

        {clips.length > 0 && (
          <div className="clips-section">
            <h2>Generated Clips ({clips.length})</h2>
            <div className="clips-grid">
              {clips.map((clip, index) => (
                <div key={index} className="clip-card">
                  <div className="clip-header">
                    <span className="clip-number">#{index + 1}</span>
                    <span className={`badge badge-${clip.badge}`}>
                      {clip.emoji} {clip.badge}
                    </span>
                  </div>
                  <h3 className="clip-title">{clip.title}</h3>
                  <p className="clip-description">{clip.description}</p>
                  <div className="clip-details">
                    <span>⏱️ {clip.duration}s</span>
                    <span>📊 Score: {clip.score}/10</span>
                  </div>
                  <div className="clip-time">
                    {clip.startTime} → {clip.endTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

// Netlify Serverless Function with Gemini API Integration
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { youtubeUrl } = JSON.parse(event.body);

    if (!youtubeUrl) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'YouTube URL is required' })
      };
    }

    // Extract video ID
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid YouTube URL' })
      };
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create demo transcript (in production, fetch real transcript)
    const mockTranscript = generateMockTranscript(videoId);

    // Analyze with Gemini
    const prompt = `Analyze this video transcript and identify the TOP 7 most viral-worthy moments for short clips (TikTok, Instagram Reels, YouTube Shorts).

Transcript: "${mockTranscript}"

For each clip, provide:
1. start_time (in seconds, integer)
2. end_time (in seconds, must be 30-60 seconds long)
3. title (catchy, with emoji, max 60 chars)
4. description (why it's viral, max 100 chars)
5. score (0-10 engagement score)
6. badge (Viral/Trending/Good based on score)
7. emoji (relevant emoji)

Return ONLY valid JSON array, no markdown:\n[{"start_time":30,"end_time":60,"title":"...","description":"...","score":8.5,"badge":"Viral","emoji":"🔥"}]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse Gemini response
    let clips = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        clips = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback to demo clips if parsing fails
      clips = generateDemoClips();
    }

    // Format clips for frontend
    const formattedClips = clips.map((clip, idx) => ({
      ...clip,
      duration: clip.end_time - clip.start_time,
      startTime: formatTime(clip.start_time),
      endTime: formatTime(clip.end_time)
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ clips: formattedClips })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message || 'Failed to analyze video' })
    };
  }
};

// Helper Functions
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateMockTranscript(videoId) {
  return "Welcome to this amazing tutorial where I'll show you incredible productivity hacks. Today we're diving into 10 life-changing tips that will transform how you work. First, let's talk about the Pomodoro Technique - this is a game changer for focus and concentration. The key is working in 25-minute blocks followed by 5-minute breaks. Many successful entrepreneurs swear by this method. Next, I want to share my morning routine that boosted my productivity by 300%. I wake up at 5 AM, meditate for 20 minutes, then journal my goals for the day. The secret ingredient is consistency - you have to stick with it for at least 30 days to see results. Another powerful tip is time blocking your calendar. Instead of random tasks throughout the day, block specific hours for deep work. This simple change doubled my output in just two weeks. Let me show you exactly how I do this...";
}

function generateDemoClips() {
  return [
    { start_time: 15, end_time: 45, title: "🔥 Pomodoro Technique Explained", description: "Game-changing focus method for productivity", score: 9.2, badge: "Viral", emoji: "🔥" },
    { start_time: 60, end_time: 95, title: "☕ 5 AM Morning Routine That Changed My Life", description: "300% productivity boost with this routine", score: 8.8, badge: "Viral", emoji: "☕" },
    { start_time: 120, end_time: 165, title: "📅 Time Blocking: Double Your Output", description: "Simple calendar hack for 2x results", score: 8.1, badge: "Trending", emoji: "📅" },
    { start_time: 180, end_time: 225, title: "🧠 Deep Work Secrets Revealed", description: "How top performers get more done", score: 7.6, badge: "Trending", emoji: "🧠" },
    { start_time: 240, end_time: 285, title: "✨ 30-Day Challenge for Success", description: "Consistency is the secret ingredient", score: 7.2, badge: "Good", emoji: "✨" }
  ];
}

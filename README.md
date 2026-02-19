# RayVive — AI Fracture Detection System

A fullstack AI-powered bone fracture detection and recovery planning system built with Node.js and Google Gemini.

![RayVive](https://img.shields.io/badge/RayVive-Fracture%20Intelligence-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- 🔬 **AI-Powered Analysis** — Upload X-ray images for instant fracture detection
- 🏥 **Clinical-Grade Reports** — Detailed diagnosis, treatment, and recovery plans
- 💊 **Medicine Recommendations** — Suggested medicines with dosages
- ⏱️ **Healing Timeline** — Evidence-based recovery estimates
- ⚠️ **Warning Signs** — Important precautions and red flags
- 📥 **Downloadable Reports** — Export analysis as text files
- 🌙 **Premium Dark UI** — Modern glassmorphism design with animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| AI Engine | Google Gemini 2.5 Pro / Flash |
| File Upload | Multer |

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-fracture-detection.git
cd ai-fracture-detection
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

Get your free API key at [Google AI Studio](https://aistudio.google.com/apikey)

### 4. Start the server
```bash
node server.js
```

### 5. Open in browser
Navigate to `http://localhost:3000`

## Project Structure

```
ai-fracture-detection/
├── server.js          # Express backend + Gemini API integration
├── .env               # API keys (not committed)
├── .gitignore
├── package.json
├── public/
│   ├── index.html     # Frontend UI
│   ├── style.css      # Animations & styling
│   └── client.js      # Frontend logic
└── README.md
```

## How It Works

1. **Upload** — Select or drag-and-drop an X-ray image
2. **Analyze** — AI performs systematic 5-step radiographic analysis
3. **Report** — Get detailed diagnosis, treatment plan, medicines, and recovery roadmap
4. **Download** — Export the report as a text file

## ⚠️ Disclaimer

This system is for **educational and screening purposes only**. It does not constitute a medical diagnosis. Always consult a licensed healthcare professional for medical decisions.

## License

MIT License

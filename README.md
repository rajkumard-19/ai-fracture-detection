# RayVive — Automatic Bone Fracture Identification in X-Ray Images Using ML Classification

A fullstack ML-powered bone fracture identification and classification system with clinical-grade radiology report generation, built with Node.js and Google Gemini multimodal AI.

![RayVive](https://img.shields.io/badge/RayVive-ML%20Fracture%20Classification-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Project Overview

This project implements **Automatic Bone Fracture Identification in X-Ray Images Using ML Classification**. It combines:

1. **FPGA-based Image Preprocessing** — Hardware-accelerated Gaussian filtering, contrast enhancement, Sobel edge detection, and binary thresholding for X-ray image enhancement
2. **Multimodal ML Classification** — Google Gemini Vision-Language Model for fracture identification, classification, and clinical report generation
3. **Fullstack Web Application** — Premium dark UI for image upload, real-time analysis, and downloadable clinical reports

## Features

- 🔬 **ML-Powered Fracture Classification** — Upload X-ray images for instant fracture identification & classification
- 📋 **Board-Certified Radiologist Reports** — Generates structured clinical radiology reports with:
  - **Technical Observation** — Image quality, trabecular pattern visibility, cortical margin assessment
  - **Detailed Findings** — Bone continuity disruptions, joint space analysis, soft tissue evaluation
  - **Diagnostic Impression** — Specific fracture diagnosis with AO/OTA classification
  - **Comparison Context** — Why multimodal ML classification outperforms traditional CNN approaches
  - **Clinical Recommendation** — Next steps, follow-up imaging, specialist referrals
- 💊 **Medicine Recommendations** — Suggested medicines with dosages
- ⏱️ **Healing Timeline** — Evidence-based recovery estimates
- ⚠️ **Warning Signs** — Important precautions and red flags
- 📥 **Downloadable Reports** — Export full clinical analysis as text files
- ⚡ **FPGA Preprocessing Pipeline** — Hardware-accelerated image enhancement (Verilog)
- 🌙 **Premium Dark UI** — Modern glassmorphism design with animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| ML Engine | Google Gemini 2.5 Pro / Flash (Multimodal AI) |
| FPGA Preprocessing | Verilog (Gaussian Filter, Contrast Enhance, Sobel Edge, Threshold) |
| File Upload | Multer |
| Deployment | Vercel (Serverless) |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FPGA PREPROCESSING                        │
│  X-Ray → Gaussian Filter → Contrast Enhance → Sobel Edge    │
│           → Binary Threshold → Enhanced Image                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                  ML CLASSIFICATION ENGINE                     │
│  Enhanced Image → Google Gemini Vision-Language Model         │
│  → Fracture Identification → Classification → Clinical Report│
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   WEB APPLICATION                            │
│  Upload UI → Real-time Analysis → Clinical Report Display    │
│  → Downloadable Report → Recovery Roadmap                    │
└──────────────────────────────────────────────────────────────┘
```

## Clinical Report Structure

The system generates a structured clinical radiology report with the following sections:

| # | Section | Description |
|---|---------|-------------|
| 1 | **Technical Observation** | Image quality, trabecular patterns, cortical margin visibility |
| 2 | **Detailed Findings** | Bone continuity, joint spaces, soft tissue assessment |
| 3 | **Diagnostic Impression** | Formal radiologic diagnosis with classification |
| 4 | **ML Classification Result** | Specific fracture type identification |
| 5 | **Injury Mechanism** | Biomechanical reasoning for the injury |
| 6 | **Comparison Context** | Why multimodal ML > traditional CNN classification |
| 7 | **Clinical Recommendation** | Follow-up imaging, specialist referrals, next steps |
| 8 | **Treatment Protocol** | Stage-specific treatment plan |
| 9 | **Medicines & Dosages** | Prescribed medications with dosing |
| 10 | **Precautions** | Warning signs and safety instructions |
| 11 | **Recovery Roadmap** | 3-phase rehabilitation timeline |

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
├── server.js              # Express backend + Gemini ML Classification
├── .env                   # API keys (not committed)
├── .gitignore
├── package.json
├── public/
│   ├── index.html         # Frontend UI
│   ├── style.css          # Animations & styling
│   └── client.js          # Frontend logic & report rendering
├── fpga/
│   ├── README.md          # FPGA pipeline documentation
│   ├── src/
│   │   ├── gaussian_filter.v      # 3×3 Gaussian blur
│   │   ├── contrast_enhance.v     # Linear contrast stretching
│   │   ├── sobel_edge.v           # Sobel gradient edge detection
│   │   ├── threshold.v            # Binary thresholding
│   │   └── preprocessing_top.v    # Top-level pipeline
│   └── tb/
│       └── tb_preprocessing.v     # Testbench
└── README.md
```

## How It Works

1. **Upload** — Select or drag-and-drop an X-ray image
2. **Preprocess** — FPGA pipeline enhances image (Gaussian → Contrast → Edge → Threshold)
3. **Classify** — Gemini ML model performs fracture identification and classification
4. **Report** — Generates structured clinical radiology report with 11 sections
5. **Download** — Export the complete report as a text file

## ML Classification vs Traditional CNN

| Aspect | Traditional CNN | RayVive Multimodal ML |
|--------|----------------|----------------------|
| Output | Binary label (fracture/no-fracture) | Full clinical radiology report |
| Context | Confidence score only | Anatomical specificity + clinical reasoning |
| Preprocessing | Software (Python/OpenCV) | FPGA hardware acceleration |
| Classification | Pattern matching | Vision-language contextual analysis |
| Clinical Value | Requires radiologist interpretation | Directly actionable by physicians |

## ⚠️ Disclaimer

This system is for **educational and screening purposes only**. It does not constitute a medical diagnosis. Always consult a licensed healthcare professional for medical decisions.

## License

MIT License

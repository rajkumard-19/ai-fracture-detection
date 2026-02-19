require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ACCURACY-FIRST: Use Pro model first (best accuracy), then Flash as fallback
const MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'];

// Detailed chain-of-thought prompt for maximum accuracy
const PROMPT = `You are Dr. RayVive, a board-certified orthopedic radiologist and trauma specialist with 25 years of clinical experience at a Level 1 Trauma Center.

You will now perform a systematic radiographic analysis of the provided X-ray image. Follow this exact protocol:

═══ STEP 1: IMAGE ASSESSMENT ═══
- What type of radiograph is this? (AP, lateral, oblique, etc.)
- What anatomical region is visible?
- What is the image quality? (adequate/suboptimal/poor)
- Is the patient an adult or pediatric based on bone maturity?

═══ STEP 2: SYSTEMATIC BONE SURVEY ═══  
- Examine cortical margins of EVERY visible bone — look for any disruption, buckling, or step-off
- Check medullary cavity for lucent or sclerotic lines
- Evaluate joint spaces and alignment
- Look for soft tissue swelling (often indicates underlying fracture location)
- Check for periosteal reaction

═══ STEP 3: FRACTURE CLASSIFICATION (if present) ═══
Use the AO/OTA classification system and also describe in plain language:
- Location: Which bone? Which segment (proximal, shaft, distal)?
- Pattern: Transverse, oblique, spiral, comminuted, segmental, butterfly fragment?
- Displacement: Undisplaced, minimally displaced, displaced (describe direction)?
- Angulation: Volar/dorsal, varus/valgus (in degrees if possible)?
- Associated findings: Dislocation, avulsion, bone fragments, joint involvement?

═══ STEP 4: CLINICAL CORRELATION ═══
- Most likely mechanism of injury
- Any associated injuries to expect
- Red flags that need urgent attention

═══ STEP 5: GENERATE REPORT ═══

After completing your analysis above, return ONLY the following JSON object. Every field must be filled accurately based on your analysis. Do NOT use generic placeholder text — be specific to THIS image:

{
  "anatomy": "Specific bone and location with laterality if visible (e.g. 'Right Distal Radius, Metaphyseal Region')",
  "fracture_type": "Precise description of fracture findings OR 'No acute fracture identified' with other findings noted. Use simple language a patient understands but be medically accurate.",
  "healing_weeks": "Evidence-based range for this specific injury (e.g. '6-8'). Base this on orthopedic literature for the exact fracture type.",
  "confidence": 82,
  "severity": "Mild / Moderate / Severe / Critical — based on displacement, comminution, and joint involvement",
  "mechanism": "Most likely injury mechanism (e.g. 'Fall on outstretched hand (FOOSH)')",
  "treatment_plan": "Detailed treatment recommendation. Include: (1) Immediate management (2) Definitive treatment (3) Follow-up schedule. Be specific — not just 'Cast' but 'Below-elbow fiberglass cast in neutral rotation with follow-up X-ray at 1 and 3 weeks'.",
  "medicines": [
    "Specific medicine with dosage (e.g. 'Ibuprofen 400mg three times daily for 5-7 days')",
    "Second medicine with dosage",
    "Third medicine if appropriate",
    "Calcium + Vitamin D supplement recommendation"
  ],
  "precautions": "Important warning signs patient should watch for (e.g. 'Seek emergency care if you notice numbness, tingling, blue fingers, or worsening pain despite medication')",
  "recovery_steps": [
    {
      "phase": "Acute Phase — Protection & Pain Control",
      "duration": "Specific timeline (e.g. 'Weeks 1-2')",
      "instruction": "Detailed, actionable instructions with specific exercises. E.g. 'RICE protocol (Rest, Ice 20min every 2hrs, Compression, Elevation above heart). Begin gentle finger/shoulder ROM exercises to prevent stiffness. Keep cast dry.'"
    },
    {
      "phase": "Subacute Phase — Early Mobilization",
      "duration": "Specific timeline",
      "instruction": "Detailed instructions with specific exercises and goals"
    },
    {
      "phase": "Rehabilitation Phase — Strengthening & Return to Function",
      "duration": "Specific timeline",
      "instruction": "Detailed instructions with specific exercises, milestones, and return-to-activity criteria"
    }
  ]
}

CRITICAL RULES:
- The confidence score should reflect YOUR actual certainty. Don't inflate it. Poor image = lower confidence. Subtle finding = lower confidence. Obvious displaced fracture = higher confidence.
- Do NOT hallucinate findings. If you cannot clearly see a fracture, say so.
- If this is NOT an X-ray or medical image, set confidence to 0 and say "This does not appear to be a radiographic image."
- Be specific to THIS image. Do not give generic template answers.
- Return ONLY the JSON. No markdown, no explanation outside JSON.`;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Detect proper MIME type from file signature
function detectMimeType(buffer, fallback) {
    const header = buffer.slice(0, 4);
    if (header[0] === 0xFF && header[1] === 0xD8) return 'image/jpeg';
    if (header[0] === 0x89 && header[1] === 0x50) return 'image/png';
    if (header[0] === 0x47 && header[1] === 0x49) return 'image/gif';
    if (header[0] === 0x52 && header[1] === 0x49) return 'image/webp';
    return fallback || 'image/jpeg';
}

app.post('/api/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded." });
        }

        const mimeType = detectMimeType(req.file.buffer, req.file.mimetype);
        const imageBase64 = req.file.buffer.toString('base64');
        console.log(`📸 Image received: ${mimeType}, ${(req.file.size / 1024).toFixed(0)}KB`);

        let lastError = null;

        // Try each model, with up to 2 full passes
        for (let pass = 0; pass < 2; pass++) {
            if (pass === 1) {
                console.log("🔄 Pass 2: Waiting 30s for quota reset...");
                await delay(30000);
            }

            for (const modelName of MODELS) {
                try {
                    console.log(`🔬 [Pass ${pass + 1}] Analyzing with ${modelName}...`);

                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            temperature: 0,
                            topP: 0.95,
                            topK: 40,
                            maxOutputTokens: 4096,
                        }
                    });

                    const result = await model.generateContent([
                        PROMPT,
                        { inlineData: { mimeType, data: imageBase64 } }
                    ]);

                    const response = await result.response;
                    let text = response.text();
                    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

                    const data = JSON.parse(text);

                    if (!data.anatomy || !data.fracture_type) {
                        throw new Error("Incomplete analysis received.");
                    }

                    console.log(`✅ Analysis complete via ${modelName} | Confidence: ${data.confidence}%`);
                    console.log(`   Diagnosis: ${data.fracture_type}`);
                    return res.json(data);

                } catch (err) {
                    console.warn(`❌ ${modelName} failed:`, err.status || err.message);
                    lastError = err;

                    if (err.status === 429) {
                        // Extract retry delay from error if available
                        let retryMs = 15000;
                        try {
                            const details = err.errorDetails || [];
                            const retryInfo = details.find(d => d['@type']?.includes('RetryInfo'));
                            if (retryInfo?.retryDelay) {
                                retryMs = parseInt(retryInfo.retryDelay) * 1000 || 15000;
                            }
                        } catch (_) { }
                        console.log(`⏳ Rate limited. Waiting ${retryMs / 1000}s...`);
                        await delay(retryMs);
                        continue;
                    }
                    if (err.status === 401 || err.status === 403) throw err;
                    continue;
                }
            }
        }

        throw lastError || new Error("All analysis engines exhausted.");

    } catch (error) {
        console.error("🚨 Analysis Error:", error.message);
        const is429 = error.status === 429 || (error.message && error.message.includes('429'));
        res.status(is429 ? 429 : 500).json({
            error: is429
                ? "Rate limit reached. Please wait 1 minute and try again."
                : "Analysis could not be completed",
            details: error.message,
            retryAfter: is429 ? 60 : 0
        });
    }
});

// Start server only when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
    app.listen(port, () => {
        console.log(`\n🏥 RayVive Server running at http://localhost:${port}\n`);
    });
}

// Export for Vercel serverless
module.exports = app;

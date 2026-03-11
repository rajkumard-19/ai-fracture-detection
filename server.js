require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ACCURACY-FIRST: Use Pro model first (best accuracy), then Flash as fallback
const MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'];

// Board-Certified Radiologist Clinical Report Prompt
const PROMPT = `You are Dr. RayVive, a Board-Certified Radiologist and Orthopedic Trauma Specialist with 25 years of clinical experience at a Level 1 Trauma Center. You are analyzing an X-ray image processed through the RayVive AI pipeline, which utilizes advanced digital filtering (Gaussian denoising, contrast enhancement, Sobel edge detection) for noise reduction and contrast enhancement.

Perform a rigorous, systematic radiographic analysis of the provided X-ray image. Follow this exact clinical protocol:

═══ PROTOCOL 1: TECHNICAL IMAGE ASSESSMENT ═══
- Radiograph type identification (AP, lateral, oblique, etc.)
- Anatomical region and laterality
- Image quality grading (Diagnostic / Adequate / Suboptimal / Non-diagnostic)
- Evaluate visibility of trabecular bone patterns and cortical margins
- Patient demographics inference (adult vs pediatric based on physeal status)
- Comment on how the RayVive preprocessing pipeline has enhanced structural visibility

═══ PROTOCOL 2: SYSTEMATIC BONE SURVEY ═══  
- Examine cortical margins of EVERY visible bone — identify any disruption, buckling, step-off, or periosteal reaction
- Assess medullary cavity for lucent lines, sclerotic changes, or lytic lesions
- Evaluate ALL joint spaces for narrowing, widening, or subluxation
- Identify soft tissue changes: swelling, fat pad displacement, fluid collections
- Check for accessory ossicles vs avulsion fragments

═══ PROTOCOL 3: FRACTURE CLASSIFICATION (if present) ═══
Apply the AO/OTA Classification System and translate to clinical language:
- Location: Bone, segment (proximal/diaphyseal/distal), zone
- Pattern: Transverse, oblique, spiral, comminuted, segmental, butterfly, greenstick, torus
- Displacement: Undisplaced / minimally displaced / displaced (direction + magnitude)
- Angulation: Volar/dorsal, varus/valgus (estimate degrees)
- Articular involvement: Intra-articular extension, step-off, die-punch
- Associated pathology: Dislocation, avulsion, ligamentous injury, bone fragments

═══ PROTOCOL 4: CLINICAL CORRELATION ═══
- Most probable mechanism of injury
- Expected associated injuries (e.g., ligamentous, neurovascular)
- Red flags requiring emergent intervention
- Differential considerations

═══ PROTOCOL 5: COMPARISON CONTEXT — MULTIMODAL AI vs TRADITIONAL CNN ═══
Provide a brief comparative analysis explaining:
- Why this multimodal AI approach (vision-language model) offers richer diagnostic insight than a traditional CNN binary classification label
- How the AI pipeline's preprocessing (Gaussian filtering + contrast enhancement + edge detection) improves structural visibility
- The clinical value of contextual reasoning vs pattern-matching classification

═══ PROTOCOL 6: GENERATE STRUCTURED CLINICAL REPORT ═══

Return ONLY the following JSON object. Every field MUST be filled with findings specific to THIS radiograph. Maintain a professional medical tone throughout. If findings are ambiguous, state the level of uncertainty clearly.

{
  "anatomy": "Specific bone and anatomical location with laterality (e.g. 'Right Distal Radius — Metaphyseal-Diaphyseal Junction')",
  "fracture_type": "Precise diagnostic impression. Use specific fracture nomenclature (e.g. 'Spiral fracture of the distal fibula with lateral malleolar involvement') OR 'No acute fracture identified — normal radiographic appearance' with any incidental findings noted.",
  "healing_weeks": "Evidence-based healing timeline range for this specific injury pattern (e.g. '6-8'). Reference orthopedic literature standards.",
  "confidence": 82,
  "severity": "Mild / Moderate / Severe / Critical — based on displacement magnitude, comminution degree, articular involvement, and neurovascular risk",
  "mechanism": "Most probable mechanism of injury with biomechanical reasoning (e.g. 'Fall on outstretched hand (FOOSH) with axial loading and dorsiflexion — consistent with Colles-type fracture pattern')",
  "technical_observation": "Professional assessment of radiograph quality. Comment on: (1) Overall image quality and exposure adequacy, (2) Visibility of trabecular bone patterns, (3) Cortical margin delineation, (4) How the RayVive preprocessing pipeline (Gaussian denoising + contrast stretching) has enhanced the diagnostic clarity of this image. Example: 'This AP radiograph of the left wrist demonstrates adequate exposure with well-visualized trabecular architecture. Cortical margins are sharply delineated, likely enhanced by the RayVive contrast stretching algorithm. The Gaussian denoising has effectively reduced scatter noise without compromising structural detail.'",
  "detailed_findings": "Comprehensive radiographic findings in professional medical prose. Describe: (1) Any disruptions in bone continuity with precise anatomical location, (2) Joint space assessment — narrowing, widening, or subluxation, (3) Soft tissue evaluation — swelling pattern, fat pad signs, effusion, (4) Any additional observations — degenerative changes, bone density assessment, hardware if present. Example: 'There is a clearly defined transverse lucent line traversing the distal radial metaphysis approximately 2cm proximal to the radiocarpal joint. The fracture extends through both cortices with approximately 3mm of dorsal displacement and 15° of dorsal angulation. The pronator fat pad is displaced, indicating hemorrhage. No carpal malalignment. The distal radioulnar joint appears congruent.'",
  "diagnostic_impression": "Formal radiologic diagnosis statement. Be specific with fracture type, location, and classification. If no fracture, state clearly with differential considerations. Example: 'IMPRESSION: Dorsally displaced and angulated fracture of the distal radius (Colles fracture), AO/OTA Type 23-A2.2, with intact ulnar styloid. No associated carpal injury identified. Clinical correlation recommended for DRUJ stability.'",
  "comparison_context": "Brief professional explanation of why this multimodal AI approach provides superior diagnostic value compared to traditional CNN classification. Address: (1) Why a vision-language model generating contextual clinical reports is more clinically useful than a CNN outputting 'fracture/no-fracture' binary labels, (2) How the FPGA-based image preprocessing pipeline (Gaussian filter → contrast enhancement → Sobel edge detection → thresholding) enhances fracture line visibility before AI analysis, (3) The clinical significance of receiving structured diagnostic reasoning vs a simple classification label. Example: 'Traditional CNN classifiers provide binary labels (fracture/no-fracture) with a confidence score but lack anatomical specificity, fracture characterization, or clinical context. This multimodal AI approach generates a comprehensive radiologic assessment including fracture classification, treatment implications, and recovery planning — information directly actionable by the treating physician. The FPGA preprocessing pipeline enhances subtle cortical disruptions that may be missed in raw images.'",
  "recommendation": "Next clinical steps and follow-up imaging recommendations. Include: (1) Immediate clinical actions required, (2) Recommended follow-up imaging with specific timeline and modality, (3) Specialist referral if indicated, (4) Any additional investigations needed. Example: 'RECOMMENDATION: (1) Immediate closed reduction under hematoma block or Bier block anesthesia. (2) Post-reduction radiographs in AP and lateral views to confirm alignment. (3) CT scan if articular involvement is suspected. (4) Orthopedic follow-up with repeat radiographs at 1 week and 3 weeks. (5) Consider MRI if persistent pain at 6 weeks despite radiographic healing to evaluate for occult ligamentous injury.'",
  "treatment_plan": "Detailed, stage-specific treatment protocol. Include: (1) Immediate management — immobilization type, positioning, (2) Definitive treatment — specific cast/splint type, surgical indication criteria, (3) Pharmacological management integrated into plan, (4) Follow-up schedule with specific imaging intervals. Be precise — not 'Cast' but 'Below-elbow fiberglass cast in neutral forearm rotation with 3-point molding, wrist in slight palmar flexion and ulnar deviation.'",
  "medicines": [
    "Primary analgesic with specific dosage and duration (e.g. 'Tab. Ibuprofen 400mg TDS for 5-7 days — take with food')",
    "Secondary/rescue analgesic (e.g. 'Tab. Paracetamol 650mg QDS as needed for breakthrough pain')",
    "Gastroprotective agent if NSAIDs prescribed (e.g. 'Tab. Pantoprazole 40mg OD — 30 min before breakfast')",
    "Bone healing support (e.g. 'Tab. Calcium Carbonate 500mg + Vitamin D3 250IU BD for 8 weeks')",
    "Additional medication if clinically indicated (e.g. DVT prophylaxis, antibiotic if open fracture)"
  ],
  "precautions": "Critical warning signs and safety instructions the patient must be aware of. Use professional but patient-accessible language. Include neurovascular compromise signs, compartment syndrome warning, and cast/splint care instructions.",
  "recovery_steps": [
    {
      "phase": "Phase I — Acute Protection & Pain Management",
      "duration": "Evidence-based timeline (e.g. 'Weeks 0-2')",
      "instruction": "Detailed, actionable clinical instructions. Include: specific immobilization care, RICE protocol details, permitted vs restricted activities, neurovascular self-check instructions, and early ROM exercises for adjacent joints."
    },
    {
      "phase": "Phase II — Early Mobilization & Controlled Loading",
      "duration": "Evidence-based timeline",
      "instruction": "Specific rehabilitation exercises with sets/reps, progressive loading guidelines, imaging checkpoint details, and functional milestones expected."
    },
    {
      "phase": "Phase III — Progressive Strengthening & Return to Function",
      "duration": "Evidence-based timeline",
      "instruction": "Advanced rehabilitation protocol, return-to-activity criteria, grip strength targets, functional outcome measures, and long-term bone health recommendations."
    }
  ]
}

CRITICAL CLINICAL RULES:
- ACCURACY FIRST: The confidence score must reflect your genuine diagnostic certainty. Poor image quality → lower confidence. Subtle or equivocal finding → lower confidence with uncertainty statement. Obvious displaced fracture → higher confidence.
- NO HALLUCINATION: If you cannot clearly identify a fracture, state "No definitive fracture line identified on this projection" and recommend correlation views.
- PROFESSIONAL TONE: Maintain the language and precision expected of a formal radiology report. If findings are ambiguous, clearly state the level of uncertainty to assist the primary care physician.
- IMAGE VALIDATION: If this is NOT a medical radiograph, set confidence to 0 and state "This does not appear to be a diagnostic radiographic image. Clinical correlation with appropriate imaging is recommended."
- SPECIFICITY: Every field must contain findings specific to THIS radiograph. Do NOT use generic template language.
- Return ONLY the JSON object. No markdown wrapping, no explanation outside the JSON structure.`;

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
                            maxOutputTokens: 8192,
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

                    if (!data.anatomy || !data.fracture_type || !data.diagnostic_impression) {
                        throw new Error("Incomplete clinical report received.");
                    }

                    console.log(`✅ Classification complete via ${modelName} | Confidence: ${data.confidence}%`);
                    console.log(`   Impression: ${data.diagnostic_impression}`);

                    // Save to Supabase Database
                    console.log('💾 Saving result to Supabase...');
                    const { error: dbError } = await supabase
                        .from('scans')
                        .insert([{
                            anatomy: data.anatomy,
                            fracture_type: data.fracture_type,
                            confidence: data.confidence,
                            severity: data.severity,
                            diagnostic_impression: data.diagnostic_impression,
                            treatment_plan: data.treatment_plan
                        }]);

                    if (dbError) {
                        console.error('⚠️ Failed to save to Supabase:', dbError.message);
                        // We still return the data to the user even if DB save fails
                    } else {
                        console.log('✅ Result successfully saved to Supabase database.');
                    }

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

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const previewArea = document.getElementById('preview-area');
const imagePreview = document.getElementById('image-preview');
const analyzeBtn = document.getElementById('analyze-btn');
const scanOverlay = document.getElementById('scan-overlay');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('scan-status');
const resultsSection = document.getElementById('results-section');

let currentFile = null;

// === DRAG & DROP ===
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'rgba(59,130,246,0.3)';
    dropZone.style.transform = 'scale(1.01)';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '';
    dropZone.style.transform = '';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    dropZone.style.transform = '';
    handleFile(e.dataTransfer.files[0]);
});

// === FILE INPUT ===
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
analyzeBtn.addEventListener('click', startAnalysis);

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    currentFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        uploadArea.classList.add('hidden');
        previewArea.classList.remove('hidden');
        resultsSection.classList.add('hidden', 'results-hidden');
        resultsSection.classList.remove('results-visible');
        setStatus('idle', 'Ready');
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    currentFile = null;
    fileInput.value = '';
    uploadArea.classList.remove('hidden');
    previewArea.classList.add('hidden');
    resultsSection.classList.add('hidden', 'results-hidden');
    resultsSection.classList.remove('results-visible');
}

function setStatus(type, text) {
    statusText.innerText = text;
    statusDot.className = 'w-2 h-2 rounded-full transition-colors';
    statusText.className = 'text-xs font-medium font-mono transition-colors';
    if (type === 'idle') {
        statusDot.classList.add('bg-slate-600');
        statusText.classList.add('text-slate-400');
    } else if (type === 'scanning') {
        statusDot.classList.add('bg-blue-400', 'animate-pulse');
        statusText.classList.add('text-blue-400');
    } else if (type === 'done') {
        statusDot.classList.add('bg-emerald-400');
        statusText.classList.add('text-emerald-400');
    } else if (type === 'error') {
        statusDot.classList.add('bg-red-400');
        statusText.classList.add('text-red-400');
    }
}

// === ANALYSIS ===
let retryTimer = null;

async function startAnalysis() {
    if (!currentFile) return;
    if (retryTimer) { clearInterval(retryTimer); retryTimer = null; }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<span class="animate-pulse tracking-wider">SCANNING...</span>`;
    scanOverlay.classList.remove('hidden');
    setStatus('scanning', 'Analyzing radiograph — this may take up to 60s...');

    const formData = new FormData();
    formData.append('image', currentFile);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            if (response.status === 429) {
                // Auto-retry with countdown
                const retryAfter = errBody.retryAfter || 60;
                startRetryCountdown(retryAfter);
                return;
            }
            throw new Error(errBody.details || errBody.error || `Error ${response.status}`);
        }

        const data = await response.json();
        renderResults(data);

    } catch (error) {
        console.error(error);
        setStatus('error', 'Analysis failed');
        resetButton();
        scanOverlay.classList.add('hidden');
        alert(error.message);
        return;
    }

    resetButton();
    scanOverlay.classList.add('hidden');
}

function startRetryCountdown(seconds) {
    scanOverlay.classList.add('hidden');
    let remaining = seconds;
    setStatus('scanning', `Rate limited. Auto-retrying in ${remaining}s...`);
    analyzeBtn.innerHTML = `<span class="text-xs">Retrying in ${remaining}s</span>`;

    retryTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(retryTimer);
            retryTimer = null;
            setStatus('scanning', 'Retrying analysis...');
            startAnalysis(); // Auto-retry
        } else {
            setStatus('scanning', `Rate limited. Auto-retrying in ${remaining}s...`);
            analyzeBtn.innerHTML = `<span class="text-xs">Retrying in ${remaining}s</span>`;
        }
    }, 1000);
}

function resetButton() {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><span>Analyze Fracture</span>`;
}

// === RENDER RESULTS ===
function renderResults(data) {
    setStatus('done', 'Analysis complete');

    document.getElementById('report-timestamp').innerText = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    // Metrics
    document.getElementById('res-anatomy').innerText = data.anatomy || '—';
    document.getElementById('res-weeks').innerText = data.healing_weeks || '—';
    document.getElementById('res-conf').innerText = data.confidence || '—';

    // Severity — use AI-provided severity
    const severityEl = document.getElementById('res-severity');
    const severity = data.severity || 'Unknown';
    severityEl.innerText = severity;
    const sevColors = {
        'Mild': 'text-emerald-400', 'Normal': 'text-emerald-400',
        'Moderate': 'text-amber-400',
        'Severe': 'text-red-400', 'Critical': 'text-red-500'
    };
    severityEl.className = `metric-value text-base ${sevColors[severity] || 'text-slate-300'}`;

    // Diagnosis
    document.getElementById('res-type').innerText = data.fracture_type || '—';
    document.getElementById('res-treatment').innerText = data.treatment_plan || '—';

    // Mechanism (new field)
    const mechanismEl = document.getElementById('res-mechanism');
    if (mechanismEl) mechanismEl.innerText = data.mechanism || '—';

    // Precautions (new field)
    const precautionsEl = document.getElementById('res-precautions');
    if (precautionsEl) precautionsEl.innerText = data.precautions || '—';

    // Medicines (now with dosages)
    const medsContainer = document.getElementById('res-meds');
    medsContainer.innerHTML = (data.medicines || []).map(m =>
        `<div class="flex items-start gap-2 p-2.5 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
            <svg class="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg>
            <span class="text-xs text-cyan-200 leading-relaxed">${m}</span>
        </div>`
    ).join('') || '<span class="text-slate-500 text-xs">None specified</span>';

    // Recovery Steps
    const colors = [
        { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', num_bg: 'bg-blue-500/20' },
        { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', num_bg: 'bg-cyan-500/20' },
        { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', num_bg: 'bg-violet-500/20' }
    ];

    const stepsContainer = document.getElementById('res-steps');
    stepsContainer.innerHTML = (data.recovery_steps || []).map((step, i) => {
        const c = colors[i] || colors[0];
        return `
        <div class="step-card">
            <div class="step-number ${c.num_bg} ${c.text}">${i + 1}</div>
            <h5 class="font-semibold text-white text-sm mb-1">${step.phase}</h5>
            <span class="inline-block text-[10px] px-2 py-0.5 rounded-md ${c.bg} ${c.text} ${c.border} border font-medium mb-3 uppercase tracking-wider">${step.duration}</span>
            <p class="text-xs text-slate-400 leading-relaxed">${step.instruction}</p>
        </div>`;
    }).join('');

    // Show results with animation
    resultsSection.classList.remove('hidden');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            resultsSection.classList.remove('results-hidden');
            resultsSection.classList.add('results-visible');
        });
    });

    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
}

// === DOWNLOAD REPORT ===
function downloadReport() {
    const anatomy = document.getElementById('res-anatomy').innerText;
    const type = document.getElementById('res-type').innerText;
    const weeks = document.getElementById('res-weeks').innerText;
    const conf = document.getElementById('res-conf').innerText;
    const severity = document.getElementById('res-severity').innerText;
    const mechanism = document.getElementById('res-mechanism')?.innerText || '';
    const treatment = document.getElementById('res-treatment').innerText;
    const precautions = document.getElementById('res-precautions')?.innerText || '';
    const timestamp = document.getElementById('report-timestamp').innerText;

    // Get medicine text
    const medsEl = document.getElementById('res-meds');
    const meds = Array.from(medsEl.querySelectorAll('span')).map(el => el.innerText).join('\n    ') || 'None';

    const stepsEl = document.getElementById('res-steps');
    const steps = Array.from(stepsEl.querySelectorAll('.step-card')).map((el, i) => {
        const phase = el.querySelector('h5')?.innerText || '';
        const duration = el.querySelector('span')?.innerText || '';
        const instruction = el.querySelector('p')?.innerText || '';
        return `  Phase ${i + 1}: ${phase} (${duration})\n  → ${instruction}`;
    }).join('\n\n');

    const report = `
══════════════════════════════════════════
  RAYVIVE — FRACTURE ANALYSIS REPORT
══════════════════════════════════════════
  Date: ${timestamp}

  AFFECTED REGION
    ${anatomy}

  DIAGNOSIS
    ${type}

  SEVERITY: ${severity}
  CONFIDENCE: ${conf}%
  ESTIMATED HEALING: ${weeks} weeks
  LIKELY MECHANISM: ${mechanism}

  TREATMENT PROTOCOL
    ${treatment}

  PRESCRIBED MEDICINES
    ${meds}

  ⚠ PRECAUTIONS
    ${precautions}

  RECOVERY ROADMAP
${steps}

══════════════════════════════════════════
  ⚠ DISCLAIMER
  This report is generated by an automated
  screening system and is NOT a medical
  diagnosis. Always consult a licensed
  medical professional for verification
  and treatment decisions.
══════════════════════════════════════════
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RayVive_Report_${(anatomy || 'scan').replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

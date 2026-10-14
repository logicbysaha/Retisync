const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const screeningRoutes = require('./routes/screenings');
const visitRoutes = require('./routes/visits');
const campRoutes = require('./routes/camps');
const ashaRoutes = require('./routes/asha');
const syncRoutes = require('./routes/sync');
const telehealthRoutes = require('./routes/telehealth');
const ultralyticsRoutes = require('./routes/ultralytics');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(ROOT_DIR, 'uploads')));
app.use('/screens', express.static(path.join(ROOT_DIR, 'screens')));
app.use(express.static(ROOT_DIR));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/screenings', screeningRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/asha', ashaRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/telehealth', telehealthRoutes);
app.use('/api/ultralytics', ultralyticsRoutes);

// Developer Dashboard
app.get('/dev-dashboard', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'dev-dashboard.html'));
});

// Retina Scan & AI Triage Portal (Clinical Fundus Inspection)
app.get('/retina-scan', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'retina-scan.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RetiSync Drishti Care API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: 'connected',
      patientsCount: db.get('patients').length,
      screeningsCount: db.get('screenings').length,
      visitsCount: db.get('visits').length,
      campsCount: db.get('camps').length
    }
  });
});

// Interactive API Documentation and Live Test Console
app.get('/api-docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>RetiSync Backend | API Explorer & Live Docs</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Inter', sans-serif; }
    pre, code { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-slate-800 gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold mb-2 border border-blue-500/30">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          REST API v1.0 • ONLINE
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-white">RetiSync Backend Console</h1>
        <p class="text-slate-400 text-sm mt-1">Diabetic Retinopathy & Glycemic Triage Service Engine</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="/login.html" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30">
          Open Login Portal &rarr;
        </a>
        <a href="/patient-home.html" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all">
          Patient Home
        </a>
        <a href="/asha-home.html" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all">
          ASHA Field Home
        </a>
      </div>
    </header>

    <!-- Quick Stats Summary -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Patients Registered</div>
        <div class="text-2xl font-bold text-white mt-1" id="statPatients">5</div>
      </div>
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">AI Screenings Run</div>
        <div class="text-2xl font-bold text-emerald-400 mt-1" id="statScreenings">1</div>
      </div>
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Visits Queued</div>
        <div class="text-2xl font-bold text-blue-400 mt-1" id="statVisits">1</div>
      </div>
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">AI Engine Status</div>
        <div class="text-2xl font-bold text-purple-400 mt-1">ICDR Ready</div>
      </div>
    </div>

    <!-- API Route Test Explorer -->
    <div class="space-y-6">
      <h2 class="text-xl font-bold text-white">Live Endpoint Explorer</h2>

      <!-- Card: Auth Endpoints -->
      <div class="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-700/50 pb-3">
          <div class="font-bold text-blue-400 text-lg flex items-center gap-2">
            <span>Authentication & Identity</span>
          </div>
          <span class="text-xs text-slate-400">/api/auth/*</span>
        </div>
        <div class="grid md:grid-cols-3 gap-3">
          <button onclick="testApi('/api/auth/otp/send', 'POST', { phone: '+91 98765 43210' })" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">POST</span><span class="font-bold text-xs text-slate-200">/api/auth/otp/send</span></div>
            <p class="text-[11px] text-slate-400 mt-1">Send 4-digit OTP to patient phone</p>
          </button>
          <button onclick="testApi('/api/auth/otp/verify', 'POST', { phone: '+91 98765 43210', otp: '7284', name: 'Rajesh Sharma' })" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">POST</span><span class="font-bold text-xs text-slate-200">/api/auth/otp/verify</span></div>
            <p class="text-[11px] text-slate-400 mt-1">Verify OTP & return patient session</p>
          </button>
          <button onclick="testApi('/api/auth/login/asha', 'POST', { ashaId: 'WB-ASHA-884210', passcode: 'Kolkata@2025#' })" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">POST</span><span class="font-bold text-xs text-slate-200">/api/auth/login/asha</span></div>
            <p class="text-[11px] text-slate-400 mt-1">Login ASHA worker (Sandhya Didi)</p>
          </button>
        </div>
      </div>

      <!-- Card: Patients & Clinical Vitals -->
      <div class="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-700/50 pb-3">
          <div class="font-bold text-emerald-400 text-lg flex items-center gap-2">
            <span>Patients & Glycemic Health Vault</span>
          </div>
          <span class="text-xs text-slate-400">/api/patients/*</span>
        </div>
        <div class="grid md:grid-cols-4 gap-3">
          <button onclick="testApi('/api/patients', 'GET')" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">GET</span><span class="font-bold text-xs text-slate-200">/api/patients</span></div>
            <p class="text-[11px] text-slate-400 mt-1">List all registered villagers</p>
          </button>
          <button onclick="testApi('/api/patients/pat-001', 'GET')" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">GET</span><span class="font-bold text-xs text-slate-200">/pat-001</span></div>
            <p class="text-[11px] text-slate-400 mt-1">Rajesh Sharma full profile</p>
          </button>
          <button onclick="testApi('/api/patients/pat-001/glucose', 'POST', { value: 245, timing: 'Post-Meal' })" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">POST</span><span class="font-bold text-xs text-slate-200">/pat-001/glucose</span></div>
            <p class="text-[11px] text-slate-400 mt-1">Log 245 mg/dL & recalculate risk</p>
          </button>
          <button onclick="testApi('/api/patients/pat-001/risk', 'GET')" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">GET</span><span class="font-bold text-xs text-slate-200">/pat-001/risk</span></div>
            <p class="text-[11px] text-slate-400 mt-1">Real-time Retinopathy Risk Score</p>
          </button>
        </div>
      </div>

      <!-- Card: AI Screenings & Triage -->
      <div class="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-700/50 pb-3">
          <div class="font-bold text-purple-400 text-lg flex items-center gap-2">
            <span>AI Retinal Screening Engine & Field Operations</span>
          </div>
          <span class="text-xs text-slate-400">/api/screenings & /api/asha</span>
        </div>
        <div class="grid md:grid-cols-4 gap-3">
          <button onclick="testApi('/api/asha/dashboard', 'GET')" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">GET</span><span class="font-bold text-xs text-slate-200">/api/asha/dashboard</span></div>
            <p class="text-[11px] text-slate-400 mt-1">ASHA shift stats & progress</p>
          </button>
          <button onclick="testApi('/api/asha/queue', 'GET')" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">GET</span><span class="font-bold text-xs text-slate-200">/api/asha/queue</span></div>
            <p class="text-[11px] text-slate-400 mt-1">Live triage priority list</p>
          </button>
          <button onclick="testApi('/api/screenings', 'POST', { patientName: 'Rabin Das (54M)', glucose: 168, eyeScanned: 'Both Eyes (OD & OS)' })" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">POST</span><span class="font-bold text-xs text-slate-200">/api/screenings</span></div>
            <p class="text-[11px] text-slate-400 mt-1">Run AI Retinal Triage Model</p>
          </button>
          <button onclick="testApi('/api/sync', 'POST', { offlineRecords: [] })" class="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-all">
            <div class="flex items-center gap-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">POST</span><span class="font-bold text-xs text-slate-200">/api/sync</span></div>
            <p class="text-[11px] text-slate-400 mt-1">Offline vault 2-way sync</p>
          </button>
        </div>
      </div>

      <!-- Live JSON Response Console -->
      <div class="bg-slate-950 border border-slate-800 rounded-2xl p-5">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
            <span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
            <span class="text-xs font-mono text-slate-400 ml-2" id="consoleTitle">Live Response Console</span>
          </div>
          <span class="text-[11px] font-mono text-slate-500" id="responseStatus">Status: Ready</span>
        </div>
        <pre id="jsonOutput" class="text-emerald-400 text-xs overflow-x-auto max-h-80 p-2 bg-black/40 rounded-lg font-mono">// Click any endpoint button above to test live backend API execution</pre>
      </div>
    </div>
  </div>

  <script>
    async function testApi(url, method = 'GET', body = null) {
      const output = document.getElementById('jsonOutput');
      const title = document.getElementById('consoleTitle');
      const status = document.getElementById('responseStatus');

      title.textContent = method + ' ' + url;
      status.textContent = 'Executing...';
      output.textContent = 'Loading response from ' + url + '...';

      try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(url, opts);
        const data = await res.json();
        status.textContent = 'HTTP ' + res.status + ' ' + (res.ok ? 'OK' : 'Error');
        output.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        status.textContent = 'Failed';
        output.textContent = 'Error: ' + err.message;
      }
    }

    // Load initial health stats
    fetch('/api/health')
      .then(r => r.json())
      .then(d => {
        if (d.database) {
          document.getElementById('statPatients').textContent = d.database.patientsCount;
          document.getElementById('statScreenings').textContent = d.database.screeningsCount;
          document.getElementById('statVisits').textContent = d.database.visitsCount;
        }
      })
      .catch(() => {});
  </script>
</body>
</html>`);
});

// Clean URL Rewrites
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'login.html'));
});

app.get('/patient', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'patient-home.html'));
});

app.get('/patient-home', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'patient-home.html'));
});

app.get('/asha', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'asha-home.html'));
});

app.get('/asha-home', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'asha-home.html'));
});

app.get('/eye-sugar-check', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'eye-sugar-check.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred',
    error: err.message
  });
});

// 404 handler for unmatched API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' not found.`
    });
  }
  next();
});

// Fallback for static HTML/SPA files
app.use((req, res) => {
  const filePath = path.join(ROOT_DIR, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(ROOT_DIR, 'login.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏥 RetiSync Backend Server Online on http://localhost:${PORT}`);
  console.log(`📖 API Explorer & Live Docs: http://localhost:${PORT}/api-docs`);
  console.log(`🔐 Login Portal: http://localhost:${PORT}/login.html`);
  console.log(`🩺 Patient Portal: http://localhost:${PORT}/patient-home.html`);
  console.log(`📋 ASHA Worker Portal: http://localhost:${PORT}/asha-home.html`);
  console.log(`⚙️  Developer Dashboard: http://localhost:${PORT}/dev-dashboard`);
  console.log(`=======================================================`);
});

module.exports = app;

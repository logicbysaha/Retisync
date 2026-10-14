const http = require('http');
const app = require('../server/server');

// Helper to make local HTTP requests to the running app
function request(server, path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: address.port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting RetiSync Comprehensive Backend Test Suite...\n');

  // Start test server on random port
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`📡 Test server running on http://127.0.0.1:${port}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('[1/8] Testing System Health Check...');
    const health = await request(server, '/api/health');
    assert(health.status === 200, 'Health endpoint responds with 200');
    assert(health.body.status === 'healthy', 'Health status is healthy');
    assert(health.body.database.patientsCount >= 4, 'Seed database contains patients');

    // 2. Auth endpoints
    console.log('\n[2/8] Testing Authentication Workflows...');
    const otpSend = await request(server, '/api/auth/otp/send', 'POST', { phone: '+91 98765 43210' });
    assert(otpSend.status === 200, 'OTP send successful');

    const otpVerify = await request(server, '/api/auth/otp/verify', 'POST', {
      phone: '+91 98765 43210',
      otp: '7284',
      name: 'Rajesh Sharma'
    });
    assert(otpVerify.status === 200, 'Patient OTP verification successful');
    assert(otpVerify.body.user.role === 'patient', 'Patient role verified');
    assert(otpVerify.body.user.name === 'Rajesh Sharma', 'Patient name matches');

    const ashaLogin = await request(server, '/api/auth/login/asha', 'POST', {
      ashaId: 'WB-ASHA-884210',
      passcode: 'Kolkata@2025#'
    });
    assert(ashaLogin.status === 200, 'ASHA worker login successful');
    assert(ashaLogin.body.user.role === 'asha', 'ASHA role verified');
    assert(ashaLogin.body.user.name.includes('Sandhya'), 'ASHA worker name matches');

    // 3. Patients & Glucose Logs
    console.log('\n[3/8] Testing Patients & Glucose Triage...');
    const patients = await request(server, '/api/patients');
    assert(patients.status === 200 && patients.body.count >= 4, 'List patients returns registered villagers');

    const singlePatient = await request(server, '/api/patients/pat-001');
    assert(singlePatient.status === 200, 'Get patient by ID successful');
    assert(singlePatient.body.patient.name === 'Rajesh Sharma', 'Fetched Rajesh Sharma');

    const logGlucose = await request(server, '/api/patients/pat-001/glucose', 'POST', {
      value: 245,
      timing: 'Post-Meal'
    });
    assert(logGlucose.status === 200, 'Log glucose successful');
    assert(logGlucose.body.riskAssessment.riskScore >= 70, 'Calculates elevated retinopathy risk for glucose 245');
    assert(logGlucose.body.riskAssessment.riskLevel.includes('Urgent'), 'Action advised includes urgent check');

    // 4. Vitals & Real-Time Risk
    console.log('\n[4/8] Testing Vitals & Real-Time Risk Evaluation...');
    const recordVitals = await request(server, '/api/patients/pat-001/vitals', 'POST', {
      systolic: 145,
      diastolic: 92,
      pulse: 78
    });
    assert(recordVitals.status === 200, 'Vitals recorded successfully');

    const riskCheck = await request(server, '/api/patients/pat-001/risk');
    assert(riskCheck.status === 200, 'Real-time risk API responds');
    assert(typeof riskCheck.body.riskAssessment.riskScore === 'number', 'Risk score is numeric');

    // 5. AI Retinal Screening & Glycemic Triage
    console.log('\n[5/8] Testing AI Retinal Screening Engine...');
    const screening = await request(server, '/api/screenings', 'POST', {
      patientName: 'Rabin Das (54M)',
      glucose: 168,
      eyeScanned: 'Both Eyes (OD & OS)',
      systolic: 142,
      diastolic: 90
    });
    assert(screening.status === 201, 'Retinal scan processed successfully');
    assert(screening.body.aiInference.confidence > 85, 'AI confidence exceeds 85%');
    assert(screening.body.aiInference.lesionsFound.length > 0, 'AI identifies retinal biomarkers');
    assert(screening.body.aiInference.clinicalRecommendation.length > 0, 'Clinical recommendation provided');

    // 6. Home Visits & Eye Camp Booking
    console.log('\n[6/8] Testing Home Visits & Eye Camp Booking...');
    const visitReq = await request(server, '/api/visits/request', 'POST', {
      patientId: 'pat-001',
      patientName: 'Rajesh Sharma',
      reason: 'Urgent glycemic spike follow-up'
    });
    assert(visitReq.status === 200 || visitReq.status === 201, 'Home visit request handled');

    const camps = await request(server, '/api/camps');
    assert(camps.status === 200 && camps.body.camps.length > 0, 'Camps list available');

    const bookCamp = await request(server, `/api/camps/${camps.body.camps[0].id}/book`, 'POST', {
      patientId: 'pat-002',
      patientName: 'Rabin Das'
    });
    assert(bookCamp.status === 200 || bookCamp.status === 201, 'Camp slot booked with token');
    assert(bookCamp.body.booking.tokenNumber.startsWith('T-'), 'Token format valid (e.g. T-019)');

    // 7. ASHA Dashboard & Triage Queue
    console.log('\n[7/8] Testing ASHA Field Dashboard & Triage Queue...');
    const ashaDash = await request(server, '/api/asha/dashboard');
    assert(ashaDash.status === 200, 'ASHA dashboard data retrieved');
    assert(typeof ashaDash.body.stats.progressPercentage === 'number', 'Progress percentage computed');

    const ashaQueue = await request(server, '/api/asha/queue');
    assert(ashaQueue.status === 200, 'ASHA queue retrieved');
    assert(ashaQueue.body.queue.length > 0, 'Queue populated with sorted priority patients');
    assert(ashaQueue.body.queue[0].priorityBadge === 'Priority 1', 'Priority 1 cases appear at top of queue');

    // 8. Offline Sync Engine
    console.log('\n[8/8] Testing Offline-First Sync Engine...');
    const syncRes = await request(server, '/api/sync', 'POST', {
      deviceId: 'MotoG54-Field-Tab',
      offlineRecords: [
        {
          type: 'glucose',
          patientId: 'pat-003',
          value: 178,
          timing: 'Post-Meal',
          loggedBy: 'Sandhya Rani Mondal (Offline Field Sync)'
        }
      ]
    });
    assert(syncRes.status === 200, 'Offline sync reconciles without errors');
    assert(syncRes.body.syncedRecordsCount >= 1, 'Offline record reconciled');

    console.log(`\n========================================`);
    console.log(`🏁 Test Results: ${passed} passed, ${failed} failed.`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Fatal error during test run:', err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

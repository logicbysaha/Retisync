# RetiSync - Drishti Care Backend Server

> AI-Assisted Diabetic Retinopathy & Glycemic Triage Platform for Village Patients and ASHA Health Workers (NRHM / ABDM Compliant).

## Overview
RetiSync provides a full-featured clinical backend with:
- **Dual Authentication**: Patient (SMS/OTP + mPIN + ABHA ID generation) & Accredited ASHA Worker (Govt ID + Passcode).
- **AI Retinal & Glycemic Triage Engine**: Grounded in the International Clinical Diabetic Retinopathy (ICDR) scale for automated NPDR/PDR stage grading and multi-factor risk inference.
- **Health Vault**: Longitudinal blood glucose tracking, vitals history, and dynamic retinopathy risk calculations.
- **Field Worker Queue**: Priority-based triage list (`Priority 1`, `Priority 2`, `Booked`, `Routine`).
- **Care Coordination**: Home visit requests, village eye camp slot reservations with instant token generation.
- **Offline-First Synchronization**: 2-way sync engine (`/api/sync`) for low-connectivity rural health posts.
- **Teleconsultation Escalation**: Auto-escalation of Stage 2+ DR cases to on-duty Primary Health Center (PHC) medical officers.
- **Interactive API Explorer**: Live Swagger-style interactive test console at `/api-docs`.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Backend Server
```bash
npm start
# or
npm run dev
```
The server will boot on `http://localhost:3000`.

### 3. Run Automated Tests
```bash
npm run test:api
```

---

## API Endpoints Reference

### Health & Status
- `GET /api/health` - System health, database connection, and record counts
- `GET /api-docs` - Live interactive test console and documentation

### Authentication (`/api/auth`)
- `POST /api/auth/otp/send` - Send 4-digit OTP to patient's mobile
- `POST /api/auth/otp/verify` - Verify OTP, register/fetch patient, issue session token
- `POST /api/auth/login/asha` - Authenticate ASHA field worker with Govt ID & Passcode
- `GET /api/auth/me` - Current session details

### Patients & Health Vault (`/api/patients`)
- `GET /api/patients` - List all registered patients (supports `search`, `priority`, `ward`)
- `GET /api/patients/:id` - Detailed patient profile, glucose history, vitals, active visits
- `POST /api/patients` - Register new villager into ABHA health registry
- `PUT /api/patients/:id` - Update patient demographics
- `POST /api/patients/:id/glucose` - Log blood glucose reading (recalibrates Retinopathy Risk Score %)
- `POST /api/patients/:id/vitals` - Record blood pressure, pulse, and BMI
- `GET /api/patients/:id/risk` - Calculate real-time Diabetic Retinopathy Risk (%)

### AI Retinal Screening (`/api/screenings`)
- `GET /api/screenings` - List screening history
- `GET /api/screenings/:id` - Single screening report
- `POST /api/screenings` - Execute AI Retinal Scan & Glycemic Triage (multipart image or simulation)

### ASHA Field Operations (`/api/asha`)
- `GET /api/asha/dashboard` - Today's schedule progress (screened vs pending, urgency counter)
- `GET /api/asha/queue` - Sorted triage list by clinical urgency

### Care Coordination
- `POST /api/visits/request` - Patient requests home visit from assigned ASHA Didi
- `GET /api/visits` - List visit requests
- `PATCH /api/visits/:id` - Update visit status
- `GET /api/camps` - List upcoming village eye screening camps
- `POST /api/camps/:id/book` - Reserve free eye camp slot with token number (e.g. `T-019`)

### Offline Sync (`/api/sync`)
- `GET /api/sync/status` - Sync status and server snapshot timestamp
- `POST /api/sync` - 2-way offline record reconciliation with central ABHA vault

### Telehealth (`/api/telehealth`)
- `GET /api/telehealth/doctors` - On-duty PHC Medical Officers directory
- `POST /api/telehealth/referrals` - Teleconsultation escalation for critical scans

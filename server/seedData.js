// RetiSync Seed Data: Realistic Rural Indian Health Mission Context
module.exports = {
  patients: [
    {
      id: "pat-001",
      name: "Rajesh Sharma",
      age: 54,
      gender: "M",
      phone: "+91 98765 43210",
      height: "168 cm",
      weight: "62 kg",
      village: "Bishnupur Village",
      ward: "Ward 1 • Main Para",
      abhaId: "91-4820-1928",
      subCenter: "Bishnupur Sub-Center 4",
      assignedAshaId: "asha-001",
      mpin: "4921",
      currentRiskScore: 78,
      riskLevel: "Elevated",
      actionAdvised: "Urgent Eye Check & Retinal Scan",
      glucoseHistory: [
        {
          id: "glu-001",
          value: 245,
          timing: "Post-Meal",
          timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          category: "High",
          loggedBy: "Patient"
        },
        {
          id: "glu-002",
          value: 158,
          timing: "Fasting",
          timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          category: "Elevated",
          loggedBy: "Patient"
        },
        {
          id: "glu-003",
          value: 210,
          timing: "Post-Meal",
          timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          category: "High",
          loggedBy: "Patient"
        }
      ],
      vitalsHistory: [
        {
          id: "vit-001",
          systolic: 138,
          diastolic: 88,
          pulse: 76,
          weightKg: 62,
          timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
          recordedBy: "Sandhya Rani Mondal (ASHA)"
        }
      ]
    },
    {
      id: "pat-002",
      name: "Rabin Das",
      age: 54,
      gender: "M",
      phone: "+91 98765 43211",
      height: "165 cm",
      weight: "68 kg",
      village: "Bishnupur Village",
      ward: "Ward 4 • North Para",
      abhaId: "91-3829-5541",
      subCenter: "Bishnupur Sub-Center 4",
      assignedAshaId: "asha-001",
      mpin: "1234",
      currentRiskScore: 78,
      riskLevel: "High Eye Risk (78%)",
      priority: "Priority 1",
      glucoseHistory: [
        {
          id: "glu-004",
          value: 168,
          timing: "Fasting",
          timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          category: "High",
          loggedBy: "Sandhya Rani Mondal (ASHA)"
        }
      ],
      vitalsHistory: [
        {
          id: "vit-002",
          systolic: 142,
          diastolic: 90,
          pulse: 82,
          weightKg: 68,
          timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          recordedBy: "Sandhya Rani Mondal (ASHA)"
        }
      ]
    },
    {
      id: "pat-003",
      name: "Parvati Soren",
      age: 58,
      gender: "F",
      phone: "+91 98765 43212",
      height: "152 cm",
      weight: "55 kg",
      village: "Bishnupur Village",
      ward: "Ward 2 • Dheko Road",
      abhaId: "91-2940-8812",
      subCenter: "Bishnupur Sub-Center 4",
      assignedAshaId: "asha-001",
      mpin: "5678",
      currentRiskScore: 65,
      riskLevel: "BP + Sugar Spike",
      priority: "Priority 2",
      glucoseHistory: [
        {
          id: "glu-005",
          value: 174,
          timing: "Fasting",
          timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          category: "High",
          loggedBy: "Sandhya Rani Mondal (ASHA)"
        }
      ],
      vitalsHistory: [
        {
          id: "vit-003",
          systolic: 154,
          diastolic: 96,
          pulse: 84,
          weightKg: 55,
          timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          recordedBy: "Sandhya Rani Mondal (ASHA)"
        }
      ]
    },
    {
      id: "pat-004",
      name: "Meera Mondal",
      age: 49,
      gender: "F",
      phone: "+91 98765 43213",
      height: "156 cm",
      weight: "58 kg",
      village: "Bishnupur Village",
      ward: "Ward 3 • South Para",
      abhaId: "91-8841-7729",
      subCenter: "Bishnupur Sub-Center 4",
      assignedAshaId: "asha-001",
      mpin: "9012",
      currentRiskScore: 28,
      riskLevel: "Low Risk",
      priority: "Routine",
      glucoseHistory: [
        {
          id: "glu-006",
          value: 132,
          timing: "Post-Meal",
          timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
          category: "Normal",
          loggedBy: "Sandhya Rani Mondal (ASHA)"
        }
      ],
      vitalsHistory: []
    }
  ],

  ashaWorkers: [
    {
      id: "asha-001",
      name: "Sandhya Rani Mondal",
      govtId: "WB-ASHA-884210",
      passcode: "Kolkata@2025#",
      phone: "+91 98765 00001",
      subCenter: "Bishnupur Sub-Center 4, South 24 Parganas",
      subCenterShort: "Sub-Center Kotda",
      totalAssignedVillagers: 24,
      screenedToday: 14,
      pendingToday: 10,
      avatar: "sandhya_avatar.jpg",
      status: "Online & Geofenced"
    }
  ],

  camps: [
    {
      id: "camp-001",
      title: "Village Eye & Glycemic Health Camp",
      location: "Bishnupur Sub-Center 4",
      scheduleDate: "Thursday, 10:00 AM - 4:00 PM",
      doctorName: "Dr. S. Roy (PHC Medical Officer)",
      services: [
        "Free AI Digital Retinal Screening",
        "Instant Blood Glucose & HbA1c Check",
        "Free Prescription Eyeglasses",
        "Specialist Doctor Consultation"
      ],
      totalSlots: 50,
      bookedSlots: 18,
      status: "Upcoming"
    }
  ],

  campBookings: [
    {
      id: "cb-001",
      campId: "camp-001",
      patientId: "pat-001",
      patientName: "Rajesh Sharma",
      tokenNumber: "T-019",
      bookedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      status: "Confirmed"
    }
  ],

  visits: [
    {
      id: "vis-001",
      patientId: "pat-001",
      patientName: "Rajesh Sharma",
      phone: "+91 98765 43210",
      village: "Bishnupur Village",
      ward: "Ward 1 • Main Para",
      reason: "High Blood Sugar (245 mg/dL) & Urgent Retinal Scan Request",
      requestedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      status: "Booked",
      priority: "Urgent",
      assignedAshaId: "asha-001",
      notes: "Patient experienced slight blurry vision after morning meal"
    }
  ],

  screenings: [
    {
      id: "scr-001",
      patientId: "pat-002",
      patientName: "Rabin Das",
      eyeScanned: "Both Eyes (OD & OS)",
      glucoseReading: 168,
      drStage: "Stage 2: Moderate NPDR",
      drStageCode: 2,
      confidence: 93.4,
      retinopathyRiskScore: 78,
      lesionsFound: [
        "Microaneurysms detected in nasal quadrant",
        "Blot hemorrhages observed near macula",
        "Mild hard exudate ring"
      ],
      macularEdemaRisk: "Moderate",
      clinicalRecommendation: "Refer to BPHC Ophthalmology within 7 days for dilated fundus examination and OCT scan.",
      urgency: "High",
      scannedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      scannedBy: "Sandhya Rani Mondal (ASHA)",
      imageUrl: null
    }
  ],

  doctors: [
    {
      id: "doc-001",
      name: "Dr. S. Roy",
      role: "PHC Medical Officer",
      department: "Ophthalmology & General Medicine",
      center: "Bishnupur Primary Health Center (BPHC)",
      phone: "+91 33 2456 7890",
      emergencyHelpline: "1800-11-4477",
      availability: "On-duty at Bishnupur PHC Emergency Desk",
      status: "Available"
    }
  ],

  teleconsultations: []
};

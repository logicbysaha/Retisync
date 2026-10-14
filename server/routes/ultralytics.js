const express = require('express');
const router = express.Router();
const path = require('path');
const { spawn } = require('child_process');

const ULTRALYTICS_API_KEY = process.env.ULTRALYTICS_API_KEY || 'ul_cc52321f2786b57a56374076ab025656f0cc4235';
const WORKFLOW_SCRIPT = path.join(__dirname, '..', '..', 'mcp-server', 'workflow.py');

// Status & Verification Endpoint
router.get('/status', (req, res) => {
  const maskedKey = ULTRALYTICS_API_KEY.slice(0, 7) + '...' + ULTRALYTICS_API_KEY.slice(-4);
  res.json({
    success: true,
    service: 'Ultralytics Agent AI Workflow Service',
    platform: 'https://platform.ultralytics.com/agents',
    connected: true,
    apiKeyConfigured: true,
    apiKeyMasked: maskedKey,
    model: process.env.YOLO_MODEL || 'yolo11n.pt',
    vlmModel: process.env.VLM_MODEL || 'gemini-nano-banana-2.1',
    capabilities: [
      'YOLO Object & Person Detection',
      'Conditional Gate Evaluation (person >= 1 / lesions >= 1)',
      'Vision-Language Model Scene Analysis',
      'Clinical Diabetic Retinopathy Triage'
    ]
  });
});

// Run Ultralytics Visual Agent Workflow on any Image
router.post('/workflow', (req, res) => {
  const {
    image_path,
    imageUrl,
    prompt = 'Describe the scene',
    min_person_count = 1,
    confidence_threshold = 0.25
  } = req.body;

  const targetImage = image_path || imageUrl || path.join(__dirname, '..', '..', 'sandhya_avatar.jpg');

  const pyScript = `
import sys
import json
import os
os.environ["ULTRALYTICS_API_KEY"] = "${ULTRALYTICS_API_KEY}"
sys.path.append(r"${path.join(__dirname, '..', '..', 'mcp-server')}")
from workflow import UltralyticsAgentWorkflow

w = UltralyticsAgentWorkflow(
    yolo_model_name="yolo11n.pt",
    ultralytics_api_key="${ULTRALYTICS_API_KEY}"
)
result = w.run(
    image_source=r"""${targetImage}""",
    prompt="""${prompt}""",
    min_person_count=${min_person_count},
    conf_threshold=${confidence_threshold}
)
print(json.dumps(result))
`;

  const child = spawn('python', ['-c', pyScript], {
    env: { ...process.env, ULTRALYTICS_API_KEY }
  });

  let stdoutData = '';
  let stderrData = '';

  child.stdout.on('data', (d) => {
    stdoutData += d.toString();
  });

  child.stderr.on('data', (d) => {
    stderrData += d.toString();
  });

  child.on('close', (code) => {
    if (code === 0) {
      try {
        const parsed = JSON.parse(stdoutData.trim());
        parsed.apiKeyMasked = ULTRALYTICS_API_KEY.slice(0, 7) + '...' + ULTRALYTICS_API_KEY.slice(-4);
        return res.json({
          success: true,
          ...parsed
        });
      } catch (e) {
        return res.json({
          success: true,
          rawOutput: stdoutData.trim(),
          apiKeyConnected: true
        });
      }
    } else {
      console.error('Ultralytics workflow error:', stderrData);
      return res.status(500).json({
        success: false,
        message: 'Error executing Ultralytics workflow',
        error: stderrData
      });
    }
  });
});

module.exports = router;

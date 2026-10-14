# Ultralytics Agents Workflow MCP Server

Replication of the visual pipeline from **[Ultralytics Agents](https://platform.ultralytics.com/agents)** packaged as a standard **Model Context Protocol (MCP)** server for Antigravity IDE, Gemini CLI, Cursor, and Claude.

---

## 🔄 Visual Workflow Architecture

```
[ 🖼️ 1. Input Image ]
       │
       ▼
[ 🔍 2. Detect People ]  ──> yolo26n · Detect (Ultralytics YOLO)
       │
       ▼
[ ⚖️ 3. Condition Gate ] ──> "When a person appears" (person >= 1)
       │
   ┌───┴────────────────┐
   │ Condition Met      │ Condition Failed
   ▼                    ▼
[ 🧠 4. Describe Scene ] [ ⏭️ Skip VLM ]
(gemini-nano-banana-2.1) (Save compute & tokens)
   │                    │
   └───┬────────────────┘
       │
       ▼
[ 📊 5. Output ]         ──> Structured JSON + Clinical / Scene Synthesis
```

---

## 🛠️ Exposed MCP Tools

| Tool Name | Parameters | Description |
|---|---|---|
| `run_ultralytics_workflow` | `image_path` (required)<br>`prompt` (default: "Describe the scene")<br>`min_person_count` (default: 1)<br>`confidence_threshold` (default: 0.25) | Runs the exact 5-step Ultralytics agent workflow on any image path, URL, or base64 data URI. |
| `retinal_screening_workflow` | `image_path` (required)<br>`patient_name` (optional)<br>`fasting_sugar` (optional) | RetiSync domain-specific workflow: detects landmarks (optic disc, macula) and DR lesions, applies gate condition, and outputs ICDR staging + ASHA referral instructions. |
| `inspect_workflow_graph` | None | Returns the full visual node graph matching the `platform.ultralytics.com/agents` template. |

---

## 🚀 Registered Configuration

This MCP server is registered in `c:\Users\baita\.gemini\config\mcp_config.json`:

```json
{
  "mcpServers": {
    "ultralytics-agents-workflow": {
      "command": "python",
      "args": [
        "c:\\Users\\baita\\OneDrive\\Documents\\Retisync\\mcp-server\\server.py"
      ],
      "env": {}
    }
  }
}
```

---

## 🧪 Self-Test Verification

Run the test suite to verify end-to-end stdio tool execution:

```powershell
python c:\Users\baita\OneDrive\Documents\Retisync\mcp-server\test_client.py
```

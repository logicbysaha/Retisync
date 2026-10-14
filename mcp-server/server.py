"""
Model Context Protocol (MCP) Server for Ultralytics Agents Workflow
Standard stdio JSON-RPC 2.0 implementation compatible with Antigravity IDE, Gemini CLI, Claude, and Cursor.
Workflow: [Input image] -> [Detect people (yolo26n)] -> [Condition: person >= 1] -> [Describe the scene (gemini-nano)] -> [Output]
"""

import sys
import os
import json
import logging
import traceback

# Configure logging to stderr so stdout is purely reserved for JSON-RPC messages
logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("ultralytics_mcp")

# Add current directory to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from workflow import UltralyticsAgentWorkflow
from retinal_workflow import RetisyncRetinalWorkflow

# Initialize workflow runners
ultralytics_runner = UltralyticsAgentWorkflow()
retinal_runner = RetisyncRetinalWorkflow()

TOOLS_DEFINITIONS = [
    {
        "name": "run_ultralytics_workflow",
        "description": "Executes the 5-step Ultralytics Agents visual workflow: Input Image -> YOLO Object Detection (Detect people) -> Condition Check (person >= 1) -> Vision-Language Model Scene Description (gemini-nano) -> Output Result. Corresponds to https://platform.ultralytics.com/agents visual builder.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "image_path": {
                    "type": "string",
                    "description": "Local file path, URL, or base64 data URI of the image to analyze."
                },
                "prompt": {
                    "type": "string",
                    "description": "Text prompt for the vision-language model (default: 'Describe the scene').",
                    "default": "Describe the scene"
                },
                "min_person_count": {
                    "type": "integer",
                    "description": "Threshold for the condition gate 'When a person appears' (default: 1).",
                    "default": 1
                },
                "confidence_threshold": {
                    "type": "number",
                    "description": "YOLO detection confidence threshold from 0.0 to 1.0 (default: 0.25).",
                    "default": 0.25
                }
            },
            "required": ["image_path"]
        }
    },
    {
        "name": "retinal_screening_workflow",
        "description": "Executes the RetiSync Diabetic Retinopathy screening AI pipeline: analyzes fundus photographs, identifies retinal landmarks (optic disc, macula), detects microaneurysms and hemorrhages, evaluates clinical condition gate, and synthesizes ICDR grading and ASHA triage instructions.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "image_path": {
                    "type": "string",
                    "description": "Absolute path to the retinal fundus image."
                },
                "patient_name": {
                    "type": "string",
                    "description": "Name of the patient being screened.",
                    "default": "Patient"
                },
                "fasting_sugar": {
                    "type": "integer",
                    "description": "Current fasting blood glucose in mg/dL for multi-modal glycemic risk correlation."
                }
            },
            "required": ["image_path"]
        }
    },
    {
        "name": "inspect_workflow_graph",
        "description": "Returns the visual block architecture and nodes of the Ultralytics Agents workflow pipeline as designed on platform.ultralytics.com/agents.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]

def handle_initialize(request_id: Any, params: dict):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "result": {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {
                    "listChanged": False
                }
            },
            "serverInfo": {
                "name": "ultralytics-agents-workflow-mcp",
                "version": "1.0.0",
                "description": "Ultralytics Agents Visual Workflow & RetiSync Retinal Screening MCP Server"
            }
        }
    }

def handle_tools_list(request_id: Any):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "result": {
            "tools": TOOLS_DEFINITIONS
        }
    }

def handle_tools_call(request_id: Any, params: dict):
    tool_name = params.get("name")
    args = params.get("arguments", {})

    logger.info(f"Invoking tool: {tool_name} with args: {args}")

    try:
        import importlib
        import workflow
        import retinal_workflow
        importlib.reload(workflow)
        importlib.reload(retinal_workflow)
        active_runner = workflow.UltralyticsAgentWorkflow()
        active_retinal_runner = retinal_workflow.RetisyncRetinalWorkflow()
        if tool_name == "run_ultralytics_workflow":
            image_path = args.get("image_path")
            prompt = args.get("prompt", "Describe the scene")
            min_person = int(args.get("min_person_count", 1))
            conf = float(args.get("confidence_threshold", 0.25))

            result = active_runner.run(
                image_source=image_path,
                prompt=prompt,
                min_person_count=min_person,
                conf_threshold=conf
            )
            output_text = json.dumps(result, indent=2)

        elif tool_name == "retinal_screening_workflow":
            image_path = args.get("image_path")
            patient_name = args.get("patient_name", "Anonymous Patient")
            fasting_sugar = args.get("fasting_sugar")
            if fasting_sugar is not None:
                fasting_sugar = int(fasting_sugar)

            result = active_retinal_runner.run(
                image_path=image_path,
                patient_name=patient_name,
                fasting_sugar=fasting_sugar
            )
            output_text = json.dumps(result, indent=2)

        elif tool_name == "inspect_workflow_graph":
            graph = {
                "platform": "https://platform.ultralytics.com/agents",
                "template": "YOLO -> VLM Monitor",
                "nodes": [
                    {
                        "id": "node_1",
                        "title": "Input image",
                        "subtitle": "Choose an image",
                        "type": "input",
                        "next": "node_2"
                    },
                    {
                        "id": "node_2",
                        "title": "Detect people",
                        "subtitle": "yolo26n · Detect",
                        "type": "model",
                        "model": "yolo26n",
                        "task": "detect",
                        "next": "node_3"
                    },
                    {
                        "id": "node_3",
                        "title": "When a person appears",
                        "subtitle": "person >= 1",
                        "type": "condition",
                        "operator": ">=",
                        "target_class": "person",
                        "threshold": 1,
                        "next": "node_4"
                    },
                    {
                        "id": "node_4",
                        "title": "Describe the scene",
                        "subtitle": "gemini-nano-banana-2.1",
                        "type": "vlm",
                        "model": "gemini-nano-banana-2.1",
                        "prompt": "Describe the scene",
                        "next": "node_5"
                    },
                    {
                        "id": "node_5",
                        "title": "Output",
                        "subtitle": "Final result",
                        "type": "output"
                    }
                ]
            }
            output_text = json.dumps(graph, indent=2)
        else:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32601,
                    "message": f"Tool '{tool_name}' not found."
                }
            }

        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "content": [
                    {
                        "type": "text",
                        "text": output_text
                    }
                ],
                "isError": False
            }
        }
    except Exception as e:
        logger.error(f"Error in tool execution: {str(e)}\n{traceback.format_exc()}")
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "content": [
                    {
                        "type": "text",
                        "text": f"Error executing workflow: {str(e)}"
                    }
                ],
                "isError": True
            }
        }

def send_response(response_dict):
    body = json.dumps(response_dict)
    sys.stdout.write(body + "\n")
    sys.stdout.flush()

def main():
    logger.info("Ultralytics Agents MCP Server running on stdio...")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except Exception as e:
            logger.error(f"Invalid JSON received: {line}")
            continue

        method = msg.get("method")
        msg_id = msg.get("id")
        params = msg.get("params", {})

        if method == "initialize":
            send_response(handle_initialize(msg_id, params))
        elif method == "notifications/initialized":
            logger.info("MCP client initialized.")
        elif method == "ping":
            send_response({"jsonrpc": "2.0", "id": msg_id, "result": {}})
        elif method == "tools/list":
            send_response(handle_tools_list(msg_id))
        elif method == "tools/call":
            send_response(handle_tools_call(msg_id, params))
        else:
            if msg_id is not None:
                send_response({
                    "jsonrpc": "2.0",
                    "id": msg_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method '{method}' not implemented."
                    }
                })

if __name__ == "__main__":
    main()

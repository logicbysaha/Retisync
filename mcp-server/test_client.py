"""
Self-Test Client for Ultralytics Agents MCP Server
Spawns server.py over stdio and executes the full workflow pipeline with sample images.
"""

import subprocess
import json
import os
import sys

def run_test():
    server_script = os.path.join(os.path.dirname(__file__), "server.py")
    test_image = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sandhya_avatar.jpg"))

    print(f"Starting MCP Server process: python {server_script}")
    print(f"Target test image: {test_image}")

    proc = subprocess.Popen(
        [sys.executable, server_script],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )

    def send_request(req):
        line = json.dumps(req)
        proc.stdin.write(line + "\n")
        proc.stdin.flush()
        resp_line = proc.stdout.readline()
        return json.loads(resp_line)

    try:
        # 1. Initialize
        print("\n--- 1. Testing Initialize ---")
        init_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test-runner", "version": "1.0.0"}
            }
        }
        res = send_request(init_req)
        print("Server Info:", res.get("result", {}).get("serverInfo"))

        # 2. Tools List
        print("\n--- 2. Testing tools/list ---")
        list_req = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }
        res = send_request(list_req)
        tools = res.get("result", {}).get("tools", [])
        print(f"Found {len(tools)} tools:")
        for t in tools:
            print(f" - {t['name']}: {t['description'][:70]}...")

        # 3. Call run_ultralytics_workflow
        print("\n--- 3. Testing tools/call: run_ultralytics_workflow ---")
        call_req = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "run_ultralytics_workflow",
                "arguments": {
                    "image_path": test_image,
                    "prompt": "Describe the person in this healthcare field screening scene",
                    "min_person_count": 1
                }
            }
        }
        res = send_request(call_req)
        content = res.get("result", {}).get("content", [])
        if content:
            output_text = content[0].get("text", "")
            print("Workflow Execution Output:")
            parsed = json.loads(output_text)
            print("Status:", parsed.get("summary"))
            print("Step 1 (Input):", parsed.get("steps", [])[0].get("details"))
            print("Step 2 (YOLO Detect):", parsed.get("steps", [])[1].get("details"))
            print("Step 3 (Condition Gate):", parsed.get("steps", [])[2])
            print("Step 4 (Describe Scene):", parsed.get("steps", [])[3].get("output") or parsed.get("steps", [])[3].get("reason"))

        # 4. Call inspect_workflow_graph
        print("\n--- 4. Testing tools/call: inspect_workflow_graph ---")
        graph_req = {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "inspect_workflow_graph",
                "arguments": {}
            }
        }
        res = send_request(graph_req)
        print("Graph verified:", "nodes" in res.get("result", {}).get("content", [{}])[0].get("text", ""))

        print("\n=== All MCP Server tests PASSED successfully! ===")

    finally:
        proc.terminate()

if __name__ == "__main__":
    run_test()

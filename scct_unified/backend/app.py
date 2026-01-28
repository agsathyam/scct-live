# Copyright 2026 Sathya Narayanan Annamalai Geetha
# Licensed under the MIT License.

import json
import logging
from flask import Flask, request, Response, stream_with_context, send_from_directory, jsonify
from flask_cors import CORS
import vertexai
from vertexai import agent_engines

# --- CONFIGURATION ---
from dotenv import load_dotenv
load_dotenv()



PROJECT_ID = os.environ.get("PROJECT_ID")
LOCATION = os.environ.get("LOCATION")
AGENT_ID = os.environ.get("AGENT_ID")

if not PROJECT_ID or not LOCATION or not AGENT_ID:
    # We allow missing env vars in build phase (e.g. CI), but runtime needs them.
    print("WARNING: PROJECT_ID, LOCATION, or AGENT_ID missing. Agent features will fail.")

# Initialize Vertex AI
try:
    if PROJECT_ID and LOCATION:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
except Exception as e:
    print(f"Vertex AI Init Failed: {e}")

# --- FLASK APP SETUP ---
# We treat the current directory as the root for static content if configured
# In our structure: backend/app.py, backend/static/, backend/templates/
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app) # Enable CORS for all (less critical since we are same-origin mostly)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- ROUTES ---

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """
    Serve the React Single Page Application.
    If a file exists in /static, serve it.
    Otherwise, serve index.html (Client-side routing).
    """
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        # Check if assets request
        if path.startswith('assets/'):
             return send_from_directory(app.static_folder + '/assets', path.replace('assets/', ''))
        
        # Default to index.html for SPA routing
        if os.path.exists(app.template_folder + '/index.html'):
            return send_from_directory(app.template_folder, 'index.html')
        else:
            return "UI Not Found. Did you run 'npm run build'?", 404

@app.route('/stream', methods=['POST'])
def stream_agent_response():
    data = request.json
    if not data:
        return Response("Invalid JSON payload", status=400)

    query = data.get('query')
    user_id = data.get('user_id', 'standard-user')

    if not query:
        return Response("Missing 'query' field", status=400)

    logger.info(f"Received query: {query} (User: {user_id})")

    # --- AUTH VERIFICATION (HYBRID / DEMO) ---
    # 1. IAP (If behind LB)
    # 2. Bearer Token (If Direct/Dev/Demo)
    
    iap_jwt = request.headers.get('x-goog-iap-jwt-assertion')
    auth_header = request.headers.get('Authorization')
    is_authenticated = False
    
    # 1. IAP Check
    if iap_jwt:
        logger.info("Authenticated via IAP")
        user_id = "iap-user" 
        is_authenticated = True
        
    # 2. Token Check (Demo or Real)
    elif auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[1]
        
        # DEMO MODE: Accept 'demo-token'
        if token == 'demo-token':
            user_id = 'demo-user'
            is_authenticated = True
            logger.info("Authenticated via Demo Token")
            
    # 3. Public Access (Fallback)
    else:
        user_id = 'public-guest'
        is_authenticated = True
        logger.info("Accessing as Public Guest (Unauthenticated)")


    if not is_authenticated:
        # This block is now effectively unreachable unless we add strict checks later
        # Keeping minimal failsafe just in case
        logger.warning(f"Unauthenticated API Access Attempt from {request.remote_addr}")
        return Response(
            json.dumps({
                "error": "Unauthorized.",
                "type": "AuthError"
            }), 
            status=403, 
            mimetype='application/json'
        )
    
    # --- STREAMING GENERATOR ---
    def generate():
        logger.info(f"Stream starting for {user_id}")
        try:
            agent = agent_engines.get(AGENT_ID)
            response = agent.stream_query(message=query, user_id=user_id)
            
            for chunk in response:
                try:
                    chunk_data = chunk.to_dict() if hasattr(chunk, "to_dict") else chunk
                    json_str = json.dumps(chunk_data)
                    yield f"data: {json_str}\n\n"
                except Exception as e:
                    logger.error(f"Serialization error: {e}")
                    
        except Exception as e:
            logger.error(f"Agent Engine Error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    response = Response(stream_with_context(generate()), mimetype='text/event-stream')
    response.headers['Content-Type'] = 'text/event-stream; charset=utf-8'
    response.headers['Cache-Control'] = 'no-cache, no-transform'
    response.headers['Connection'] = 'keep-alive'
    response.headers['X-Accel-Buffering'] = 'no'
    return response

@app.route('/health')
def health():
    return jsonify({"status": "ok", "service": "scct-unified"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"🚀 Unified SCCT App running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)

import React, { useState } from 'react';

export const ActionServices: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CODE' | 'SCHEMA' | 'DOCKER' | 'OPENAPI' | 'DEPLOY' | 'INTEGRATION'>('CODE');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app we'd use a toast here
  };

  return (
    <div className="h-full bg-slate-950 p-6 overflow-hidden flex flex-col animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-6">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-purple-400">⚡</span>
              Action & Observability Layer
            </h1>
            <p className="text-xs text-slate-400 mt-1">Backend execution engine with BigQuery persistence.</p>
          </div>
          <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <TabButton active={activeTab === 'CODE'} onClick={() => setActiveTab('CODE')} label="main.py" />
            <TabButton active={activeTab === 'SCHEMA'} onClick={() => setActiveTab('SCHEMA')} label="Schema" />
            <TabButton active={activeTab === 'DOCKER'} onClick={() => setActiveTab('DOCKER')} label="Dockerfile" />
            <TabButton active={activeTab === 'OPENAPI'} onClick={() => setActiveTab('OPENAPI')} label="OpenAPI" />
            <div className="w-px bg-slate-700 mx-1 my-1"></div>
            <TabButton active={activeTab === 'DEPLOY'} onClick={() => setActiveTab('DEPLOY')} label="Deploy" />
            <TabButton active={activeTab === 'INTEGRATION'} onClick={() => setActiveTab('INTEGRATION')} label="Connect" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden flex flex-col relative shadow-inner">

          {/* Copy Button Overlay */}
          {activeTab !== 'INTEGRATION' && activeTab !== 'DEPLOY' && (
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => copyToClipboard(
                  activeTab === 'CODE' ? BACKEND_CODE :
                    activeTab === 'SCHEMA' ? BQ_SCHEMA :
                      activeTab === 'OPENAPI' ? OPENAPI_SPEC :
                        activeTab === 'DOCKER' ? DOCKERFILE : ''
                )}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded text-[10px] border border-slate-600 transition-colors backdrop-blur-sm"
              >
                Copy
              </button>
            </div>
          )}

          <div className="flex-1 overflow-auto custom-scrollbar">
            {activeTab === 'CODE' && (
              <CodeBlock code={BACKEND_CODE} lang="python" />
            )}
            {activeTab === 'SCHEMA' && (
              <div className="p-0 h-full flex flex-col">
                <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                  Execute this DDL in BigQuery to initialize the audit log table.
                </div>
                <CodeBlock code={BQ_SCHEMA} lang="sql" color="orange" />
              </div>
            )}
            {activeTab === 'DOCKER' && (
              <CodeBlock code={DOCKERFILE} lang="dockerfile" color="blue" />
            )}
            {activeTab === 'OPENAPI' && (
              <CodeBlock code={OPENAPI_SPEC} lang="yaml" color="green" />
            )}
            {activeTab === 'DEPLOY' && (
              <div className="p-6 text-slate-300 space-y-6 max-w-4xl mx-auto">
                <Step title="1. Project Setup" cmd="gcloud auth login && gcloud config set project [ID]" />
                <Step title="2. Enable APIs" cmd="gcloud services enable bigquery.googleapis.com" />
                <Step title="3. Deploy" cmd={DEPLOY_CMD} color="yellow" />

                <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-2">4. Vertex AI Registration</h4>
                  <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1">
                    <li>Copy `openapi.yaml` content.</li>
                    <li>Create Tool in Agent Builder {'>'} Select "OpenAPI".</li>
                    <li>Update `url` to your Cloud Run endpoint.</li>
                    <li>Use <strong>Service Agent Auth</strong>.</li>
                  </ol>
                </div>
              </div>
            )}
            {activeTab === 'INTEGRATION' && (
              <div className="h-full flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-slate-900/50 p-8 rounded-2xl border border-white/5 space-y-6">
                  <div className="text-center">
                    <h2 className="text-lg font-bold text-white mb-2">Connect to Real Agent</h2>
                    <p className="text-sm text-slate-400">Replace the simulated client with your deployed Vertex AI Agent.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="shrink-0 w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Get Credentials</div>
                        <div className="text-[10px] text-slate-500 mt-1">Locate Agent ID in Console. Generate token via `gcloud auth print-access-token`.</div>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="shrink-0 w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">Configure Dashboard</div>
                        <div className="text-[10px] text-slate-500 mt-1">Click the ⚙️ icon in the top header and enter your details.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponents for cleaner code
const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${active
      ? 'bg-slate-700 text-white shadow-sm'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
  >
    {label}
  </button>
);

const CodeBlock: React.FC<{ code: string; lang?: string; color?: string }> = ({ code, color = "blue" }) => (
  <pre className={`p-4 text-xs font-mono leading-relaxed bg-black/20 min-h-full ${color === 'orange' ? 'text-orange-200' :
    color === 'green' ? 'text-emerald-200' :
      color === 'yellow' ? 'text-amber-200' :
        'text-blue-200'
    }`}>
    {code}
  </pre>
);

const Step: React.FC<{ title: string; cmd: string; color?: string }> = ({ title, cmd, color }) => (
  <div className="space-y-2">
    <div className="text-sm font-bold text-slate-200">{title}</div>
    <div className={`p-3 rounded-lg font-mono text-xs border border-white/5 bg-black/40 ${color === 'yellow' ? 'text-yellow-400' : 'text-slate-400'
      }`}>
      {cmd}
    </div>
  </div>
);

const BQ_SCHEMA = `CREATE SCHEMA IF NOT EXISTS supply_chain_control_tower;

CREATE TABLE supply_chain_control_tower.agent_decisions (
    log_id STRING NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    event_id STRING NOT NULL,
    agent_version STRING,
    
    -- Inputs
    trigger_type STRING, -- e.g. LATE_SHIPMENT
    customer_tier STRING,
    
    -- Agent Thinking
    confidence_score FLOAT64,
    reasoning STRING,
    
    -- Action Taken
    action_name STRING, -- e.g. update_eta
    tool_parameters JSON,
    
    -- Result
    execution_status STRING, -- SUCCESS / FAILED
    execution_latency_ms INT64
)
PARTITION BY DATE(timestamp);`;

const BACKEND_CODE = `import os
import logging
import uuid
import datetime
import time
from flask import Flask, request, jsonify
from google.cloud import bigquery

# Configure structured logging for Cloud Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize BigQuery Client
bq_client = bigquery.Client()
BQ_TABLE_ID = os.environ.get("BQ_TABLE_ID", "your-project.supply_chain_control_tower.agent_decisions")

def log_to_bigquery(event_data):
    """
    Persists the agent's decision trail to BigQuery for observability.
    """
    try:
        rows_to_insert = [{
            "log_id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "event_id": event_data.get('event_id', 'unknown'),
            "agent_version": "gemini-2.5-pro",
            "trigger_type": event_data.get('trigger_type'),
            "customer_tier": event_data.get('customer_tier'),
            "confidence_score": event_data.get('confidence', 0.0),
            "reasoning": event_data.get('reasoning', ''),
            "action_name": event_data.get('action_name'),
            "tool_parameters": str(event_data.get('params', {})), # Storing as stringified JSON for simplicity
            "execution_status": event_data.get('status', 'SUCCESS'),
            "execution_latency_ms": event_data.get('latency', 0)
        }]
        
        errors = bq_client.insert_rows_json(BQ_TABLE_ID, rows_to_insert)
        if errors == []:
            logger.info("New rows have been added to BigQuery.")
        else:
            logger.error(f"Encountered errors while inserting rows: {errors}")
            
    except Exception as e:
        logger.error(f"Failed to log to BigQuery: {str(e)}")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "serving"}), 200

# --- TOOL 1: UPDATE ETA ---
@app.route('/update_eta', methods=['POST'])
def update_eta():
    start_time = time.time()
    data = request.get_json()
    
    # 1. Execute Logic
    shipment_id = data.get('shipment_id')
    new_eta = data.get('new_eta')
    
    logger.info(f"Updating ETA for {shipment_id} to {new_eta}")
    
    # ... Real logic to update TMS would go here ...
    
    # 2. Log Observability Data
    log_to_bigquery({
        "event_id": data.get('metadata', {}).get('event_id'),
        "trigger_type": "LATE_SHIPMENT_HANDLER",
        "action_name": "update_eta",
        "params": data,
        "customer_tier": data.get('metadata', {}).get('customer_tier'),
        "confidence": 0.95, # In production, pass this from the agent
        "status": "SUCCESS",
        "latency": int((time.time() - start_time) * 1000)
    })

    return jsonify({"status": "success", "updated_eta": new_eta}), 200

# --- TOOL 2: REQUEST RESHIPMENT ---
@app.route('/request_reshipment', methods=['POST'])
def request_reshipment():
    start_time = time.time()
    data = request.get_json()
    
    original_shipment_id = data.get('original_shipment_id')
    priority = data.get('priority', 'STANDARD')
    
    logger.info(f"Requesting reshipment for {original_shipment_id}. Priority: {priority}")
    
    new_order_id = f"ORD-RESHIP-{uuid.uuid4().hex[:8]}"

    # Log Observability Data
    log_to_bigquery({
        "event_id": data.get('metadata', {}).get('event_id'),
        "trigger_type": "RESHIPMENT_HANDLER",
        "action_name": "request_reshipment",
        "params": data,
        "customer_tier": data.get('metadata', {}).get('customer_tier'),
        "confidence": 0.98,
        "status": "SUCCESS",
        "latency": int((time.time() - start_time) * 1000)
    })
    
    return jsonify({
        "status": "success", 
        "new_order_id": new_order_id,
        "priority": priority
    }), 200

# --- TOOL 3: ESCALATE TO HUMAN ---
@app.route('/escalate_to_human', methods=['POST'])
def escalate_to_human():
    start_time = time.time()
    data = request.get_json()
    
    shipment_id = data.get('shipment_id')
    reason = data.get('reason')
    
    logger.info(f"Escalating {shipment_id}: {reason}")
    
    ticket_id = f"TKT-{uuid.uuid4().hex[:8]}"

    # Log Observability Data
    log_to_bigquery({
        "event_id": data.get('metadata', {}).get('event_id'),
        "trigger_type": "EXCEPTION_ESCALATION",
        "action_name": "escalate_to_human",
        "params": data,
        "confidence": 1.0, 
        "reasoning": reason,
        "status": "SUCCESS",
        "latency": int((time.time() - start_time) * 1000)
    })

    return jsonify({"status": "escalated", "ticket_id": ticket_id}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)`;

const DOCKERFILE = `# Use the official lightweight Python image.
FROM python:3.10-slim

ENV PYTHONUNBUFFERED True
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

# Install dependencies including BigQuery
RUN pip install --no-cache-dir Flask==3.0.0 gunicorn==21.2.0 google-cloud-bigquery==3.13.0

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app`;

const OPENAPI_SPEC = `openapi: 3.0.0
info:
  title: Supply Chain Action Service
  description: API for Autonomous Agent to perform supply chain operations.
  version: 1.0.0
servers:
  - url: https://YOUR_CLOUD_RUN_URL.run.app
paths:
  /update_eta:
    post:
      summary: Update Shipment ETA
      description: Updates the expected delivery date in the TMS.
      operationId: updateEta
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                shipment_id:
                  type: string
                new_eta:
                  type: string
                reason:
                  type: string
                metadata:
                  type: object
                  description: Pass context for observability logging
      responses:
        '200':
          description: Successful update
  /request_reshipment:
    post:
      summary: Request Reshipment
      description: Creates a replacement order for damaged or lost goods.
      operationId: requestReshipment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                original_shipment_id:
                  type: string
                items:
                  type: array
                  items:
                    type: string
                priority:
                  type: string
                  enum: [STANDARD, NFO]
                metadata:
                  type: object
      responses:
        '200':
          description: Reshipment created
  /escalate_to_human:
    post:
      summary: Escalate to Human
      description: Flags the issue for manual intervention.
      operationId: escalateToHuman
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                shipment_id:
                  type: string
                reason:
                  type: string
                severity:
                  type: string
                metadata:
                  type: object
      responses:
        '200':
          description: Ticket created`;

const DEPLOY_CMD = `# 1. Create requirements.txt
echo "Flask==3.0.0\\ngunicorn==21.2.0\\ngoogle-cloud-bigquery==3.13.0" > requirements.txt

# 2. Build and Deploy to Cloud Run
gcloud run deploy supply-chain-actions \\
  --source . \\
  --region us-central1 \\
  --set-env-vars BQ_TABLE_ID=[YOUR_PROJECT].supply_chain_control_tower.agent_decisions \\
  --max-instances 5 \\
  --memory 512Mi`;
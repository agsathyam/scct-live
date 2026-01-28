# Copyright 2026 Sathya Narayanan Annamalai Geetha
# Licensed under the MIT License.
import os
import logging
import uuid
import datetime
import time
import random
from flask import Flask, request, jsonify
from google.cloud import discoveryengine
from google.cloud import bigquery
from google.api_core import client_options
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure structured logging for Cloud Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
GCP_PROJECT_ID = os.environ.get("GCP_PROJECT_ID")

VERTEX_SEARCH_DATA_STORE_ID = os.environ.get("VERTEX_SEARCH_DATA_STORE_ID")
BQ_TABLE_ID = os.environ.get("BQ_TABLE_ID")
BQ_AGENT_DECISIONS_TABLE = os.environ.get("BQ_AGENT_DECISIONS_TABLE", BQ_TABLE_ID)
BQ_SHIPMENTS_TABLE = os.environ.get("BQ_SHIPMENTS_TABLE")
BQ_EXCEPTIONS_TABLE = os.environ.get("BQ_EXCEPTIONS_TABLE")
BQ_RESOLUTIONS_TABLE = os.environ.get("BQ_RESOLUTIONS_TABLE")

if not all([GCP_PROJECT_ID, VERTEX_SEARCH_DATA_STORE_ID, BQ_AGENT_DECISIONS_TABLE]):
    logger.warning("Missing critical environment variables. Ensure .env is configured.")

# Initialize BigQuery Client
bq_client = bigquery.Client()

def log_to_bigquery(event_data):
    """
    Persists the agent's decision trail to BigQuery for observability.
    """
    # SIMULATION MODE CHECK
    if request and request.headers.get('X-Simulation-Mode') == 'true':
        logger.info(f"SIMULATION MODE: Skipping BigQuery insert. Data: {event_data}")
        return

    try:
        rows_to_insert = [{
            "log_id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "event_id": event_data.get('event_id', 'unknown'),
            "agent_version": event_data.get('agent_version', "gemini-2.5-pro"),
            "trigger_type": event_data.get('trigger_type'),
            "customer_tier": event_data.get('customer_tier'),
            "confidence_score": event_data.get('confidence', 0.0),
            "reasoning": event_data.get('reasoning', ''),
            "action_name": event_data.get('action_name'),
            "tool_parameters": str(event_data.get('params', {})), 
            "execution_status": event_data.get('status', 'SUCCESS'),
            "execution_latency_ms": event_data.get('latency', 0)
        }]
        
        try:
            errors = bq_client.insert_rows_json(BQ_AGENT_DECISIONS_TABLE, rows_to_insert)
            if errors == []:
                logger.info("New rows have been added to BigQuery.")
            else:
                logger.error(f"Encountered errors while inserting rows: {errors}")
        except Exception as bq_error:
             logger.warning(f"BigQuery Insert Failed: {bq_error}")
            
    except Exception as e:
        logger.error(f"Failed to isolate BigQuery log logic: {str(e)}")

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
    reason = data.get('reason')
    
    logger.info(f"Updating ETA for {shipment_id} to {new_eta} due to {reason}")
    
    # 2. Log Observability Data
    log_to_bigquery({
        "event_id": data.get('metadata', {}).get('event_id'),
        "trigger_type": "LATE_SHIPMENT_HANDLER",
        "action_name": "update_eta",
        "params": data,
        "customer_tier": data.get('metadata', {}).get('customer_tier'),
        "reasoning": data.get('reasoning'),
        "confidence": 0.95,
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
    tracking_id = f"TRK-{uuid.uuid4().hex[:10].upper()}"
    carrier = "FedEx Priority"

    # Log Observability Data
    log_to_bigquery({
        "event_id": data.get('metadata', {}).get('event_id'),
        "trigger_type": "RESHIPMENT_HANDLER",
        "action_name": "request_reshipment",
        "params": data,
        "customer_tier": data.get('metadata', {}).get('customer_tier'),
        "reasoning": data.get('reasoning'),
        "confidence": 0.98,
        "status": "SUCCESS",
        "latency": int((time.time() - start_time) * 1000)
    })
    

    return jsonify({
        "status": "success", 
        "new_order_id": new_order_id,
        "tracking_id": tracking_id,
        "carrier": carrier,
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
        "reasoning": data.get('reasoning', reason),
        "status": "SUCCESS",
        "latency": int((time.time() - start_time) * 1000)
    })

    return jsonify({"status": "escalated", "ticket_id": ticket_id}), 200

# --- TOOL 4: VERTEX AI SEARCH ---
@app.route('/search', methods=['POST'])
def search_knowledge_base():
    """
    Semantic Search via Vertex AI Search.
    
    Accepts:
        {"query": "string"}
        
    Returns:
        {"status": "success", "results": [{"id":..., "title":..., "content":...}]}
    """
    try:
        data = request.get_json()
        query = data.get('query')
        
        # --- POST-SEARCH FILTERING SETUP ---
        KNOWN_CUSTOMERS = ["HealthPlus", "TechGiant", "Global Mart", "Global Retail", "FreshMarket", "Detroit Motors", "MediLife"]
        active_customer = next((c for c in KNOWN_CUSTOMERS if c.lower() in query.lower()), None)
        
        # Randomize result count (2-5)
        limit = random.randint(2, 5)

        
        raw_results = []

        # SIMULATION MODE CHECK
        if request.headers.get('X-Simulation-Mode') == 'true':
            logger.info(f"SIMULATION MODE: Returning mock search results for '{query}'")
            mock_docs = [
                    {
                        "id": "doc-vip-900",
                        "title": "MSA - Global Retail VIP",
                        "content": "SERVICE LEVEL AGREEMENT (SLA)\nProvider guarantees 98% on-time delivery for all shipments.\nFor VIP Platinum tier, any LATE SHIPMENT exceeding 24 hours requires immediate remediation via expedited replacement.\nDelayed shipments trigger a 5% penalty clause.",
                        "keywords": ["vip", "retail", "techgiant", "late", "shipment"]
                    },
                    {
                        "id": "doc-sla-001",
                        "title": "SOP - HealthPlus Pharma",
                        "content": "TEMPERATURE CONTROL\nAll shipments must be maintained between 2°C and 8°C. Any excursion above 8°C for more than 4 hours renders the product 'Adulterated'.",
                        "keywords": ["pharma", "health", "temperature", "vaccine", "insulin"]
                    },
                    {
                         "id": "doc-ops-202",
                         "title": "SOP - Inventory Shortage Resolution",
                         "content": "INVENTORY ALLOCATION\nWhen stock < demand:\n1. Search alternate DCs within 500 miles.\n2. If not available, offer similar SKU substitution (requires customer consent).\n3. Cancel order if no resolution within 48h.",
                         "keywords": ["inventory", "shortage", "stock", "retail", "techgiant"]
                    }
                ]
            
            # Simple keyword matching
            query_lower = query.lower()
            raw_results = [
                d for d in mock_docs 
                if any(k in query_lower for k in d['keywords']) or query_lower == ""
            ][:limit]
            
            # Fallback if no match
            if not raw_results:
                raw_results = mock_docs
        
        else:
            # Discovery Engine Search
            client = discoveryengine.SearchServiceClient()
            serving_config = client.serving_config_path(
                project=GCP_PROJECT_ID,
                location="global",
                data_store=VERTEX_SEARCH_DATA_STORE_ID,
                serving_config="default_search",
            )
            
            req = discoveryengine.SearchRequest(
                serving_config=serving_config,
                query=query,
                page_size=limit,
                content_search_spec={"snippet_spec": {"return_snippet": True}, "extractive_content_spec": {"max_extractive_answer_count": 1}}
            )
            
            search_results = client.search(req)
            
            for result in search_results.results:
                content = ""
                if result.document.derived_struct_data:
                     snippets = result.document.derived_struct_data.get('snippets', [])
                     content_parts = []
                     for snippet in snippets:
                         # Handle MapComposite/Struct by trying to access 'snippet' or defaulting to str
                         if hasattr(snippet, 'get'):
                             content_parts.append(snippet.get('snippet', ''))
                         else:
                             content_parts.append(str(snippet))
                     content = "\n...\n".join([c for c in content_parts if c])
                
                # Extract URI and Title
                uri = ""
                title = "Unknown"
                
                # Try to find URI in derived data first (often better populated)
                if result.document.derived_struct_data:
                     link = result.document.derived_struct_data.get('link', '')
                     if link: 
                         uri = link
                
                # Fallback to direct content uri
                if not uri and result.document.content and result.document.content.uri:
                    uri = result.document.content.uri
                    
                # Determine Title from URI if not in struct_data
                if result.document.struct_data:
                    title = result.document.struct_data.get('title', 'Unknown')
                
                if title == "Unknown" and uri:
                    title = uri.split('/')[-1]
                    
                # Generate Public/Console URL
                url = uri
                if uri.startswith("gs://"):
                    # Convert gs://bucket/path -> https://storage.googleapis.com/bucket/path (Public)
                    url = uri.replace("gs://", "https://storage.googleapis.com/")

                raw_results.append({
                    "id": result.document.id,
                    "title": title,
                    "content": content or "No content snippet.",
                    "url": url,
                    "uri": uri
                })

        # --- APPLY FILTERING ---
        
        # 1. Access & Quality Filter (Remove "No snippet" docs)
        filtered_by_quality = []
        for doc in raw_results:
             if "No snippet is available for this page" not in doc.get('content', ''):
                 filtered_by_quality.append(doc)

        # 2. Customer Context Filter
        final_results = []
        if active_customer:
            for doc in filtered_by_quality:
                doc_text = (doc.get('title', '') + " " + doc.get('content', '')).lower()
                is_competitor = False
                for c in KNOWN_CUSTOMERS:
                    if c.lower() != active_customer.lower() and c.lower() in doc_text:
                        # Found a DIFFERENT customer name in the doc -> Exclude it
                        is_competitor = True
                        break
                
                if not is_competitor:
                    final_results.append(doc)
        else:
            final_results = filtered_by_quality

        return jsonify({"status": "success", "results": final_results}), 200

    except Exception as e:
        logger.error(f"Search failed: {e}")
        return jsonify({"status": "error", "message": str(e), "results": []}), 200

# --- TOOL 5: GET SIMILAR EVENTS ---
@app.route('/get_similar_events', methods=['POST'])
def get_similar_events():
    try:
        data = request.get_json()
        event_type = data.get('event_type') # e.g. "LATE_SHIPMENT"
        limit = data.get('limit', 3)
        
        # SIMULATION MODE CHECK
        if request.headers.get('X-Simulation-Mode') == 'true':
             logger.info(f"SIMULATION MODE: Returning mock history for '{event_type}'")
             return jsonify({
                "status": "success", 
                "results": [
                    {
                        "event_id": "EVT-SIM-001",
                        "event_type": event_type or "LATE_SHIPMENT",
                        "action": "update_eta",
                        "reasoning": "Standard delay < 4 hours, updating ETA as per SLA.",
                        "outcome": "SUCCESS"
                    },
                    {
                        "event_id": "EVT-SIM-002",
                        "event_type": event_type or "LATE_SHIPMENT",
                        "action": "request_reshipment",
                        "reasoning": "Shipment lost in transit (>72h no scan). Triggering reshipment for VIP customer.",
                        "outcome": "SUCCESS"
                    }
                ]
            }), 200

        query = f"""
            SELECT 
                e.event_id, r.reasoning, r.action_name, r.execution_status
            FROM `{BQ_RESOLUTIONS_TABLE}` r
            JOIN `{BQ_EXCEPTIONS_TABLE}` e ON r.event_id = e.event_id
            WHERE e.type LIKE @event_type
            AND r.execution_status = 'SUCCESS'
            ORDER BY r.timestamp DESC
            LIMIT @limit
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("event_type", "STRING", f"%{event_type}%"),
                bigquery.ScalarQueryParameter("limit", "INT64", limit)
            ]
        )
        
        query_job = bq_client.query(query, job_config=job_config)
        results = []
        for row in query_job:
            results.append({
                "event id": row.event_id,
                "action": row.action_name,
                "reasoning": row.reasoning,
                "outcome": row.execution_status
            })
            
        return jsonify({"status": "success", "results": results}), 200
    except Exception as e:
        logger.error(f"History fetch failed: {e}")
        return jsonify({"status": "error", "message": str(e), "results": []}), 200

# --- ADMIN TOOL: IMPORT DOCUMENTS ---
@app.route('/import_documents', methods=['POST'])
def import_documents():
    try:
        client = discoveryengine.DocumentServiceClient()
        parent = client.branch_path(
            project=GCP_PROJECT_ID,
            location="global",
            data_store=VERTEX_SEARCH_DATA_STORE_ID,
            branch="default_branch",
        )
        
        request = discoveryengine.ImportDocumentsRequest(
            parent=parent,
            gcs_source=discoveryengine.GcsSource(
                input_uris=["gs://agentic-supplychain/policies/*"],
                data_schema="content"
            ),
            reconciliation_mode=discoveryengine.ImportDocumentsRequest.ReconciliationMode.INCREMENTAL
        )
        
        operation = client.import_documents(request=request)
        return jsonify({"status": "started", "operation": operation.operation.name}), 200
    except Exception as e:
        logger.error(f"Import failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/list_docs', methods=['GET'])
def list_documents():
    try:
        client = discoveryengine.DocumentServiceClient()
        parent = client.branch_path(
            project=GCP_PROJECT_ID,
            location="global",
            data_store=VERTEX_SEARCH_DATA_STORE_ID,
            branch="default_branch",
        )
        response = client.list_documents(parent=parent)
        docs = []
        for doc in response:
            docs.append({
                "id": doc.id,
                "title": doc.struct_data.get('title', 'No Title'),
                "uri": doc.content.uri if doc.content else "No URI"
            })
            if len(docs) >= 50: break # Limit
            
        return jsonify({"count": len(docs), "documents": docs}), 200
    except Exception as e:
        logger.error(f"List docs failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# --- DASHBOARD STATS ---
@app.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    try:
        days = request.args.get('days', 7)
        query = f"""
            SELECT 
                FORMAT_TIMESTAMP('%Y-%m-%d', timestamp) as date,
                action_name,
                COUNT(*) as count
            FROM `{BQ_AGENT_DECISIONS_TABLE}`
            WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {days} DAY)
            GROUP BY 1, 2
            ORDER BY 1
        """
        query_job = bq_client.query(query)
        results = []
        for row in query_job:
            results.append({
                "date": row.date,
                "action": row.action_name,
                "count": row.count
            })
        return jsonify(results), 200
    except Exception as e:
        logger.error(f"Stats failed: {e}")
        return jsonify([]), 200

@app.route('/resolve_human_task', methods=['POST'])
def resolve_human_task():
    start_time = time.time()
    data = request.get_json()
    
    event_id = data.get('event_id')
    action = data.get('action')
    reason = data.get('reason')
    
    logger.info(f"Human resolved {event_id} with {action}")
    
    # Log Observability Data (Human Action)
    log_to_bigquery({
        "event_id": event_id,
        "trigger_type": "HUMAN_RESOLUTION",
        "action_name": action,
        "params": data,
        "customer_tier": data.get('metadata', {}).get('customer_tier'),
        "confidence": 1.0, 
        "reasoning": reason,
        "status": "SUCCESS",
        "latency": int((time.time() - start_time) * 1000),
        "agent_version": "HUMAN_SUPERVISOR"
    })

    return jsonify({"status": "resolved"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)



# Supply Chain Control Tower (SCCT) - Deployment Manual

**Author**: Sathya Narayanan Annamalai Geetha  
**License**: MIT

This manual provides step-by-step instructions to deploy the Supply Chain Control Tower infrastructure and applications to Google Cloud Platform (GCP).

## 📋 Prerequisites

1.  **Google Cloud Project**: You need a GCP Project with billing enabled.
2.  **Tools Installed**:
    *   [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/docs/install)
    *   [Python 3.11+](https://www.python.org/downloads/)
    *   [Node.js 18+ & npm](https://nodejs.org/)
    *   [Docker](https://docs.docker.com/get-docker/)
3.  **APIs Enabled**:
    ```bash
    gcloud services enable \
        run.googleapis.com \
        aiplatform.googleapis.com \
        discoveryengine.googleapis.com \
        bigquery.googleapis.com \
        artifactregistry.googleapis.com \
        cloudbuild.googleapis.com
    ```

---

## Part 1: Infrastructure Setup

### 1.1 BigQuery Setup
The agent uses BigQuery to log shipments, exceptions, and decisions.

1.  **Create a Dataset**:
    ```bash
    bq --location=US mk -d supply_chain_control_tower
    ```

2.  **Create Tables**:
    Run these SQL commands in the BigQuery Console or via `bq query --use_legacy_sql=false "SQL"`:

    *   **Shipments Table** (`shipments`):
        ```sql
        CREATE TABLE supply_chain_control_tower.shipments (
            shipment_id STRING,
            origin STRING,
            destination STRING,
            status STRING,
            eta TIMESTAMP
        );
        ```

    *   **Exceptions Table** (`exceptions`):
        ```sql
        CREATE TABLE supply_chain_control_tower.exceptions (
            event_id STRING,
            type STRING,
            status STRING,
            timestamp TIMESTAMP
        );
        ```

    *   **Resolutions Table** (`resolutions`):
        ```sql
        CREATE TABLE supply_chain_control_tower.resolutions (
            event_id STRING,
            action_name STRING,
            reasoning STRING,
            execution_status STRING,
            timestamp TIMESTAMP
        );
        ```

    *   **Agent Decisions Table** (`agent_decisions`):
        ```sql
        CREATE TABLE supply_chain_control_tower.agent_decisions (
            log_id STRING,
            timestamp TIMESTAMP,
            event_id STRING,
            agent_version STRING,
            trigger_type STRING,
            customer_tier STRING,
            confidence_score FLOAT64,
            reasoning STRING,
            action_name STRING,
            tool_parameters STRING,
            execution_status STRING,
            execution_latency_ms INT64
        );
        ```

### 1.2 Google Cloud Storage (GCS) & Vertex AI Search
The agent uses RAG (Retrieval Augmented Generation) to search for SOPs.

1.  **Create a Bucket**:
    ```bash
    # Replace UNIQUE_BUCKET_NAME with your own
    gcloud storage buckets create gs://UNIQUE_BUCKET_NAME --location=us-central1
    ```

2.  **Upload Documents**:
    *   Upload your policy PDFs (e.g., "SOP - Retail.pdf", "SOP - Pharma.pdf") to `gs://UNIQUE_BUCKET_NAME/documents/`.
    *   *Note*: The UI has a synthetic data generator if you are running locally, or you can manually upload sample PDFs.

3.  **Create Vertex AI Search App**:
    *   Go to **Agent Builder** > **Apps** > **Create App**.
    *   Select **Search**.
    *   Select **Generic** (or "Enterprise Search").
    *   **Data Store**: Create a new Cloud Storage Data Store and select the bucket you created (`gs://UNIQUE_BUCKET_NAME`).
    *   **Sync**: Wait for the documents to index.
    *   **Copy the Data Store ID**: You will need this for the environment variables.

---

## Part 2: Deployment Steps

### Component 1: Supply Chain Tools (Tooling API)

This Service hosts the tools (BigQuery, Search, etc.) that the Agent calls.

1.  Navigate to `supply_chain_tools`:
    ```bash
    cd supply_chain_tools
    ```

2.  Deploy to Cloud Run:
    ```bash
    gcloud run deploy scct-tools \
      --source . \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars GCP_PROJECT_ID=YOUR_PROJECT_ID \
      --set-env-vars VERTEX_SEARCH_DATA_STORE_ID=YOUR_DATA_STORE_ID \
      --set-env-vars BQ_TABLE_ID=supply_chain_control_tower.agent_decisions \
      --set-env-vars BQ_AGENT_DECISIONS_TABLE=supply_chain_control_tower.agent_decisions \
      --set-env-vars BQ_SHIPMENTS_TABLE=supply_chain_control_tower.shipments \
      --set-env-vars BQ_EXCEPTIONS_TABLE=supply_chain_control_tower.exceptions \
      --set-env-vars BQ_RESOLUTIONS_TABLE=supply_chain_control_tower.resolutions
    ```

3.  **Note the Service URL**: e.g., `https://scct-tools-xyz.run.app`. You will use this as `BASE_URL` for the Agent.

---

### Component 2: Control Tower Agent (Vertex AI Reasoning Engine)

This is the Brain (Gemini 2.5) deployed on Vertex AI.

1.  Navigate to `controltower`:
    ```bash
    cd controltower
    ```

2.  **Deploy using Python**:
    Create a temporary file `deploy_agent.py` or run this in a python shell:
    ```python
    import os
    import vertexai
    from vertexai import agent_engines
    from agent import agent_app

    # CONFIGURATION
    PROJECT_ID = "YOUR_PROJECT_ID"
    LOCATION = "us-central1"
    STAGING_BUCKET = "gs://YOUR_STAGING_BUCKET_NAME" # Create one if needed
    TOOLS_URL = "https://scct-tools-xyz.run.app"   # From Component 1

    vertexai.init(project=PROJECT_ID, location=LOCATION, staging_bucket=STAGING_BUCKET)

    remote_agent = agent_engines.create(
        display_name="SCCT Agent",
        agent_engine=agent_engines.ModuleAgent(
            module_name="agent",
            agent_name="agent_app"
        ),
        requirements=["google-cloud-aiplatform[agent_engines,adk]>=1.32.0"],
        env_vars={
            "PROJECT_ID": PROJECT_ID,
            "LOCATION": LOCATION,
            "BASE_URL": TOOLS_URL
        }
    )
    print(f"Agent Deployed: {remote_agent.resource_name}")
    ```

3.  **Note the Agent Resource ID**: e.g., `projects/123.../locations/.../reasoningEngines/456...`.

---

### Component 3: Unified App (UI + Backend)

This is the user interface and the BFF (Backend for Frontend).

1.  Navigate to `scct_unified`:
    ```bash
    cd scct_unified
    ```

2.  **Configure Environment**:
    Create a `.env` file in `ui/`:
    ```bash
    VITE_VERTEX_AGENT_ENDPOINT=https://scct-unified-xyz.run.app/stream
    VITE_FIREBASE_API_KEY=YOUR_FIREBASE_KEY
    # ... other firebase config ...
    ```

3.  **Deploy to Cloud Run**:
    ```bash
    # Provide the Agent ID from Component 2
    gcloud run deploy scct-unified \
      --source . \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars PROJECT_ID=YOUR_PROJECT_ID \
      --set-env-vars LOCATION=us-central1 \
      --set-env-vars AGENT_ID=YOUR_AGENT_RESOURCE_ID \

---


---

## Part 3: Simulation Options

You have two options to run the application without a full production setup.

### Option A: UI Demo Mode (No Deployment Required)
The UI has a built-in "Mock Agent" that runs entirely in the browser.
*   **What it does**: Simulates the Agent's thinking process using hardcoded logic in TypeScript. **Zero network calls**.
*   **Requirements**:
    *   Node.js 18+ installed (Run `node -v` to check).
*   **How to Run**:
    1.  Navigate to the UI folder:
        ```bash
        cd scct_unified/ui
        ```
    2.  Install Dependencies (First time only):
        ```bash
        npm install
        ```
    3.  Start Local Server:
        ```bash
        npm run dev
        ```
    4.  Open the localhost link (e.g., `http://localhost:5173`)
    5.  **Important**: Open the "Settings" (sidebar) and toggle **"Use Mock Agent"** to ON.

### Option B: Backend Simulation Mode (Logic Testing)
If you want to test the **Real Agent (Reasoning Engine)** but skip the data infrastructure (BigQuery/Search).
*   **What it does**: The Agent runs on Vertex AI, but the Tools (`scct-tools`) return mock data instead of hitting databases.
*   **Requirements**:
    *   ✅ GCP Project
    *   ✅ Tools Service (Cloud Run)
    *   ✅ Agent (Vertex AI)
    *   ❌ No BigQuery or Vertex Search required.
*   **How to Enable**:
    You must modify the `controltower/agent.py` file **before deploying the agent** to inject the simulation header.

    **Step 1**: Open `controltower/agent.py`.
    **Step 2**: Locate the `get_auth_headers` function.
    **Step 3**: Add the header as shown below:
    ```python
    def get_auth_headers(audience: str) -> dict:
        # ... existing auth logic ...
        headers = {"Authorization": f"Bearer {token}"}
        
        # ADD THIS LINE FOR SIMULATION:
        headers["X-Simulation-Mode"] = "true" 
        
        return headers
    ```
    **Step 4**: Deploy the agent as usual.


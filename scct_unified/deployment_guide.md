# Deploying SCCT Unified to Cloud Run

This guide details how to package and deploy the Unified Supply Chain Control Tower (frontend + backend) to Google Cloud Run.

## Prerequisites

1.  **Google Cloud Project**: You need a GCP project with billing enabled.
2.  **gcloud CLI**: Installed and authenticated (`gcloud auth login`).
3.  **Permissions**: Your user/service account needs `run.admin`, `storage.admin` (for build logs), and `serviceusage.services.use`.

## Deployment Scenarios

### Option A: Using the Script (Recommended)

We have provided a script `deploy_cloudrun.sh` that automates the process.

1.  Open your terminal in `scct_unified/`.
2.  Make the script executable:
    ```bash
    chmod +x deploy_cloudrun.sh
    ```
3.  Run the script:
    ```bash
    ./deploy_cloudrun.sh
    ```
    *   It will ask for your **Project ID** (detects current active one).
    *   It will ask for the **Agent ID** (Resource Name). Press Enter to use the default configured ID.

### Option B: Manual Command

If you prefer to run the command manually:

```bash
gcloud run deploy scct-unified \
  --source . \
  --region us-central1 \
  --project YOUR_PROJECT_ID \
  --set-env-vars "PROJECT_ID=YOUR_PROJECT_ID,LOCATION=us-central1,AGENT_ID=YOUR_AGENT_ID"
```
> **Note**: This deploys as a private service. Secure it with Cloud Load Balancing or IAM.

## What Happens During Deployment?

1.  **Cloud Build**: The local code is uploaded to Google Cloud Build.
2.  **Dockerfile Execution**:
    *   **Stage 1 (Frontend)**: Node.js container builds the Vite React app. It outputs static files to `/app/backend/static`.
    *   **Stage 2 (Backend)**: Python container installs Flask and dependencies. It copies the built static files from Stage 1.
3.  **Cloud Run**: The final image is deployed as a serverless container.
    *   The Flask app serves `index.html` for all routes (SPA behavior).
    *   It proxies API requests or handles them directly if defined.

## Troubleshooting

*   **Missing Logos/Assets**: We fixed a bug in the `Dockerfile` where `ui/public` wasn't being copied. Ensure your `Dockerfile` has `COPY ui/public/ ./public/` uncommented.
*   **Permissions**: If deployment fails with 403, ensure Cloud Build API (`cloudbuild.googleapis.com`) and Cloud Run API (`run.googleapis.com`) are enabled.
    ```bash
    gcloud services enable cloudbuild.googleapis.com run.googleapis.com
    ```

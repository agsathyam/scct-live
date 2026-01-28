# Supply Chain Control Tower (SCCT) Agent 🚀

An autonomous AI agent for supply chain management, capable of handling shipment exceptions, updating ETAs, requesting reshipments, and escalating issues to humans. Built with Google Cloud Vertex AI (Reasoning Engine) and Gemini 2.0.

## 🌟 Features
- **Intelligent Reasoning**: Uses Gemini 2.0 Pro to analyze complex supply chain events.
- **Tool Use**: Can autonomously update ETAs, request reshipments, and search knowledge bases.
- **Human-in-the-Loop**: Escalates to human operators when confidence is low or risk is high.
- **Unified Dashboard**: React-based Control Tower UI for monitoring agent actions.

## 🛠️ Prerequisites
- Google Cloud Project with billing enabled.
- API Services Enabled:
    - Vertex AI API
    - Cloud Run API
    - Cloud Build API
- Python 3.10+
- Node.js 18+
- `gcloud` CLI installed and authenticated.

## 🚀 Getting Started

### 1. Clone & Setup
```bash
git clone https://github.com/[YOUR_USERNAME]/scct-live.git
cd scct-live
```

### 2. Environment Configuration
**Do not commit real secrets!** use the provided templates.

#### Backend & Control Tower
Create a `.env` file in `controltower/`:
```bash
cp controltower/.env.template controltower/.env
```
Edit `controltower/.env`:
```ini
PROJECT_ID=your-gcp-project-id
LOCATION=us-central1
AGENT_ID=projects/YOUR_PROJECT/locations/us-central1/reasoningEngines/YOUR_AGENT_ID
BASE_URL=https://your-cloud-run-service-url.run.app
```

#### Frontend (UI)
Create a `.env` file in `scct_unified/ui/`:
```bash
cp scct_unified/ui/.env.template scct_unified/ui/.env
```
Edit `scct_unified/ui/.env`:
```ini
VITE_GEMINI_API_KEY=your-api-key-here (Optional: For simulated mode)
VITE_UseMockAgent=false
```

### 3. Deploying the Agent
Run the deployment script to deploy the reasoning engine to Vertex AI:
```bash
cd controltower
python deploy.py
```
*Note the `AGENT_ID` output at the end! Check `controltower/.env` and update it.*

### 4. Deploying the Application (UI + API)
Deploy the unified container to Cloud Run:
```bash
cd scct_unified
./deploy.sh
```

## 🧪 Testing Locally
You can test the agent logic without full deployment using the test scripts:

```bash
cd controltower
python newtest.py
```

## 🔒 Security Note
This repository uses `.gitignore` to exclude all environment files. **Never commit `.env` files or hardcoded credentials.**


# Copyright 2026 Sathya Narayanan Annamalai Geetha
# Licensed under the MIT License.

import os
import vertexai
import requests
import google.auth.transport.requests  # <--- NEW
from google.oauth2 import id_token     # <--- NEW
from google.adk.agents import LlmAgent
from google.adk.tools.api_registry import ApiRegistry
from vertexai.preview.reasoning_engines import AdkApp

# 0. Set environment variables
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.environ.get("PROJECT_ID")
LOCATION = os.environ.get("LOCATION")
BASE_URL = os.environ.get("BASE_URL")
AGENT_MODEL = os.environ.get("AGENT_MODEL", "gemini-2.5-pro")
AGENT_NAME = os.environ.get("AGENT_NAME", "supply_chain_control_tower_agent")

# ---------------------------------------------------------
# NEW HELPER FUNCTION TO GENERATE IDENTITY TOKENS
# ---------------------------------------------------------
def get_auth_headers(audience: str) -> dict:  # <--- NEW
    """
    Generates an OIDC Identity Token for secure Cloud Run invocation.
    Required for Service-to-Service authentication in Google Cloud.
    """
    try:
        auth_req = google.auth.transport.requests.Request()  # <--- NEW
        token = id_token.fetch_id_token(auth_req, audience)  # <--- NEW
        return {"Authorization": f"Bearer {token}"}          # <--- NEW
    except Exception as e:
        print(f"Warning: Could not fetch token: {e}")
        return {}
# ---------------------------------------------------------

def session_service_builder():
    """Create a Vertex AI session service for cloud deployment."""
    from google.adk.sessions import VertexAiSessionService
    return VertexAiSessionService(project=PROJECT_ID, location=LOCATION)


# --- TOOL 1: Search Knowledge Base ---
def search_knowledge_base(query: str):
    """Searches the internal knowledge base for policies, procedures, and SLAs.

    Use this tool when the user asks questions about shipping policies, 
    contract terms, standard operating procedures (SOPs), or service level agreements.

    Args:
        query: The search string (e.g., "Tech Giant delay penalty" or "Vaccine handling SOP").
        
    Returns:
        dict: {"status": "success", "results": [{"title":..., "content":...}]}
    """
    headers = get_auth_headers(BASE_URL)
    response = requests.post(f"{BASE_URL}/search", json={"query": query}, headers=headers)
    response.raise_for_status()
    return response.json()

# --- TOOL 2: Historical Event Analysis ---
def get_similar_events(event_type: str, limit: int = 5):
    """Retrieves similar past supply chain events to aid in decision-making.

    Use this tool to find precedents. For example, if a shipment is late due to 
    weather, check what actions were taken in previous "LATE_SHIPMENT" events.

    Args:
        event_type: The category of the event (e.g., "LATE_SHIPMENT", "WEATHER_DELAY").
                    Do NOT pass a specific ID here.
        limit: Random number between 2 and 5.
        
    Returns:
        dict: {"status": "success", "results": [{"action":..., "outcome":...}]}
    """
    headers = get_auth_headers(BASE_URL)
    response = requests.post(
        f"{BASE_URL}/get_similar_events", 
        json={"event_type": event_type, "limit": limit}, 
        headers=headers
    )
    response.raise_for_status()
    return response.json()

# --- TOOL 3: Update ETA ---
def update_shipment_eta(
    shipment_id: str, 
    new_eta: str, 
    reason: str, 
    reasoning: str = "",
    metadata: dict = None
):
    
    """Updates the Estimated Time of Arrival (ETA) for a specific shipment in the ERP system.

    Use this tool when you need to change a delivery date in the system.

    Args:
        shipment_id: The unique identifier of the shipment (e.g., "SHP-12345").
        new_eta: The new delivery date and time in ISO 8601 format (e.g., "2024-12-25T14:30:00Z").
        reason: The external-facing reason given to the customer for the delay (e.g., "Weather delay").
        reasoning: Your internal chain-of-thought explaining why this update is necessary.
        metadata: Any additional context as a dictionary.

    Returns:
        dict: Confirmation of the update.
    """
   
    headers = get_auth_headers(BASE_URL)
    payload = {
        "shipment_id": shipment_id, 
        "new_eta": new_eta, 
        "reason": reason, 
        "reasoning": reasoning, 
        "metadata": metadata or {}
    }
    response = requests.post(f"{BASE_URL}/update_eta", json=payload, headers=headers)
    response.raise_for_status()
    return response.json()

# --- TOOL 4: Request Reshipment ---
def request_reshipment(
    original_shipment_id: str, 
    priority: str, 
    reasoning: str = "",
    metadata: dict = None
):
    """Initiates a new shipment to replace a lost or damaged goods.

    Use this tool ONLY when a shipment is confirmed lost or irreparably damaged.

    Args:
        original_shipment_id: The ID of the failed shipment (e.g. "SHP-555").
        priority: MUST be 'STANDARD' or 'NFO' (Next Flight Out).
        reasoning: Justification for the cost. Internal explanation for why a reshipment was authorized.
        metadata: Additional details about the new order.

    Returns:
        dict: Details of the created reshipment request.
    """
    
    headers = get_auth_headers(BASE_URL)  # <--- NEW
    url = f"{BASE_URL}/request_reshipment"
    payload = {
        "original_shipment_id": original_shipment_id,
        "priority": priority,
        "reasoning": reasoning,
        "metadata": metadata or {}
    }
    response = requests.post(f"{BASE_URL}/request_reshipment", json=payload, headers=headers)
    response.raise_for_status()
    return response.json()

# --- TOOL 5: Escalate to Human ---
def escalate_to_human(
    shipment_id: str, 
    reason: str, 
    reasoning: str = "",
    metadata: dict = None
):
    """Escalates a complex issue to a human operator.

    Use this tool when you encounter a situation not covered by standard policies,
    or when the user specifically requests human intervention.

    Args:
        shipment_id: The ID of the shipment involved in the issue.
        reason: A brief summary of why escalation is needed.
        reasoning: Detailed explanation of the steps you took before deciding to escalate.
        metadata: Any relevant state or context to pass to the human agent.

    Returns:
        dict: Ticket ID and status of the escalation.
    """
    
    headers = get_auth_headers(BASE_URL)  # <--- NEW
    payload = {
        "shipment_id": shipment_id, 
        "reason": reason, 
        "reasoning": reasoning, 
        "metadata": metadata or {}
    }
    response = requests.post(f"{BASE_URL}/escalate_to_human", json=payload, headers=headers)
    response.raise_for_status()
    return response.json()

# --- TOOL 6: Get Dashboard Stats ---
def get_dashboard_stats(days: int = 7):
    """Retrieves high-level supply chain statistics for the dashboard.

    Use this tool when the user asks for a summary, overview, or general health check
    of the supply chain (e.g., "How are we doing this week?").

    Args:
        days: The lookback period in days. Defaults to 7.

    Returns:
        dict: Aggregated stats (e.g., on-time performance, total shipments).
    """
    
    headers = get_auth_headers(BASE_URL)  # <--- NEW
    response = requests.get(f"{BASE_URL}/dashboard/stats", params={"days": days}, headers=headers)
    response.raise_for_status()
    return response.json()

# 3. Create the Agent
# The model can be defined as a string (e.g., "gemini-2.5-pro")

# ... (Previous imports and tool definitions remain the same) ...

# --- INSTRUCTION DEFINITION ---
# We define this separately to keep the main Agent code clean and readable.
SYSTEM_INSTRUCTION = f"""
You are the **Autonomous Logistics Resolution Engine** (Level 2).
Your Project ID is: {PROJECT_ID}

### 🧠 YOUR PERSONA
*   **Role**: You are a Transparent Supply Chain Auditor. You value "Showing Your Work" above all else.
*   **Tone**: Analytical, precise, and data-heavy.
*   **Goal**: Solve the problem, but ALWAYS prove your solution with raw data evidence first.

### 🔄 UNIVERSAL EXECUTION LOOP (MANDATORY)
For EVERY event (Retail, Pharma, Auto, etc.), "Action -> Evidence -> Analysis" pattern and you MUST follow this 5-step strict workflow:

**STEP 1: INTENT & ANALYSIS**
*   Start by stating clearly: "I am analyzing the [Event Type] for [Customer] ([Tier])..."

**STEP 2: INTELLIGENCE RETRIEVAL (Search)**
*   **Action**: Call `search_knowledge_base` with a targeted query that **MUST include the Customer Name** (e.g., "[Customer Name] [Event Type] SOP").
*   * **Output Requirement**: Iterate through **ALL** results returned by the tool. Create a bullet point for every single document found.
*   * **Formatting**: Insert a BLANK LINE between each bullet point.
        * *Required Output Format*: 
            "🕵️ **Intelligence Retrieval**: I am scanning our knowledge base to check for policies that govern this specific exception...
            > **Knowledge Base Results**:

            > 📚 **[title]**: [Exact Quote or Key Rule found in text]

            > 📚 **[title]**: [Exact Quote or Key Rule found in text]

**STEP 3: PATTERN RECOGNITION (History)**
*   **Action**: Call `get_similar_events` to find precedents.
*   * **Output Requirement**: Iterate through **ALL** events returned by the tool. Do not summarize or group them.
*   * **Formatting**: Insert a BLANK LINE between each bullet point.
    *   *Output Format*: 
            "🧠 **Pattern Recognition**: Analyzing past similar cases now find a best path...
            > **Historical Precedents**:
            
            > ⛁ **[Event ID]**: Action: [Action Taken] -> Outcome: [Outcome]

            > ⛁ **[Event ID]**: Action: [Action Taken] -> Outcome: [Outcome]

            > ⛁ **[Event ID]**: Action: [Action Taken] -> Outcome: [Outcome]"

**STEP 4: SYNTHESIS & DECISION**
*   Synthesize the SOP rules and Historical precedents.
*   *Output*: "Based on the strict requirements of **[SOP-ID]** and the precedent set by **[Event-ID]**, I have determined the optimal course of action."

**STEP 5: EXECUTION & SUMMARY**
*   **Action**: Call the appropriate tool (`update_shipment_eta`, `request_reshipment`, or `escalate_to_human`).
*   **FINAL OUTPUT**: You MUST end with a structured summary block:
    *   "**Reasoning Summary**: I chose to [Action] because [Reason 1], [Reason 2]."

### 📋 SCENARIO GUIDANCE (Context Graph) - 5 VERTICALS
You MUST classify the event into one of these 5 verticals and apply the specific logic:

**1. RETAIL & GROCERY (High Volume / Perishable)**
*   **Keywords**: FreshMarket, Global Mart, Food, Perishables.
*   **Unique Risk**: Spoilage, Shelf Life.
*   **Logic**:
    *   **Non-Perishable**: Update ETA.
    *   **Perishable (Food)**: If Temp Excursion or Delay > Shelf Life -> **Reship Immediately** (Spoiled). Do NOT just update ETA.
    *   **Search Context**: Query MUST include "Retail" or "Food Safety".

**2. HIGH TECH & ELECTRONICS (High Value)**
*   **Keywords**: TechGiant, NVIDIA, Apple, GPU, Server.
*   **Unique Risk**: Theft, Security, Obsolescence.
*   **Logic**:
    *   **High Value (> $50k)**: Any delay/route deviation requires **Escalate to Security**.
    *   **Standard**: Update ETA if secure.
    *   **Search Context**: Query MUST include "High Tech" or "Security".

**3. PHARMA & HEALTHCARE (GxP / Critical)**
*   **Keywords**: HealthPlus, MediLife, Vaccine, Insulin.
*   **Unique Risk**: Patient Safety, GDP (Good Distribution Practice), Adulteration.
*   **Logic**:
    *   **Temperature Excursion**: Strict > 2°C deviation often means **Total Loss**. Reship Immediately.
    *   **Documentation**: Must cite specific "GDP" or "Cold Chain" SOPs.
    *   **Search Context**: Query MUST include "Pharma" or "GDP".

**4. AUTOMOTIVE & MANUFACTURING (JIT)**
*   **Keywords**: Detroit Motors, Tesla, Ford, Brake, Engine.
*   **Unique Risk**: "Line Down" (Factory Stoppage).
*   **Logic**:
    *   **Critical Shortage**: If factory buffer < 4h -> **Escalate to Human** (Need Air Charter/NFO).
    *   **Standard**: Update ETA.
    *   **Search Context**: Query MUST include "Automotive" or "JIT".

**5. GENERAL LOGISTICS (Default)**
*   **Keywords**: Office Supplies, Furniture, Clothing.
*   **Logic**: Standard SLA. Cost Benefit Analysis (Reship vs Refund).

### 🚨 CRITICAL RULES
1.  **MANDATORY SEARCH FORMAT**: Your `search_knowledge_base` query **MUST** look like this:
    *   `"[Customer Name] [Vertical] [Event Type] SOP"`
    *   *Example*: "FreshMarket Retail Inventory Shortage SOP"
    *   *Example*: "HealthPlus Pharma Cold Chain SOP"
2.  **CONFIDENCE & CITATION**: You must explicitly cite the Document Title/ID found.
3.  **DOUBLE SPACING**: Always insert a blank line between bullet points.
4.  **COMPLETENESS**: If the tool returns 5 events, you must list all 5. Do not truncate.
5.  **AUTO-LOGGING**: pass `metadata={{'event_id': '...', 'customer_tier': '...', 'confidence': 0.xx}}` in all tool calls.
    *   **Confidence Calculation**: 
        *   1.0 = Perfect SOP match + Historic Precedent.
        *   0.8 = SOP match but no History.
        *   0.5 = Heuristic guess (No clean match).
"""

# --- AGENT INITIALIZATION ---
# 1. Create the Agent instance first
# We assign this to a variable so we can use it for both ADK Web and Vertex AI
my_agent = LlmAgent(
    model=AGENT_MODEL,
    name=AGENT_NAME,
    instruction=SYSTEM_INSTRUCTION, 
    tools=[
        search_knowledge_base,
        get_similar_events,
        update_shipment_eta,
        request_reshipment,
        escalate_to_human,
        get_dashboard_stats
    ],
)

# 2. Expose the root_agent for ADK Web (REQUIRED)
# adk web looks specifically for this variable name
root_agent = my_agent

# 3. Create the AdkApp wrapper for Vertex AI Deployment
# We pass the 'my_agent' object we created above
agent_app = AdkApp(
    agent=my_agent,
    session_service_builder=session_service_builder
)
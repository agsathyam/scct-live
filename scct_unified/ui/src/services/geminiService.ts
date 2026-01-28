import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";
import { ExceptionEvent, AgentDecision, VertexAgentConfig, ExceptionStatus } from '../types';
import { KNOWLEDGE_BASE_DOCS, MOCK_EVENTS, GEMINI_CONFIG } from '../constants';
import { SimulatedDoc } from './documentGenerator';
import { getAuthToken } from './authService';

// Initialize Gemini Client safely
let ai: GoogleGenAI;
let effectiveApiKey = import.meta.env.VITE_GEMINI_API_KEY || 'mock-key';

try {
  ai = new GoogleGenAI({ apiKey: effectiveApiKey });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
  effectiveApiKey = '';
  ai = new GoogleGenAI({ apiKey: '' });
}

// --- 1. Tool Definitions (For Simulation Only) ---
const updateEtaTool: FunctionDeclaration = {
  name: 'update_shipment_eta',
  description: 'Update the estimated delivery date in the Transportation Management System (TMS).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      shipment_id: { type: Type.STRING },
      new_eta: { type: Type.STRING },
      reason: { type: Type.STRING },
      reasoning: { type: Type.STRING },
      metadata: { type: Type.OBJECT }
    },
    required: ['shipment_id', 'new_eta', 'reason']
  }
};

const requestReshipmentTool: FunctionDeclaration = {
  name: 'request_reshipment',
  description: 'Trigger a new order workflow for lost or damaged goods.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      original_shipment_id: { type: Type.STRING },
      priority: { type: Type.STRING, enum: ['STANDARD', 'NFO'] },
      reasoning: { type: Type.STRING },
      metadata: { type: Type.OBJECT }
    },
    required: ['original_shipment_id', 'priority']
  }
};

const escalateToHumanTool: FunctionDeclaration = {
  name: 'escalate_to_human',
  description: 'Flag this exception for manual human review.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      shipment_id: { type: Type.STRING },
      reason: { type: Type.STRING },
      reasoning: { type: Type.STRING },
      metadata: { type: Type.OBJECT }
    },
    required: ['shipment_id', 'reason']
  }
};

const getSimilarEventsTool: FunctionDeclaration = {
  name: 'get_similar_events',
  description: 'Retrieves similar past supply chain events.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      event_type: { type: Type.STRING },
      limit: { type: Type.INTEGER }
    },
    required: ['event_type']
  }
}

const tools: Tool[] = [{
  functionDeclarations: [updateEtaTool, requestReshipmentTool, escalateToHumanTool, getSimilarEventsTool]
}];

// --- 2. Retrieval & Simulation Helpers ---

export interface RetrievedDoc {
  id: string;
  title: string;
  content: string;
  score: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const simulateVertexAISearch = (query: string, availableDocs: SimulatedDoc[] = []): RetrievedDoc[] => {
  const sourceDocs = availableDocs.length > 0 ? availableDocs : KNOWLEDGE_BASE_DOCS;
  const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
  return sourceDocs.map(doc => {
    let score = 0.1;
    const docText = (doc.title + doc.content).toLowerCase();
    keywords.forEach(word => { if (docText.includes(word)) score += 0.2; });
    if (docText.includes('vip') && query.toLowerCase().includes('vip')) score += 0.3;
    return { ...doc, score: Math.min(score, 0.99) };
  }).filter(d => d.score > 0.3).sort((a, b) => b.score - a.score).slice(0, 3);
};

// --- 3. Main Resolution Function ---

export interface ResolutionResult {
  decision: AgentDecision;
  logs: string[];
  retrievedDocs: RetrievedDoc[];
}

const SYSTEM_INSTRUCTION = `
You are the **Autonomous Logistics Resolution Engine** (Level 2).
Voice: Active, First-Person, Professional. e.g. "I am scanning the Knowledge Base..."
Goal: Solve the problem autonomously using the Standard 5-Step Protocol:
1. Intent ("I am analyzing...")
2. Intellience Retrieval (Search KB & Cite SOPs)
3. Pattern Recognition (Check History)
4. Synthesis ("Based on SOP [ID]...")
5. Execution (Update ETA / Reship / Escalate)
`;

const formatToolName = (name: string): string => {
  return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

/**
 * Calls the REAL Vertex AI Agent (Reasoning Engine) via Streaming (Unified Backend)
 */
export const runConnectedAgent = async (
  input: string | ExceptionEvent,
  config: VertexAgentConfig,
  onLog?: (msg: string) => void
): Promise<ResolutionResult> => {
  // Convert input to string if it's an event object
  const textInput = typeof input === 'string' ? input : `
      Handle this Supply Chain Exception:
      Event ID: ${input.id}
      Customer: ${input.customer.name} (${input.customer.tier})
      Event Type: ${input.type}
      Description: ${input.description}
      Event Data: ${JSON.stringify(input)}
    `;

  // --- UNIFIED PROXY CONNECTION ---
  // FIREBASE HOSTING REWRITES BUFFER RESPONSES!
  // We must connect DIRECTLY to Cloud Run (Unified) for SSE to work.
  // In Dev, we use Vite proxy. In Prod, we hit the absolute URL.
  // --- UNIFIED ARCHITECTURE CONNECTION ---
  // The UI is served by the same Backend (Flask) that handles streaming.
  // We always use the relative path, which is robust and avoids CORS/Buffering.
  const endpoint = "/stream";

  if (onLog) {
    onLog(`✨ **Autonomous Agent Activated.** analyzing incident context and formulating resolution strategy...`);
  }

  // Simplified Payload for Unified Backend
  const payload = {
    query: textInput,
    user_id: `ui-user-${Date.now()}`
  };

  // Get Auth Token
  const token = await getAuthToken();

  try {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      // Explicitly log error to UI if possible
      if (onLog) onLog(`❌ API Error: ${response.status} ${errText}`);
      throw new Error(`Vertex API Error (${response.status}): ${errText}`);
    }

    // Connection established. Reading stream...

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    let streamBuffer = ""; // Buffer for split lines across chunks
    let action = "AGENT_ACTION";
    let toolUsed = undefined;
    let fullReasoning = "";
    let lastToolResult: any = undefined;
    let confidence = 0.95; // Default if not provided by Agent

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();

        // Process any final data in buffer on done
        if (done) {
          if (streamBuffer.trim()) {
            // Process the last line if it exists (though usually SSE ends with double newline)
            // We can just append it to a synthetic chunk to reuse processing logic or handle here.
            // For simplicity, let's treat it as one last line
            // But usually 'done' implies no more data.
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        // console.log("RAW CHUNK:", chunk); // Browser Console Debug

        // RELAXED PARSING: Handle both SSE ("data: ...") and Raw NDJSON
        // BUFFERING FIX: Append chunk to buffer, then split by newline
        streamBuffer += chunk;

        const lines = streamBuffer.split('\n');
        // The last element is potentially incomplete (no newline at end of chunk)
        // We keep it in the buffer and process only the complete lines
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          let jsonStr = trimmedLine;
          if (trimmedLine.startsWith('data: ')) {
            jsonStr = trimmedLine.substring(6).trim();
          }

          try {
            const data = JSON.parse(jsonStr);

            // Parse Candidates (REST API) or Direct Content (Python SDK)
            // Python SDK chunk.to_dict() returns { content: { parts: [...] } }
            // RAW REST API returns { candidates: [ { content: { parts: [...] } } ] }
            let parts = [];

            if (data.content && data.content.parts) {
              parts = data.content.parts;
            } else if (data.candidates && data.candidates[0] && data.candidates[0].content) {
              parts = data.candidates[0].content.parts || [];
            }

            // Buffer for accumulating text chunks before logging line-by-line
            let textBuffer = "";
            // Track last logged tool response to avoid stream stuttering/duplication
            let lastLogSignature = "";

            for (const part of parts) {
              // --- 1. HANDLE REASONING TEXT ---
              if (part.text) {
                fullReasoning += part.text;
                textBuffer += part.text;

                if (textBuffer.includes('\n')) {
                  const localLines = textBuffer.split('\n');
                  for (let i = 0; i < localLines.length - 1; i++) {
                    const line = localLines[i].trim();
                    // Capture explicit confidence tags from text stream if present
                    const confMatch = line.match(/Confidence:\s*(0\.\d+)/i);
                    if (confMatch) {
                      // We don't have a place to store this in 'decision' yet until the loop ends,
                      // but we can log it or store it in a scoped variable if we wanted to be fancy.
                      // For now, let's just log it. 
                      if (onLog) onLog(`[CONFIDENCE_DETECTED] ${confMatch[1]}`);
                    }

                    if (line && onLog) {
                      // Log RAW for Dev Mode
                      onLog(`[RAW] ${line}`);

                      // Humanized Logging
                      if (line.includes('Reasoning Summary')) {
                        onLog(`[REASONING_HEADER] ${line.replace(/\*\*/g, '').replace('Reasoning Summary:', 'Reasoning Summary')}`);
                      } else if (line.match(/^\d+\.\s/)) {
                        onLog(`[REASONING_ITEM] ${line}`);
                      } else if (line.trim().length > 0 && !line.match(/^[^\w\s]/)) {
                        onLog(`🗣️ ${line}`);
                      } else if (line.trim().length > 0) {
                        onLog(`${line}`); // clean, no prefix (likely emoji start)
                      }
                    }
                  }
                  textBuffer = localLines[localLines.length - 1];
                }
              }

              // --- 2. HANDLE TOOL CALLS (Agent Intent) ---
              const fc = part.functionCall || part.function_call;
              if (fc) {
                action = fc.name;
                toolUsed = fc.name;

                let narrative = "";
                // Log RAW for Dev Mode
                if (onLog) {
                  onLog(`[RAW] Tool Call: ${JSON.stringify(fc)}`);
                }

                if (fc.name === 'search_knowledge_base') {
                  narrative = `🕵️‍♂️ **Now checking our knowledge base for policy documents, SOP and SLAs**`;
                } else if (fc.name === 'get_similar_events') {
                  narrative = `🕰️ **Querying the ERP backend for similar events and resolution patterns**`;
                } else if (fc.name === 'update_shipment_eta') {
                  narrative = `⚡ **Updating ETA:** ${fc.args.new_eta} (Reason: ${fc.args.reason})`;
                } else if (fc.name === 'request_reshipment') {
                  const custName = (typeof input !== 'string' && input.customer?.name) ? input.customer.name : "the customer";
                  narrative = `📦 **Based on the SOP and historical precedent, I am now requesting a reshipment for ${custName}, which seems to be the most effective option**`;
                } else if (fc.name === 'escalate_to_human') {
                  narrative = `👮 **Escalating:** ${fc.args.reason}`;
                } else {
                  narrative = `⚙️ **Exec:** ${formatToolName(fc.name)}`;
                }

                // Capture Confidence from Metadata
                if (fc.args && fc.args.metadata && fc.args.metadata.confidence) {
                  confidence = fc.args.metadata.confidence;
                }

                if (onLog) onLog(narrative);
              }

              // --- 3. HANDLE TOOL RESULTS (Backend Data) ---
              if (part.function_response) {
                const fr = part.function_response;
                const sig = JSON.stringify(fr.response); // simple dedup signature

                // Capture result for final decision
                if (fr.name !== 'search_knowledge_base' && fr.name !== 'get_similar_events') {
                  lastToolResult = fr.response;
                }

                // Log RAW for Dev Mode
                if (onLog) onLog(`[RAW] Tool Result: ${JSON.stringify(fr)}`);

                // If we just logged this exact response, skip it (stream artifact?)
                if (sig !== lastLogSignature) {
                  lastLogSignature = sig;

                  // SEARCH RESULTS
                  if (fr.name === 'search_knowledge_base' && fr.response?.results) {
                    let results = fr.response.results;



                    if (results.length > 0 && onLog) {
                      // Send structured event for rich UI rendering (with hyperlinks)
                      onLog(`[RETRIEVAL_EVENT] ${JSON.stringify(results)}`);
                    }
                  }
                  // HISTORY RESULTS
                  else if (fr.name === 'get_similar_events') {
                    let results = fr.response?.results || [];

                    // Normalize keys (Backend returns "event id" with space)
                    results = results.map((r: any) => ({
                      ...r,
                      id: r['event id'] || r.event_id || r.id || 'EVT-???',
                      action: r.action || r.action_name || 'Unknown Action'
                    }));

                    if (results.length > 0 && onLog) {
                      onLog(`[HISTORY_EVENT] ${JSON.stringify(results)}`);
                    }
                  }
                }
              }
            }

            // --- LOOP MESSAGE HANDLING ---
            // If the loop finishes (stream done), we might have residual text in buffer
            // We usually handle this outside the loop or just let it be attached to final reasoning.

          } catch (e) {
            // Only log genuine parsing errors if it looked like JSON
            if (trimmedLine.startsWith('{') || trimmedLine.startsWith('data: ')) {
              console.warn('Stream parse error:', e);
            }
          }
        }
      }

      // Heuristic fallback if no tool used
      if (!toolUsed) {
        if (fullReasoning.includes("shipment_eta")) { action = "update_shipment_eta"; toolUsed = "update_shipment_eta"; }
        else if (fullReasoning.includes("reshipment")) { action = "request_reshipment"; toolUsed = "request_reshipment"; }
        else if (fullReasoning.includes("escalate")) { action = "escalate_to_human"; toolUsed = "escalate_to_human"; }
      }

      return {
        decision: {
          action: action,
          reasoning: fullReasoning || "Agent completed without reasoning.",
          confidence: confidence,
          toolUsed: toolUsed,
          toolResult: lastToolResult,
          costImpact: 0
        },
        logs: [], // Logs handled via callback
        retrievedDocs: []
      };
    } else {
      // If reader is null, it means response.body was null.
      // This is an unexpected state for a successful response, so we should throw.
      throw new Error("Failed to get readable stream from response body.");
    }
  } catch (error: any) {
    throw error;
  }
};

/**
 * Runs the Mock/Simulation Logic (Browser-only, no real agent)
 */
export const runSimulatedAgent = async (
  event: ExceptionEvent,
  onLog?: (msg: string) => void,
  knowledgeBase: SimulatedDoc[] = []
): Promise<ResolutionResult> => {
  const resultLogs: string[] = [];
  const addLog = (msg: string) => {
    if (onLog) onLog(msg);
    resultLogs.push(msg);
  };

  try {
    // Step 1: Ingestion
    addLog(`✨ New Event detected: ${event.id} [${event.type}]`);
    await sleep(600);
    addLog(`🤖 Allocating to "Logistics-Resolver-v2" runtime...`);
    await sleep(800);

    // Step 2: Retrieval (SOPs & Contracts)
    addLog(`🔍 Scanning Knowledge Base for Standard Operating Procedures...`);
    await sleep(800);

    // Simulate RAG
    const searchQuery = `${event.type} ${event.description} ${event.customer.name}`;
    let relevantDocs = simulateVertexAISearch(searchQuery, knowledgeBase);

    // Force include contract if exists
    if (event.contractId) {
      // Check in dynamic KB first
      let contractDoc = knowledgeBase.find(d => d.id === event.contractId);
      // Fallback to static if not found (or should we strictly use dynamic?)
      if (!contractDoc) contractDoc = KNOWLEDGE_BASE_DOCS.find(d => d.id === event.contractId) as unknown as SimulatedDoc;

      if (contractDoc) {
        relevantDocs.unshift({ ...contractDoc, score: 0.99 });
        addLog(`📜 Found Master Service Agreement: ${contractDoc.id}`);
        await sleep(500);
      }
    }

    // Log specific docs read
    relevantDocs.slice(0, 3).forEach(doc => {
      if (doc.id !== event.contractId) {
        addLog(`📖 Reading: ${doc.title} (${(doc.score * 100).toFixed(0)}% relevance)`);
      }
    });

    await sleep(600);

    // Step 3: Pattern Matching (Similar Events)
    addLog(`📊 Querying Data Lake for historical precedents...`);
    await sleep(1000);
    const similarEvents = MOCK_EVENTS.filter(e => e.type === event.type && e.id !== event.id).slice(0, 2);

    if (similarEvents.length > 0) {
      addLog(`✅ Found ${similarEvents.length} similar past cases. Analyzing resolution patterns...`);
      similarEvents.forEach(e => {
        addLog(`   ↳ Linked Case ${e.id}: ${e.type} (Resolved)`);
      });
    } else {
      addLog(`ℹ️ No direct historical matches found. Relying on First Principles.`);
    }
    await sleep(600);

    // Step 4: SLA & Risk Analysis
    addLog(`⚖️ Evaluating Customer Tier (${event.customer.tier}) against SLA...`);
    await sleep(800);
    if (event.customer.tier === 'VIP') {
      addLog(`🚨 VIP CUSTOMER DETECTED. Activitating Priority Protocols.`);
    }

    // Step 5: Construction of Prompt
    const contextString = relevantDocs.map(d => `[DOC ${d.id}] ${d.title}: ${d.content}`).join('\n');
    const historyString = similarEvents.map(e => `[PAST EVENT ${e.id}] ${e.description} -> Resolved`).join('\n');

    const prompt = `
      CURRENT EXCEPTION EVENT:
      ${JSON.stringify(event, null, 2)}

      RETRIEVED KNOWLEDGE (SOPs & CONTRACTS):
      ${contextString}

      SIMILAR HISTORICAL EVENTS:
      ${historyString}

      TASK:
      Analyze the situation and execute the ONE most appropriate tool.
      Provide a concise reasoning summary.
    `;

    addLog(`🧠 Deep Reasoning in progress...`);

    // Call Gemini (Simulation, NOT Agent Engine)
    let textParts = "Analysis complete. Recommendation based on standard protocols.";
    let toolCalls: any[] | undefined = [];

    try {
      if (effectiveApiKey === 'mock-key' || !effectiveApiKey) throw new Error("Mock Key - Skipping API");

      const result = await ai.models.generateContent({
        model: GEMINI_CONFIG.modelId,
        contents: prompt,
        config: {
          tools: tools,
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.1
        }
      });

      const response = result.candidates?.[0];
      toolCalls = response?.content?.parts?.filter(p => p.functionCall);
      textParts = response?.content?.parts?.filter(p => p.text).map(p => p.text).join('') || "";
    } catch (e) {
      addLog(`⚠️ Offline Mode / API Limit: Generating heuristic response...`);
      // Fallback Logic
      await sleep(1000);
      switch (event.type) {
        case 'LATE_SHIPMENT':
          textParts = "Shipment is delayed. Checking carrier status shows congestion. SLA requires proactive notification. Recommending ETA update to keep customer informed per 'Standard Communications Protocol'.";
          toolCalls = [{ functionCall: { name: 'update_shipment_eta', args: { shipment_id: event.shipment.id, new_eta: '2024-10-25', reason: 'Carrier Delay' } } }];
          break;
        case 'DAMAGED_GOODS':
          textParts = "Goods reported damaged. Value exceeds threshold. Initiating immediate reshipment per 'VIP Claims Protocol' and 'Damaged Goods SOP'.";
          toolCalls = [{ functionCall: { name: 'request_reshipment', args: { original_shipment_id: event.shipment.id, priority: 'NFO' } } }];
          break;
        case 'INVENTORY_SHORTAGE':
          textParts = "Inventory discrepancy detected. Resolution Playbook for Shortages requires escalating to a Sourcing Manager to identify alternative suppliers. Automatic re-ordering is blocked for this value tier.";
          toolCalls = [{ functionCall: { name: 'escalate_to_human', args: { shipment_id: event.shipment.id, reason: 'Inventory Shortage requiring Sourcing Manager' } } }];
          break;
        case 'WEATHER_DELAY':
        case 'WEATHER_DISRUPTION':
          textParts = "Severe weather alert impacting route. 'Global Disruption Playbook' mandates manual route review and carrier negotiation. Escalating to logistics specialist.";
          toolCalls = [{ functionCall: { name: 'escalate_to_human', args: { shipment_id: event.shipment.id, reason: 'Weather Disruption - Route Review Required' } } }];
          break;
        default:
          textParts = `Analyzing exception parameters for ${event.type}. 'General Exception SOP' requires manual review for unclassified deviation types to ensure compliance.`;
          toolCalls = [{ functionCall: { name: 'escalate_to_human', args: { shipment_id: event.shipment.id, reason: 'Unclassified Exception - Manual Review' } } }];
      }
    }

    if (textParts) {
      addLog(`🤔 ${textParts}`);
    }

    let finalDecision: AgentDecision = {
      action: "MANUAL_REVIEW",
      reasoning: textParts,
      confidence: 0.65,
      costImpact: 0,
      toolUsed: undefined
    };

    if (toolCalls && toolCalls.length > 0) {
      const fc = toolCalls[0].functionCall;
      if (fc) {
        finalDecision = {
          action: fc.name,
          reasoning: textParts || `Determined ${fc.name} is the optimal resolution based on SOPs.`,
          toolUsed: fc.name,
          // Extract confidence from metadata if available, else default to 0.96
          confidence: fc.args.metadata?.confidence || 0.96,
          costImpact: 0
        };
        addLog(`🛠️ EXECUTION TRIGGERED: ${formatToolName(fc.name)}`);
        addLog(`   ↳ Args: ${JSON.stringify(fc.args)}`);
        addLog(`📤 Dispatching commands to external systems...`);
      }
    } else {
      addLog(`🤔 No tool selected. Requesting Manual Review.`);
    }

    return {
      decision: finalDecision,
      logs: resultLogs,
      retrievedDocs: relevantDocs
    };

  } catch (error: any) {
    addLog(`❌ Simulation Neural Core Error: ${error.message}`);
    return {
      decision: { action: "SYSTEM_FAILURE", reasoning: "Sim Failed", confidence: 0, costImpact: 0 },
      logs: resultLogs,
      retrievedDocs: []
    }
  }
}

// --- MAIN DISPATCHER ---
export const resolveExceptionWithAgent = async (
  event: ExceptionEvent,
  config?: VertexAgentConfig,
  onLog?: (msg: string) => void,
  knowledgeBase: SimulatedDoc[] = []
): Promise<ResolutionResult> => {

  // 1. Check if we should use the Real Agent
  const forceMock = import.meta.env.VITE_UseMockAgent === 'true';
  const useRealAgent = config?.useRealAgent && !forceMock;

  if (useRealAgent) {
    // --- CONNECTED MODE (Unified) ---
    // We pass the full event object to runConnectedAgent so it can filter logs based on metadata
    return await runConnectedAgent(event, config, onLog);
  } else {
    // --- SIMULATED MODE (Browser Mock) ---
    return await runSimulatedAgent(event, onLog, knowledgeBase);
  }
};

/**
 * Fetches Dashboard Stats from the Real Agent (via Unified Backend)
 */
export const fetchDashboardStatsFromAgent = async (
  config: VertexAgentConfig,
  onLog?: (msg: string) => void
): Promise<any[]> => {
  const endpoint = "/stream";

  // Magic query to trigger the stats tool
  const payload = {
    query: "get_dashboard_stats",
    user_id: `stats-fetcher-${Date.now()}`
  };

  if (onLog) onLog("📊 Fetching Live Stats from Agent...");

  // Get Auth Token to satisfy Backend/Cloud Run Security
  const token = await getAuthToken();

  try {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Stats fetch failed");

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let statsData = [];

    // Parse stream to find the function response
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const jsonStr = trimmed.startsWith('data: ') ? trimmed.substring(6) : trimmed;

          try {
            const data = JSON.parse(jsonStr);
            // Look for tool execution result in the stream
            // This depends on how server.py streams back the final answer or tool inputs
            // A simpler way for stats might be to have a dedicated endpoint, 
            // but we can reuse the agent stream for now if we parse carefully.

            // We are looking for 'function_response' from the server for 'get_dashboard_stats'
            let parts = [];
            if (data.content && data.content.parts) parts = data.content.parts;
            else if (data.candidates && data.candidates[0]?.content) parts = data.candidates[0].content.parts || [];

            for (const part of parts) {
              if (part.function_response && part.function_response.name === 'get_dashboard_stats') {
                statsData = part.function_response.response.stats || [];
              }
            }
          } catch (e) { /* ignore parse errors */ }
        }
      }
    }

    // Fallback/Mock if agent didn't return valid stats structure
    if (statsData.length === 0) {
      console.warn("Agent didn't return stats, using fallback.");
      return [
        { name: 'Mon', resolved: 10, manual: 5 },
        { name: 'Tue', resolved: 15, manual: 3 },
        { name: 'Wed', resolved: 20, manual: 4 },
        { name: 'Thu', resolved: 25, manual: 6 },
        { name: 'Fri', resolved: 30, manual: 2 },
      ];
    }
    return statsData;

  } catch (e) {
    console.error("Failed to fetch real stats:", e);
    return []; // Return empty or fallback
  }
};
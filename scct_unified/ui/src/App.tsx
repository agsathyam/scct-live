import React, { useState, useEffect } from 'react';
import { signInWithGoogle, checkAutoLogin, User } from './services/authService';
import './styles/theme.css'; // Import Premium Theme

// Components
import { MainLayout } from './components/layout/MainLayout';
import { ModernSidebar } from './components/layout/ModernSidebar';
import { Header } from './components/layout/Header';
import { EventFeed } from './components/dashboard/EventFeed';
import { AgentWorkspace } from './components/dashboard/AgentWorkspace';
import { ResolutionStats } from './components/dashboard/ResolutionStats';
import { EventDetailCard } from './components/dashboard/EventDetailCard';
import { AgentSettings } from './components/legacy/AgentSettings';
import { KnowledgeBase } from './components/legacy/KnowledgeBase';
import { ActionServices } from './components/legacy/ActionServices';
import { DataFactory } from './components/legacy/DataFactory';
import { HumanReviewQueue } from './components/legacy/HumanReviewQueue';
import { DemoSettings } from './components/settings/DemoSettings';

// Types & Services
import { MOCK_EVENTS, KNOWLEDGE_BASE_DOCS, GEMINI_CONFIG } from './constants';
import { ExceptionEvent, AgentDecision, ExceptionStatus, VertexAgentConfig, HumanTask, SuggestedAction } from './types';
import { resolveExceptionWithAgent, fetchDashboardStatsFromAgent } from './services/geminiService';
import { DemoProvider, useDemo } from './context/DemoContext';

// Mock chart data (Fallback)
const MOCK_CHART_DATA = [
    { name: 'Mon', resolved: 12, manual: 2 },
    { name: 'Tue', resolved: 19, manual: 1 },
    { name: 'Wed', resolved: 8, manual: 0 },
    { name: 'Thu', resolved: 15, manual: 3 },
    { name: 'Fri', resolved: 22, manual: 1 },
];

const InnerApp: React.FC = () => {
    // Access demo context
    const { customScenarios, industry, documents, brand } = useDemo();

    // State
    const [user, setUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<'DASHBOARD' | 'KNOWLEDGE_BASE' | 'DATA_FACTORY' | 'ACTION_SERVICES' | 'HUMAN_REVIEW' | 'SETTINGS'>('DASHBOARD');

    // Auth Initialization (Demo)
    useEffect(() => {
        const u = checkAutoLogin();
        if (u) setUser(u);
    }, []);

    const [events, setEvents] = useState<ExceptionEvent[]>(() => {
        // Randomize IDs on reload
        return MOCK_EVENTS.map(e => ({
            ...e,
            id: `EVT-${Math.floor(Math.random() * 9000) + 1000}`,
            shipment: {
                ...e.shipment,
                id: `SH-${Math.floor(Math.random() * 90000) + 10000}`
            }
        }));
    });
    const [humanTasks, setHumanTasks] = useState<HumanTask[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [decision, setDecision] = useState<AgentDecision | null>(null);
    const [chartData, setChartData] = useState(MOCK_CHART_DATA);
    const [isUsingRealStats, setIsUsingRealStats] = useState(false);
    const [totalCostSaved, setTotalCostSaved] = useState(142500);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Initialize Config
    const [agentConfig, setAgentConfig] = useState<VertexAgentConfig>(() => {
        const saved = localStorage.getItem('scct_agent_config');
        if (saved) return JSON.parse(saved);
        const envEndpoint = import.meta.env.VITE_VERTEX_AGENT_ENDPOINT || '';
        const match = envEndpoint.match(/projects\/([^/]+)\/locations\/([^/]+)\/reasoningEngines\/([^/:]+)/);
        return {
            useRealAgent: !import.meta.env.VITE_UseMockAgent,
            simulateTools: false,
            projectId: match?.[1] || '',
            locationId: match?.[2] || 'us-central1',
            agentId: match?.[3] || '',
            accessToken: ''
        };
    });

    const selectedEvent = events.find(e => e.id === selectedEventId);

    // Update events when custom scenarios change (Industry switch)
    useEffect(() => {
        if (industry !== 'DEFAULT' && customScenarios.length > 0) {
            setEvents(customScenarios);
            // Select first
            if (customScenarios[0]) setSelectedEventId(customScenarios[0].id);
        } else if (industry === 'DEFAULT') {
            // Reset to default
            setEvents(MOCK_EVENTS.map(e => ({
                ...e,
                id: `EVT-${Math.floor(Math.random() * 9000) + 1000}`,
                shipment: {
                    ...e.shipment,
                    id: `SH-${Math.floor(Math.random() * 90000) + 10000}`
                }
            })));
        }
    }, [customScenarios, industry]);

    // Reset state when event changes
    useEffect(() => {
        setDecision(null);
        setAgentLogs([]);
        setIsProcessing(false);
    }, [selectedEventId]);

    // Fetch Dashboard Stats
    useEffect(() => {
        const fetchStats = async () => {
            const useRealAgent = agentConfig.useRealAgent;
            if (useRealAgent) {
                try {
                    const realStats = await fetchDashboardStatsFromAgent(agentConfig);
                    if (realStats && realStats.length > 0) {
                        setChartData(realStats);
                        setIsUsingRealStats(true);
                        return;
                    }
                } catch (e) {
                    console.warn("Retrying with mock stats due to agent fetch error.");
                }
            }
            setChartData(MOCK_CHART_DATA);
            setIsUsingRealStats(false);
        };
        fetchStats();
    }, [agentConfig]);

    // Handlers
    const handleSimulateEvent = () => {
        const scenarios = [
            { type: 'LATE_SHIPMENT', descriptions: ['Carrier hub congestion in Memphis.', 'Missed connection at Rotterdam.'], items: ['Consumer Electronics', 'Office Furniture'], contractId: 'DOC-SLA-001', severity: 'MEDIUM' },
            { type: 'INVENTORY_SHORTAGE', descriptions: ['Stock discrepancy at Fulfillment Center.', 'Quality control failure.'], items: ['Wireless Headsets', 'Smart Watches'], contractId: 'DOC-OPS-202', severity: 'HIGH' },
            { type: 'DAMAGED_GOODS', descriptions: ['Temperature excursion detected > 8°C.', 'Shock sensor triggered > 50G.'], items: ['Vaccines', 'Insulin'], contractId: 'DOC-HAZ-441', severity: 'CRITICAL' },
            { type: 'WEATHER_DELAY', descriptions: ['Hurricane warning in delivery path.', 'Blizzard closing roads.'], items: ['MRI Parts', 'Surgical Robots'], contractId: 'DOC-SURGE-2023', severity: 'HIGH' }
        ];

        const MOCK_CUSTOMERS = [
            { id: 'C-FRESH', name: 'FreshMarket Inc', tier: 'VIP', contractValue: 1200000, logo: '/logos/freshmarket_v2.png' },
            { id: 'C-WM', name: 'Global Mart', tier: 'STANDARD', contractValue: 5000000, logo: '/logos/global_mart_v2.png' },
            { id: 'C-NVIDIA', name: 'TechGiant Corp', tier: 'VIP', contractValue: 85000000, logo: '/logos/techgiant_v2.png' },
            { id: 'C-DATAC', name: 'CloudData Systems', tier: 'VIP', contractValue: 15000000, logo: '/logos/clouddata_v2.png' },
            { id: 'C-MED', name: 'MediLife Pharma', tier: 'VIP', contractValue: 42000000, logo: '/logos/medilife_v2.png' },
            { id: 'C-CLIN', name: 'HealthPlus Systems', tier: 'STANDARD', contractValue: 2200000, logo: '/logos/healthplus_v2.png' },
            { id: 'C-OEM', name: 'Detroit Motors', tier: 'VIP', contractValue: 120000000, logo: '/logos/detroit_motors_v2.png' },
            { id: 'C-EV', name: 'Electric Mobility', tier: 'VIP', contractValue: 65000000, logo: '/logos/electric_mobility.png' }
        ];

        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        const description = scenario.descriptions[Math.floor(Math.random() * scenario.descriptions.length)];
        const randomCustomer = MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)];

        const newEvent: ExceptionEvent = {
            id: `EVT-${Date.now()}`,
            type: scenario.type as any, // Cast to any to generic match
            status: ExceptionStatus.NEW,
            severity: scenario.severity as any,
            timestamp: new Date().toISOString(),
            description: description,
            customer: randomCustomer,
            shipment: {
                id: `SH-${Math.floor(Math.random() * 9000) + 1000}`,
                origin: 'Austin, TX',
                destination: 'Chicago, IL',
                value: 45000,
                carrier: 'FastFreight',
                status: 'IN_TRANSIT',
                currentLocation: 'En Route',
                expectedDelivery: new Date().toISOString(),
                predictedDelivery: new Date().toISOString(),
                items: scenario.items
            },
            contractId: `CTR-${randomCustomer.id.split('-')[1]}-${new Date().getFullYear()}`
        };

        setEvents(prev => [newEvent, ...prev]);
        setSelectedEventId(newEvent.id);
    };

    // Helper to generate dynamic actions based on event context
    const getSuggestedActions = (event: ExceptionEvent): SuggestedAction[] => {
        switch (event.type) {
            case 'LATE_SHIPMENT':
                return [
                    { label: 'Authorize Expedite', cost: 450, impact: 'On-Time Delivery' },
                    { label: 'Refund Shipping', cost: 85, impact: 'Customer Satisfaction' },
                    { label: 'Ignore Alert', cost: 0, impact: 'Risk of Churn' }
                ];
            case 'INVENTORY_SHORTAGE':
                return [
                    { label: 'Source form Alternate DC', cost: 120, impact: 'Fulfilled' },
                    { label: 'Offer Substitution', cost: 0, impact: 'Customer Consent Needed' },
                    { label: 'Cancel Order', cost: 0, impact: 'Revenue Loss' }
                ];
            case 'DAMAGED_GOODS':
                return [
                    { label: 'Reship Immediately (NFO)', cost: 600, impact: 'High Priority' },
                    { label: 'Inspect Return First', cost: 50, impact: 'Delay' }
                ];
            default:
                return [
                    { label: 'Approve Recommendation', cost: 0, impact: 'Standard Protocol' },
                    { label: 'Request More Info', cost: 0, impact: 'Manual Review' }
                ];
        }
    };

    const handleProcessEvent = async () => {
        if (!selectedEvent || isProcessing) return;
        setIsProcessing(true);
        setAgentLogs([]);
        setDecision(null);
        setAgentLogs(prev => [...prev, `🚀 Initiating resolution workflow for ${selectedEvent.id}...`]);

        try {
            const onLog = (msg: string) => setAgentLogs(prev => [...prev, msg]);
            // Pass dynamic ID: 1472 docs from context
            const result = await resolveExceptionWithAgent(selectedEvent, agentConfig, onLog, documents); // Updated signature
            if (!result) throw new Error("No result from agent");

            setDecision(result.decision);
            const isEscalation = result.decision?.action?.toLowerCase().includes('escalate');
            const newStatus = isEscalation ? ExceptionStatus.ESCALATED : ExceptionStatus.RESOLVED;
            setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, status: newStatus } : e));

            if (isEscalation) {
                const ticketId = result.decision.toolResult?.ticket_id || `TASK-${Date.now()}`;
                const newTask: HumanTask = {
                    id: ticketId,
                    eventId: selectedEvent.id,
                    reason: result.decision.reasoning,
                    context: result.retrievedDocs || [],
                    status: 'OPEN',
                    suggestedActions: getSuggestedActions(selectedEvent)
                };
                setHumanTasks(prev => [newTask, ...prev]);
            } else {
                // Auto-resolution successful -> Calculate estimated savings
                // Logic: Potential Loss (Shipment Value + Penalties) - Resolution Cost = Savings
                // Simple Heuristic: If we saved the shipment, we saved its value.
                const potentialLoss = selectedEvent.shipment.value * 1.5; // Value + Brand impact
                const resolutionCost = result.decision.toolResult?.cost || 500; // Estimated cost if not provided
                const runSavings = Math.max(0, potentialLoss - resolutionCost);

                setTotalCostSaved(prev => prev + runSavings);
            }
        } catch (err: any) {
            console.error(err);
            setAgentLogs(prev => [...prev, `❌ Error: ${err.message}`]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleResolveTask = (taskId: string, actionLabel: string) => {
        setHumanTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'RESOLVED' } : t));
        const task = humanTasks.find(t => t.id === taskId);
        if (task) {
            setEvents(prev => prev.map(e => e.id === task.eventId ? { ...e, status: ExceptionStatus.RESOLVED } : e));
            setTotalCostSaved(prev => prev + 2500);
        }
    };

    const handleKnowledgeBaseExport = () => {
        const jsonlContent = KNOWLEDGE_BASE_DOCS.map(doc => JSON.stringify(doc)).join('\n');
        const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'knowledge_base.jsonl');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <MainLayout>
            {/* NEW LAYOUT STRUCTURE: Full Width Header Top, then Flex Row for Sidebar + Main */}
            <div className="flex flex-col h-full w-full overflow-hidden">
                {/* 1. Full Width Branding/Header */}
                <Header
                    title={currentView.replace('_', ' ')}
                    config={agentConfig}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    stats={{ resolutionRate: '94.2%', costSaved: totalCostSaved }}
                    brand={brand}
                    user={user}
                />

                {/* 2. Content Area (Sidebar + Main) */}
                <div className="flex flex-1 overflow-hidden relative">
                    {/* Left Sidebar */}
                    <ModernSidebar
                        currentView={currentView}
                        setView={setCurrentView}
                        openTaskCount={humanTasks.filter(t => t.status === 'OPEN').length}
                        exceptionCount={events.filter(e => e.status !== ExceptionStatus.RESOLVED && e.status !== ExceptionStatus.ESCALATED).length}
                        user={user}
                    />

                    {/* Right Main Content */}
                    <main className="flex-1 overflow-hidden relative flex flex-col min-w-0">
                        {currentView === 'SETTINGS' ? (
                            <div className="h-full overflow-y-auto bg-slate-950">
                                <DemoSettings />
                            </div>
                        ) : currentView === 'DASHBOARD' ? (
                            <div className="h-full p-4 grid grid-cols-12 gap-4">
                                {/* PANE 1: Incoming List (3 cols) */}
                                <div className="col-span-3 flex flex-col h-full overflow-hidden">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Incoming</h3>
                                    </div>
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-white/5 bg-slate-900/20 backdrop-blur-sm">
                                        <EventFeed
                                            events={events}
                                            selectedId={selectedEventId}
                                            onSelect={setSelectedEventId}
                                            onSimulate={handleSimulateEvent}
                                            isProcessing={isProcessing}
                                        />
                                    </div>
                                </div>

                                {/* PANE 2: Agent Workspace (4 cols) */}
                                <div className="col-span-4 flex flex-col h-full overflow-hidden">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agent Workspace</h3>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <EventDetailCard
                                            event={selectedEvent}
                                            isProcessing={isProcessing}
                                            decision={decision}
                                            onResolve={handleProcessEvent}
                                        />
                                    </div>
                                </div>

                                {/* PANE 3: Reasoning (5 cols) */}
                                <div className="col-span-5 flex flex-col h-full gap-4 overflow-hidden">
                                    <div className="shrink-0 flex flex-col gap-2">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resolution Volume</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                                <span className="text-[10px] text-orange-400 font-mono">LIVE</span>
                                            </div>
                                        </div>
                                        <div className="h-40 grid grid-cols-2 gap-4">
                                            <div className="h-full">
                                                <ResolutionStats data={chartData} isRealData={isUsingRealStats} />
                                            </div>
                                            <div className="bg-slate-900/10 rounded-xl border border-white/5 p-4 relative overflow-hidden flex flex-col justify-between">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                                    <span>System Status</span>
                                                    <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">v2.5</span>
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                                                    <div className="p-2 bg-black/20 rounded border border-white/5">
                                                        <div className="text-[10px] text-slate-500 mb-0.5">Model</div>
                                                        <div className="text-purple-400 truncate">
                                                            {agentConfig.useRealAgent ? 'Vertex Agent' : GEMINI_CONFIG.displayName}
                                                        </div>
                                                    </div>
                                                    <div className="p-2 bg-black/20 rounded border border-white/5">
                                                        <div className="text-[10px] text-slate-500 mb-0.5">Tools</div>
                                                        <div className="text-blue-400">Active</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Autonomous Reasoning Core</h3>
                                            <span className="text-[10px] text-slate-600 font-mono">/var/log/agent/reasoning.log</span>
                                        </div>
                                        <AgentWorkspace
                                            event={selectedEvent}
                                            logs={agentLogs}
                                            isProcessing={isProcessing}
                                            decision={decision}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : currentView === 'KNOWLEDGE_BASE' ? (
                            <div className="h-full p-6 overflow-hidden bg-slate-950">
                                <KnowledgeBase />
                            </div>
                        ) : currentView === 'DATA_FACTORY' ? (
                            <div className="h-full overflow-hidden bg-slate-950">
                                <DataFactory onExport={handleKnowledgeBaseExport} />
                            </div>
                        ) : currentView === 'ACTION_SERVICES' ? (
                            <div className="h-full overflow-hidden bg-slate-950">
                                <ActionServices />
                            </div>
                        ) : currentView === 'HUMAN_REVIEW' ? (
                            <div className="h-full overflow-hidden bg-slate-950">
                                <HumanReviewQueue
                                    tasks={humanTasks}
                                    events={events}
                                    onResolveTask={handleResolveTask}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-950 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950"></div>
                                <div className="text-center relative z-10">
                                    <div className="text-6xl mb-4 opacity-20">🚧</div>
                                    <h2 className="text-xl font-bold text-slate-400">Module Under Construction</h2>
                                    <p className="text-sm text-slate-600 mt-2">Connecting to {(currentView as string).replace('_', ' ')}...</p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <AgentSettings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                config={agentConfig}
                setConfig={setAgentConfig}
            />
        </MainLayout>
    );
};

const App: React.FC = () => {
    return (
        <DemoProvider>
            <InnerApp />
        </DemoProvider>
    );
};

export default App;
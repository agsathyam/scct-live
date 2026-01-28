import React, { useState } from 'react';
import { HumanTask, ExceptionEvent } from '../../types';

interface HumanReviewQueueProps {
  tasks: HumanTask[];
  events: ExceptionEvent[];
  onResolveTask: (taskId: string, action: string) => void;
}

export const HumanReviewQueue: React.FC<HumanReviewQueueProps> = ({ tasks, events, onResolveTask }) => {
  console.log('HumanReviewQueue rendered with:', { tasksCount: tasks.length, eventsCount: events.length, tasks });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const selectedEvent = selectedTask ? events.find(e => e.id === selectedTask.eventId) : null;

  const openTasks = tasks.filter(t => t.status === 'OPEN');

  // Note: resolvedTasks variable is unused but might be useful for future history view
  // const resolvedTasks = tasks.filter(t => t.status === 'RESOLVED');

  return (
    <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
      {/* Left Col: Task List */}
      <div className="col-span-4 flex flex-col gap-4 overflow-hidden">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between items-center">
          <span>Pending Reviews</span>
          <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-[10px]">{openTasks.length}</span>
        </h3>

        <div className="overflow-y-auto pr-2 pb-20 space-y-3">
          {openTasks.length === 0 && (
            <div className="text-center py-10 text-slate-600 italic">No pending tasks.</div>
          )}
          {openTasks.map(task => {
            const evt = events.find(e => e.id === task.eventId);
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTaskId === task.id
                  ? 'bg-slate-800 border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs text-orange-400 font-bold">ESCALATION</span>
                  <span className="text-xs text-slate-500">{evt?.timestamp.split('T')[0]}</span>
                </div>
                <div className="font-bold text-white mb-1 tracking-tight text-lg">{task.id}</div>
                <div className="text-xs text-slate-400 font-mono mb-2">Ref: {task.eventId}</div>
                <div className="text-sm text-slate-300 line-clamp-2">{task.reason}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Col: Workspace */}
      <div className="col-span-8 flex flex-col gap-4 overflow-hidden">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resolution Console</h3>

        {selectedTask && selectedEvent ? (
          <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 p-6 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="mb-6 border-b border-slate-800 pb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Resolution Required: {selectedEvent.id}</h1>
              <div className="flex gap-4 text-sm">
                <span className="text-slate-400">Customer: <span className="text-white font-medium">{selectedEvent.customer.name}</span></span>
                <span className="text-slate-400">Value: <span className="text-white font-medium">${selectedEvent.shipment.value.toLocaleString()}</span></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 flex-1">
              {/* Context Column */}
              <div className="space-y-4">
                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg">
                  <h4 className="text-xs font-bold text-orange-400 uppercase mb-2">Agent Escalation Reason</h4>
                  <p className="text-sm text-slate-300">{selectedTask.reason}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
                    📄 Relevant Policies (Vertex AI)
                  </h4>
                  <div className="space-y-3">
                    {selectedTask.context.slice(0, 3).map((doc, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800">
                        <div className="text-xs font-bold text-slate-300 mb-1">{doc.title}</div>
                        <div className="text-xs text-slate-500 italic">"{doc.content.substring(0, 150)}..."</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Column */}
              <div>
                <h4 className="text-xs font-bold text-green-400 uppercase mb-3">Mitigation Data Center</h4>
                <div className="space-y-3">
                  {selectedTask.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (window.confirm(`Execute action: ${action.label}?`)) {
                          onResolveTask(selectedTask.id, action.label);
                          setSelectedTaskId(null);
                        }
                      }}
                      className="w-full text-left p-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 transition-all group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{action.label}</span>
                        <span className="text-xs font-mono text-slate-400">${action.cost}</span>
                      </div>
                      <div className="text-xs text-slate-500">{action.impact}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
            <div className="text-4xl mb-4">👮</div>
            <p>Select a pending task to review</p>
          </div>
        )}
      </div>
    </div>
  );
};

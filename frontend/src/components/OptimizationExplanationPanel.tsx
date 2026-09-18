import React from 'react';
import type { OptimizationResult, TaskAssignmentDetail } from '../types/smartagv';
import { CheckCircle2, XCircle, HelpCircle, ShieldCheck, Compass } from 'lucide-react';

interface ExplanationPanelProps {
  optimizationResult: OptimizationResult | null;
  selectedTaskId?: string | null;
}

export const OptimizationExplanationPanel: React.FC<ExplanationPanelProps> = ({
  optimizationResult,
  selectedTaskId
}) => {
  if (!optimizationResult || !optimizationResult.assignments || optimizationResult.assignments.length === 0) {
    return (
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 text-center text-slate-400">
        <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm">No optimization breakdown data available. Run optimization to see transparent decision metrics.</p>
      </div>
    );
  }

  // Find assignment detail matching selected task, or pick the first assignment
  let activeDetail: TaskAssignmentDetail | undefined;
  if (selectedTaskId) {
    activeDetail = optimizationResult.assignments.find(a => a.task_id === selectedTaskId);
  }
  if (!activeDetail) {
    activeDetail = optimizationResult.assignments[0];
  }

  const selectedCandidate = activeDetail.selected_candidate;
  const rejectedCandidates = activeDetail.candidates.filter(c => !c.eligible || (selectedCandidate && c.agv_id !== selectedCandidate.agv_id));

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Optimization Engine Explainability Panel
          </h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
          Task: {activeDetail.task_id} ({activeDetail.priority})
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected Candidate Breakdown */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Selected Optimal AGV
            </span>
            {selectedCandidate && (
              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                Score: {selectedCandidate.total_score.toFixed(1)} / 100
              </span>
            )}
          </div>

          {selectedCandidate ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-medium">Assigned AGV ID:</span>
                <span className="text-white font-bold text-sm">{selectedCandidate.agv_id} ({selectedCandidate.agv_name})</span>
              </div>

              {/* Verified Criteria Checkmarks */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Battery Reserve:
                  </span>
                  <span className="font-mono">{selectedCandidate.score_battery.toFixed(1)}% ({selectedCandidate.battery_after_task.toFixed(1)}% leftover)</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Total Distance:
                  </span>
                  <span className="font-mono">{selectedCandidate.total_distance.toFixed(1)} m</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Estimated Time:
                  </span>
                  <span className="font-mono">~{Math.round(selectedCandidate.estimated_time)} sec</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Route Quality Score:
                  </span>
                  <span className="font-mono">{selectedCandidate.score_route.toFixed(1)} / 100</span>
                </div>
              </div>

              {/* Scoring Formula Breakdown */}
              <div className="mt-3 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                  5-Factor Score Breakdown
                </span>
                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block">Dist 30%</span>
                    <span className="text-cyan-300 font-bold">{selectedCandidate.score_distance.toFixed(0)}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block">Batt 25%</span>
                    <span className="text-cyan-300 font-bold">{selectedCandidate.score_battery.toFixed(0)}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block">Route 20%</span>
                    <span className="text-cyan-300 font-bold">{selectedCandidate.score_route.toFixed(0)}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block">Prio 15%</span>
                    <span className="text-cyan-300 font-bold">{selectedCandidate.score_priority.toFixed(0)}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block">Avail 10%</span>
                    <span className="text-cyan-300 font-bold">{selectedCandidate.score_availability.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-center text-red-400 text-xs font-semibold">
              NO FEASIBLE AGV MATCHED: All candidates failed hard constraints (Battery/Capacity/Route Blocked).
            </div>
          )}
        </div>

        {/* Rejected Candidates Audit */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3 border-b border-slate-800 pb-2">
            <XCircle className="w-4 h-4 text-red-400" /> Rejected Candidate Audit
          </span>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {rejectedCandidates.length > 0 ? (
              rejectedCandidates.map((c) => (
                <div key={c.agv_id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-200">{c.agv_id} ({c.agv_name})</div>
                    <div className="text-[11px] text-red-400 mt-0.5 font-medium">
                      Reason: {c.rejection_reason || 'Lower Score Candidate'}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60">
                    REJECTED
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs italic">No rejected candidates recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Principle Feature Highlight: SHORTEST ROUTE ≠ BEST ROUTE */}
      {activeDetail.shortest_path && activeDetail.optimal_path && (
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 border border-cyan-800/50 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider mb-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            Core Principle Demonstration: Shortest Route ≠ Always Best Route
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-semibold block mb-1">Standard Shortest Route (Distance Only):</span>
              <div className="font-mono text-slate-300 text-[11px]">{activeDetail.shortest_path.join(' → ')}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Distance: {activeDetail.shortest_path_distance}m</span>
                <span className="text-amber-400 font-medium">Avg Congestion: {Math.round(activeDetail.shortest_path_congestion * 100)}%</span>
              </div>
            </div>

            <div className="p-3 bg-cyan-950/40 rounded-lg border border-cyan-500/40">
              <span className="text-cyan-300 font-semibold block mb-1">Dynamic Lowest-Cost Route (Dijkstra Optimized):</span>
              <div className="font-mono text-cyan-200 text-[11px]">{activeDetail.optimal_path.join(' → ')}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Distance: {activeDetail.optimal_path_distance}m</span>
                <span className="text-emerald-400 font-medium">Avg Congestion: {Math.round(activeDetail.optimal_path_congestion * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

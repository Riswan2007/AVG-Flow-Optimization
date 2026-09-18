import React, { useState, useEffect } from 'react';
import { Play, Square, FastForward } from 'lucide-react';
import { api } from '../services/api';

interface DemoScenarioProps {
  onTriggerReason: (reason: string) => void;
  onRefreshData: () => void;
}

export const DemoScenarioManager: React.FC<DemoScenarioProps> = ({
  onTriggerReason,
  onRefreshData
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTimer, setStepTimer] = useState(0);

  const steps = [
    { title: "Phase 1: Normal Operation", desc: "Fleet performing normal material transport tasks.", duration: 15 },
    { title: "Phase 2: Simulate AGV Failure", desc: "AGV-02 set OFFLINE; backend reassigns task.", duration: 20 },
    { title: "Phase 3: Create Urgent Task", desc: "Injecting URGENT task; priority scoring active.", duration: 20 },
    { title: "Phase 4: Route Congestion Spike", desc: "Edge N2-N4 congestion updated to 90%; rerouting.", duration: 20 },
    { title: "Phase 5: Block Route Barricade", desc: "Edge N1-N2 blocked; Dijkstra calculates alternative path.", duration: 20 },
    { title: "Phase 6: Demo Completion", desc: "All hackathon demo phases executed successfully.", duration: 10 }
  ];

  const startDemo = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    setStepTimer(0);
    onTriggerReason("Started Automated Demo Scenario");
    await api.controlSimulation('start', 2.0);
    onRefreshData();
  };

  const stopDemo = async () => {
    setIsRunning(false);
    setCurrentStep(0);
    setStepTimer(0);
    await api.controlSimulation('pause', 1.0);
    onRefreshData();
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      setStepTimer(prev => {
        const nextTime = prev + 1;
        const targetDuration = steps[currentStep]?.duration || 15;

        if (nextTime >= targetDuration) {
          const nextStepIdx = currentStep + 1;
          if (nextStepIdx < steps.length) {
            setCurrentStep(nextStepIdx);
            // Execute backend phase action!
            executePhaseAction(nextStepIdx);
            return 0;
          } else {
            setIsRunning(false);
            return 0;
          }
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, currentStep]);

  const executePhaseAction = async (stepIdx: number) => {
    try {
      if (stepIdx === 1) {
        onTriggerReason("Phase 2: AGV Failure Triggered");
        await api.triggerAGVFailure("AGV-02");
      } else if (stepIdx === 2) {
        onTriggerReason("Phase 3: Urgent Task Created");
        await api.triggerUrgentTask();
      } else if (stepIdx === 3) {
        onTriggerReason("Phase 4: Route Congestion Spike (N2-N4 90%)");
        await api.triggerCongestion("N2", "N4", 0.9);
      } else if (stepIdx === 4) {
        onTriggerReason("Phase 5: Route N1-N2 Blocked Barricade");
        await api.triggerBlockRoute("N1", "N2", true);
      }
      onRefreshData();
    } catch (err) {
      console.error("Demo scenario action failed:", err);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/40 p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30">
          <FastForward className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">
              Automated Hackathon Demo Controller
            </h3>
            {isRunning && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full animate-pulse">
                Phase {currentStep + 1}/{steps.length} (Next in {(steps[currentStep]?.duration || 15) - stepTimer}s)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {isRunning ? steps[currentStep].desc : "Run 90s multi-phase automated optimization walkthrough"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isRunning ? (
          <button
            onClick={stopDemo}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Square className="w-4 h-4 fill-current" /> Stop Demo
          </button>
        ) : (
          <button
            onClick={startDemo}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-500/30 transition-all cursor-pointer hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" /> ▶ START DEMO SCENARIO
          </button>
        )}
      </div>
    </div>
  );
};

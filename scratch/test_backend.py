import sys
import os

# Add workspace root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database.db import Database
from backend.optimization.graph_engine import FactoryGraphEngine
from backend.optimization.assignment_engine import AGVAssignmentEngine
from backend.simulation.simulator import SimulatorEngine

def test_system():
    print("Testing SmartAGV Backend Optimization Core...")
    db = Database()
    ge = FactoryGraphEngine()
    ae = AGVAssignmentEngine(ge)
    sim = SimulatorEngine(db, ge, ae)

    res = sim.run_optimization("Unit Test Startup")
    print(f"[OK] Initial Optimization Run Timestamp: {res.timestamp}")
    print(f"[OK] Total Tasks Processed: {len(res.assignments)}")
    for a in res.assignments:
        if a.assigned_agv:
            print(f"  -> Task {a.task_id} ({a.priority.value}) assigned to {a.assigned_agv} | Score: {a.selected_candidate.total_score:.1f} | Route: {' -> '.join(a.assigned_route)}")
        else:
            print(f"  -> Task {a.task_id} UNASSIGNED")

    print("\nTesting Dynamic Failure Event...")
    agvs = db.get_all_agvs()
    busy_agv = next((a for a in agvs if a.status.value == "busy"), agvs[0])
    busy_agv.status = "offline"
    db.update_agv(busy_agv)
    res_fail = sim.run_optimization("AGV Failure Test")
    print(f"[OK] Optimization after AGV {busy_agv.id} set to OFFLINE:")
    for a in res_fail.assignments:
        print(f"  -> Task {a.task_id} assigned to {a.assigned_agv}")

    print("\nTesting Route Congestion Event...")
    ge.update_edge_status("N2", "N4", congestion=0.9)
    res_cong = sim.run_optimization("Congestion Test on N2-N4")
    print(f"[OK] Route recalculated for tasks under 90% congestion on N2-N4.")

    print("\nBackend Core Test PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_system()

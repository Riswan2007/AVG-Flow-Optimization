import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.database.db import Database
from backend.optimization.graph_engine import FactoryGraphEngine
from backend.optimization.assignment_engine import AGVAssignmentEngine
from backend.simulation.simulator import SimulatorEngine
from backend.routes.api import router, init_api_deps

# Initialize application singletons
db = Database()
graph_engine = FactoryGraphEngine()
assignment_engine = AGVAssignmentEngine(graph_engine)
simulator = SimulatorEngine(db, graph_engine, assignment_engine)

# Inject dependencies into API routes module
init_api_deps(db, graph_engine, assignment_engine, simulator)

bg_task = None

async def simulation_loop_task():
    """Background async task running simulation clock ticks every 500ms."""
    while True:
        try:
            simulator.tick(dt_seconds=0.5)
        except Exception as e:
            print(f"Error in simulation loop: {e}")
        await asyncio.sleep(0.5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: trigger initial optimization and start simulation loop background task
    simulator.run_optimization("System Startup Initial Optimization")
    simulator.start()
    task = asyncio.create_task(simulation_loop_task())
    yield
    # Shutdown: cancel task
    task.cancel()

app = FastAPI(
    title="SmartAGV – Dynamic Factory Material Movement Optimization System",
    description="Hackathon-ready full-stack optimization engine and industrial dashboard",
    version="1.0.0",
    lifespan=lifespan
)

from fastapi.responses import JSONResponse
from fastapi.requests import Request

# CORS Middleware setup - Permissive for all origins (including Vercel preview deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r".*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )

app.include_router(router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "SmartAGV Dynamic Material Movement Optimization System",
        "version": "1.0.0",
        "api_docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

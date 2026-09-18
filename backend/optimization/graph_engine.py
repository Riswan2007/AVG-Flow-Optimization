import networkx as nx
from typing import List, Tuple, Dict, Optional, Any
from backend.models.schemas import FactoryNode, FactoryEdge, FactoryGraph, NodePos

class FactoryGraphEngine:
    def __init__(self):
        self.graph = nx.Graph()
        self.nodes_dict: Dict[str, FactoryNode] = {}
        self.edges_dict: Dict[Tuple[str, str], FactoryEdge] = {}
        self.setup_default_factory()

    def setup_default_factory(self):
        """Initializes the factory map graph with 2D coordinates, nodes, and bidirectional edges."""
        self.graph.clear()
        self.nodes_dict.clear()
        self.edges_dict.clear()

        # Nodes configuration with 2D positions (x, y) suitable for a clean SVG layout (1000 x 600 canvas)
        nodes_data = [
            # Storage Area (Left Column)
            FactoryNode(id="Storage-A", name="Storage A", type="storage", pos=NodePos(x=100, y=100)),
            FactoryNode(id="Storage-B", name="Storage B", type="storage", pos=NodePos(x=100, y=300)),
            FactoryNode(id="Storage-C", name="Storage C", type="storage", pos=NodePos(x=100, y=500)),
            
            # Intersections
            FactoryNode(id="N1", name="Junction N1", type="intersection", pos=NodePos(x=300, y=100)),
            FactoryNode(id="N2", name="Junction N2", type="intersection", pos=NodePos(x=550, y=100)),
            FactoryNode(id="N3", name="Junction N3", type="intersection", pos=NodePos(x=300, y=300)),
            FactoryNode(id="N4", name="Junction N4", type="intersection", pos=NodePos(x=550, y=300)),
            FactoryNode(id="N5", name="Junction N5", type="intersection", pos=NodePos(x=300, y=500)),
            FactoryNode(id="N6", name="Junction N6", type="intersection", pos=NodePos(x=550, y=500)),

            # Machines (Middle Right)
            FactoryNode(id="Machine-01", name="Machine 1", type="machine", pos=NodePos(x=780, y=100)),
            FactoryNode(id="Machine-02", name="Machine 2", type="machine", pos=NodePos(x=780, y=300)),
            FactoryNode(id="Machine-03", name="Machine 3", type="machine", pos=NodePos(x=780, y=500)),

            # Production Stations (Far Right)
            FactoryNode(id="Prod-01", name="Production 1", type="production", pos=NodePos(x=920, y=200)),
            FactoryNode(id="Prod-02", name="Production 2", type="production", pos=NodePos(x=920, y=400)),

            # Charging Station (Bottom Center)
            FactoryNode(id="Charging-01", name="Charging Hub", type="charging", pos=NodePos(x=425, y=560)),
        ]

        for node in nodes_data:
            self.nodes_dict[node.id] = node
            self.graph.add_node(node.id, **node.dict())

        # Edges configuration with distances (meters), travel times (seconds), initial congestion (0.0), blocked (False)
        raw_edges = [
            # Storage to Intersections
            ("Storage-A", "N1", 35.0, 23.3),
            ("Storage-B", "N3", 35.0, 23.3),
            ("Storage-C", "N5", 35.0, 23.3),

            # Vertical Backbone (Left Intersections)
            ("N1", "N3", 40.0, 26.6),
            ("N3", "N5", 40.0, 26.6),

            # Horizontal Highways
            ("N1", "N2", 50.0, 33.3),
            ("N3", "N4", 50.0, 33.3),
            ("N5", "N6", 50.0, 33.3),

            # Vertical Backbone (Right Intersections)
            ("N2", "N4", 40.0, 26.6),
            ("N4", "N6", 40.0, 26.6),

            # Intersections to Machines
            ("N2", "Machine-01", 45.0, 30.0),
            ("N4", "Machine-02", 45.0, 30.0),
            ("N6", "Machine-03", 45.0, 30.0),

            # Machines to Production
            ("Machine-01", "Prod-01", 30.0, 20.0),
            ("Machine-02", "Prod-01", 30.0, 20.0),
            ("Machine-02", "Prod-02", 30.0, 20.0),
            ("Machine-03", "Prod-02", 30.0, 20.0),

            # Connections to Charging Station
            ("N5", "Charging-01", 25.0, 16.6),
            ("N6", "Charging-01", 25.0, 16.6),
        ]

        for u, v, dist, t_time in raw_edges:
            edge_obj = FactoryEdge(source=u, target=v, distance=dist, travel_time=t_time, congestion=0.0, blocked=False)
            key = tuple(sorted([u, v]))
            self.edges_dict[key] = edge_obj
            self.graph.add_edge(u, v, distance=dist, travel_time=t_time, congestion=0.0, blocked=False)

    def get_edge(self, u: str, v: str) -> Optional[FactoryEdge]:
        key = tuple(sorted([u, v]))
        return self.edges_dict.get(key)

    def update_edge_status(self, u: str, v: str, congestion: Optional[float] = None, blocked: Optional[bool] = None):
        key = tuple(sorted([u, v]))
        if key in self.edges_dict:
            edge = self.edges_dict[key]
            if congestion is not None:
                edge.congestion = max(0.0, min(1.0, congestion))
            if blocked is not None:
                edge.blocked = blocked
            
            # Update NetworkX graph
            self.graph[u][v]['congestion'] = edge.congestion
            self.graph[u][v]['blocked'] = edge.blocked

    def calculate_dynamic_weight(self, u: str, v: str, d: dict) -> float:
        """
        Calculates dynamic path weight:
        - If blocked, returns float('inf') to force path planning around it.
        - Dynamic Cost = Distance * (1 + 4.0 * Congestion^2)
        This ensures high congestion heavily penalizes the edge.
        """
        if d.get('blocked', False):
            return float('inf')
        dist = d.get('distance', 1.0)
        cong = d.get('congestion', 0.0)
        # Non-linear congestion penalty
        return dist * (1.0 + 4.0 * (cong ** 2))

    def find_optimal_route(self, source: str, destination: str) -> Tuple[Optional[List[str]], float, float, float]:
        """
        Finds the lowest dynamic cost route using Dijkstra's algorithm.
        Returns: (path, total_distance, estimated_travel_time, dynamic_cost)
        """
        if source == destination:
            return [source], 0.0, 0.0, 0.0

        try:
            path = nx.dijkstra_path(
                self.graph,
                source=source,
                target=destination,
                weight=self.calculate_dynamic_weight
            )
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None, float('inf'), float('inf'), float('inf')

        # Check if resulting path hit infinite weight (i.e. blocked)
        total_dist = 0.0
        total_time = 0.0
        dynamic_cost = 0.0

        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            edge_data = self.graph[u][v]
            if edge_data.get('blocked', False):
                return None, float('inf'), float('inf'), float('inf')
            
            dist = edge_data['distance']
            t_base = edge_data['travel_time']
            cong = edge_data['congestion']

            total_dist += dist
            # Travel time slows down with congestion: Actual Time = Base Time * (1 + 2.0 * Congestion)
            total_time += t_base * (1.0 + 2.0 * cong)
            dynamic_cost += self.calculate_dynamic_weight(u, v, edge_data)

        return path, round(total_dist, 2), round(total_time, 2), round(dynamic_cost, 2)

    def find_pure_shortest_route(self, source: str, destination: str) -> Tuple[Optional[List[str]], float, float]:
        """
        Finds pure distance-based shortest route ignoring congestion (used for UI comparison).
        """
        if source == destination:
            return [source], 0.0, 0.0

        def distance_only_weight(u, v, d):
            return float('inf') if d.get('blocked', False) else d.get('distance', 1.0)

        try:
            path = nx.dijkstra_path(
                self.graph,
                source=source,
                target=destination,
                weight=distance_only_weight
            )
            total_dist = sum(self.graph[path[i]][path[i+1]]['distance'] for i in range(len(path)-1))
            avg_cong = sum(self.graph[path[i]][path[i+1]]['congestion'] for i in range(len(path)-1)) / max(1, len(path)-1)
            return path, round(total_dist, 2), round(avg_cong, 2)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None, float('inf'), 0.0

    def get_route_metrics(self, path: List[str]) -> Tuple[float, float, float]:
        """Returns (total_distance, estimated_time, avg_congestion) for a given node path."""
        if not path or len(path) < 2:
            return 0.0, 0.0, 0.0
        
        total_dist = 0.0
        total_time = 0.0
        total_cong = 0.0

        for i in range(len(path) - 1):
            u, v = path[i], path[i+1]
            key = tuple(sorted([u, v]))
            edge = self.edges_dict.get(key)
            if edge:
                total_dist += edge.distance
                total_time += edge.travel_time * (1.0 + 2.0 * edge.congestion)
                total_cong += edge.congestion
        
        avg_cong = total_cong / (len(path) - 1)
        return round(total_dist, 2), round(total_time, 2), round(avg_cong, 2)

    def to_factory_graph_schema(self) -> FactoryGraph:
        """Exports graph state to Schema object for frontend synchronization."""
        return FactoryGraph(
            nodes=list(self.nodes_dict.values()),
            edges=list(self.edges_dict.values())
        )

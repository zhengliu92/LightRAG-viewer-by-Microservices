import networkx as nx
from pathlib import Path
import warnings

from pydantic import BaseModel

warnings.filterwarnings("ignore", category=FutureWarning)


class Node(BaseModel):
    entity_type: str
    description: str
    id: str
    source_id: str


class Edge(BaseModel):
    source: str
    target: str
    keywords: str
    description: str
    weight: float
    source_id: str


def graph_to_json(kb_id: str):
    proj_path = Path("store") / kb_id
    graph_path = proj_path / "graph_chunk_entity_relation.graphml"
    if not graph_path.exists():
        return {}
    G = nx.read_graphml(graph_path)
    # 转换为字典
    graph_dict = nx.node_link_data(G)
    nodes = [Node(**node) for node in graph_dict["nodes"]]
    edges = [Edge(**link) for link in graph_dict["links"]]
    return {"nodes": nodes, "edges": edges}


if __name__ == "__main__":
    print(graph_to_json("admin", "hi"))

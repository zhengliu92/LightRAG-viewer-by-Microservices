import asyncio
import os
from lightrag.storage import NetworkXStorage


async def example_graph_operations_1():
    # Initialize storage with a sample config
    config = {
        "working_dir": "example/graph",
        "node2vec_params": {
            "dimensions": 128,
            "walk_length": 80,
            "num_walks": 10,
        },
    }

    # Create working directory if it doesn't exist
    os.makedirs(config["working_dir"], exist_ok=True)

    # Initialize storage
    storage = NetworkXStorage(global_config=config, namespace="example")

    # Example 1: Adding nodes and edges
    print("\n=== Adding nodes and edges ===")
    await storage.upsert_node("person1", {"name": "Alice", "age": "30"})
    await storage.upsert_node("person2", {"name": "Bob", "age": "25"})
    await storage.upsert_node("person3", {"name": "Charlie", "age": "35"})

    # Add relationships between people
    await storage.upsert_edge("person1", "person2", {"relationship": "friend"})
    await storage.upsert_edge("person2", "person3", {"relationship": "colleague"})

    # Example 2: Querying nodes and edges
    print("\n=== Querying nodes and edges ===")
    person1_data = await storage.get_node("person1")
    print(f"Person 1 data: {person1_data}")

    has_edge = await storage.has_edge("person1", "person2")
    print(f"Edge exists between person1 and person2: {has_edge}")

    # Example 3: Getting node edges
    print("\n=== Getting node edges ===")
    person2_edges = await storage.get_node_edges("person2")
    print(f"Person 2's edges: {person2_edges}")

    # Example 4: Node degrees
    print("\n=== Node degrees ===")
    person2_degree = await storage.node_degree("person2")
    print(f"Person 2's degree: {person2_degree}")

    # # Example 5: Deleting nodes and edges
    # print("\n=== Deleting nodes and edges ===")
    # await storage.delete_node("person3")
    # print(f"After deletion, person3 exists: {await storage.has_node('person3')}")

    # Example 6: Batch operations
    print("\n=== Batch operations ===")
    # Add multiple nodes
    await storage.upsert_node("person4", {"name": "David", "age": "28"})
    await storage.upsert_node("person5", {"name": "Eve", "age": "32"})

    # Remove multiple nodes
    # storage.remove_nodes(["person4", "person5"])

    # Example 7: Save graph to file
    print("\n=== Saving graph ===")
    await storage.index_done_callback()
    print("Graph saved to file")


async def example_graph_operations_2():
    # Initialize storage with a sample config
    config = {
        "working_dir": "example/graph",
        "node2vec_params": {
            "dimensions": 128,
            "walk_length": 80,
            "num_walks": 10,
        },
    }

    # Create working directory if it doesn't exist
    os.makedirs(config["working_dir"], exist_ok=True)

    # Initialize storage
    storage = NetworkXStorage(global_config=config, namespace="example")

    # Example 1: Adding nodes and edges
    print("\n=== Adding nodes and edges ===")
    await storage.upsert_node("person10", {"name": "Alice", "age": "30"})
    await storage.upsert_node("person11", {"name": "Bob", "age": "25"})
    await storage.upsert_node("person12", {"name": "Charlie", "age": "35"})

    # Add relationships between people
    await storage.upsert_edge("person10", "person11", {"relationship": "friend"})
    await storage.upsert_edge("person11", "person12", {"relationship": "colleague"})

    # Example 2: Querying nodes and edges
    print("\n=== Querying nodes and edges ===")
    person1_data = await storage.get_node("person10")
    print(f"Person 1 data: {person1_data}")

    has_edge = await storage.has_edge("person10", "person11")
    print(f"Edge exists between person10 and person11: {has_edge}")

    # Example 3: Getting node edges
    print("\n=== Getting node edges ===")
    person11_edges = await storage.get_node_edges("person11")
    print(f"Person 11's edges: {person11_edges}")

    # Example 4: Node degrees
    print("\n=== Node degrees ===")
    person2_degree = await storage.node_degree("person2")
    print(f"Person 2's degree: {person2_degree}")

    # # Example 5: Deleting nodes and edges
    # print("\n=== Deleting nodes and edges ===")
    # await storage.delete_node("person3")
    # print(f"After deletion, person3 exists: {await storage.has_node('person3')}")

    # Example 6: Batch operations
    print("\n=== Batch operations ===")
    # Add multiple nodes
    await storage.upsert_node("person4", {"name": "David", "age": "28"})
    await storage.upsert_node("person5", {"name": "Eve", "age": "32"})

    # Remove multiple nodes
    # storage.remove_nodes(["person4", "person5"])

    # Example 7: Save graph to file
    print("\n=== Saving graph ===")
    await storage.index_done_callback()
    print("Graph saved to file")


if __name__ == "__main__":
    asyncio.run(example_graph_operations_2())

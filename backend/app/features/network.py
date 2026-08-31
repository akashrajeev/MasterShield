from __future__ import annotations

import networkx as nx
import pandas as pd


def build_payment_graph(df: pd.DataFrame) -> nx.Graph:
    """Build an undirected synthetic relationship graph for offline AML research."""
    graph = nx.Graph()
    for row in df[["account_id", "beneficiary_id", "device_id", "merchant_id"]].itertuples(index=False):
        account = f"A:{int(row.account_id)}"
        beneficiary = f"B:{int(row.beneficiary_id)}"
        device = f"D:{int(row.device_id)}"
        merchant = f"M:{int(row.merchant_id)}"
        graph.add_edge(account, beneficiary, relation="pays")
        graph.add_edge(account, device, relation="uses")
        graph.add_edge(account, merchant, relation="shops")
    return graph


def graph_summary(df: pd.DataFrame) -> dict:
    graph = build_payment_graph(df)
    components = list(nx.connected_components(graph))
    return {
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "components": len(components),
        "largest_component": max((len(c) for c in components), default=0),
        "high_degree_nodes": sum(1 for _, degree in graph.degree() if degree >= 8),
    }

import numpy as np
import pandas as pd
from typing import List, Dict, Any
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

class KMeansInventoryClusterer:
    """
    scikit-learn KMeans Inventory Clustering Engine.
    Clusters products based on Stock Level, Sales Velocity (units/mo), and Price 
    to segment inventory into Fast-Moving vs Slow-Moving / Overstocked stock.
    """
    def __init__(self, n_clusters: int = 3):
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=self.n_clusters, random_state=42, n_init=10)

    def cluster_inventory(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not products or len(products) < self.n_clusters:
            return {"clusters": [], "slow_moving_products": []}

        # Build feature matrix X: [stock, sales_velocity, price]
        feature_list = []
        for p in products:
            feature_list.append([
                float(p.get("stock", 0)),
                float(p.get("sales_velocity", 50)),
                float(p.get("price", 1000))
            ])

        X = np.array(feature_list)
        X_scaled = self.scaler.fit_transform(X)

        # Fit KMeans clustering
        cluster_labels = self.kmeans.fit_predict(X_scaled)

        # Calculate average sales velocity per cluster to assign meaningful labels
        df = pd.DataFrame(products)
        df["cluster_id"] = cluster_labels
        
        cluster_avg_velocity = df.groupby("cluster_id")["sales_velocity"].mean().to_dict()
        # Sort cluster IDs by sales velocity ascending (index 0 will be lowest velocity = slow-moving)
        sorted_clusters = sorted(cluster_avg_velocity.keys(), key=lambda c: cluster_avg_velocity[c])

        cluster_name_map = {
            sorted_clusters[0]: "Slow-Moving / Overstocked",
            sorted_clusters[1]: "Regular Velocity",
            sorted_clusters[2]: "Fast-Moving High Demand"
        }

        clustered_products = []
        slow_moving_list = []

        for idx, p in enumerate(products):
            c_id = int(cluster_labels[idx])
            c_label = cluster_name_map.get(c_id, "Regular Velocity")
            
            p_with_cluster = {
                **p,
                "cluster_id": c_id,
                "cluster_label": c_label,
                "is_slow_moving": (c_id == sorted_clusters[0] and p.get("stock", 0) > 0)
            }
            clustered_products.append(p_with_cluster)

            if p_with_cluster["is_slow_moving"]:
                slow_moving_list.append(p_with_cluster)

        # Cluster centroids info
        cluster_summaries = []
        for c_id in range(self.n_clusters):
            c_prods = [p for p in clustered_products if p["cluster_id"] == c_id]
            avg_vel = round(np.mean([p["sales_velocity"] for p in c_prods]), 1) if c_prods else 0
            avg_stock = round(np.mean([p["stock"] for p in c_prods]), 1) if c_prods else 0
            label = cluster_name_map.get(c_id, f"Cluster {c_id}")
            cluster_summaries.append({
                "cluster_id": c_id,
                "label": label,
                "count": len(c_prods),
                "avg_sales_velocity": avg_vel,
                "avg_stock": avg_stock
            })

        return {
            "clustered_products": clustered_products,
            "slow_moving_products": slow_moving_list,
            "cluster_summaries": cluster_summaries,
            "total_products_clustered": len(products)
        }

kmeans_clusterer = KMeansInventoryClusterer()

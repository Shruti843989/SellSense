import os
import json
import pickle
import numpy as np
import pandas as pd
from typing import List, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

MODEL_WEIGHTS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "model_weights.pkl"))

class MLRecommenderEngine:
    """
    SellSense Dual-Signal ML Recommendation Engine:
    - Signal 1 (Collaborative Filtering): scikit-learn Cosine Similarity on Orders x Products matrix (400 synthetic orders).
    - Signal 2 (Content-Based NLP Embeddings): scikit-learn TfidfVectorizer text similarity on product names, descriptions, & tags.
    - Persists trained matrices to 'model_weights.pkl' for zero-latency startup loading.
    - Pure ML scoring: Hybrid Score = 0.6 * CoPurchase + 0.4 * SemanticEmbedding.
    """
    def __init__(self):
        self.products = []
        self.product_id_map = {}
        self.product_index_map = {}
        self.co_purchase_matrix = None
        self.content_similarity_matrix = None
        self.is_trained = False

    def train(self, products_data: List[Dict[str, Any]], orders_data: List[Dict[str, Any]], force_retrain: bool = False):
        """
        Trains scikit-learn models on 400 orders x 30 products dataset and persists weights.
        """
        if not products_data:
            print("[WARN] Recommender warning: Insufficient product data for ML training.")
            return

        self.products = products_data
        num_products = len(products_data)
        self.product_id_map = {p["id"]: p for p in products_data}
        self.product_index_map = {p["id"]: idx for idx, p in enumerate(products_data)}

        # Check if saved model weights exist on disk
        if not force_retrain and os.path.exists(MODEL_WEIGHTS_PATH):
            try:
                with open(MODEL_WEIGHTS_PATH, "rb") as f:
                    saved_data = pickle.load(f)
                    if saved_data.get("num_products") == num_products:
                        self.co_purchase_matrix = saved_data["co_purchase_matrix"]
                        self.content_similarity_matrix = saved_data["content_similarity_matrix"]
                        self.is_trained = True
                        print(f"[ML LOADED] Loaded pre-trained ML model matrices from '{MODEL_WEIGHTS_PATH}' ({num_products} products).")
                        return
            except Exception as e:
                print(f"[ML NOTE] Error loading saved model weights ({e}), retraining model...")

        print(f"[ML TRAINING] Training scikit-learn Cosine Similarity & TF-IDF models on {len(orders_data)} orders & {num_products} products...")

        # 1. Build Co-Purchase Binary Matrix (Orders x Products)
        order_matrix = np.zeros((len(orders_data), num_products))
        for row_idx, order in enumerate(orders_data):
            p_ids = order.get("product_ids", [])
            if isinstance(p_ids, str):
                p_ids = json.loads(p_ids)
            for p_id in p_ids:
                if p_id in self.product_index_map:
                    col_idx = self.product_index_map[p_id]
                    order_matrix[row_idx, col_idx] = 1.0

        # Compute Product-Product Cosine Similarity
        product_co_matrix = order_matrix.T
        self.co_purchase_matrix = cosine_similarity(product_co_matrix)

        # 2. Build Content Semantic Embedding Matrix via TF-IDF Vectorizer
        corpus = [
            f"{p['name']} {p['category']} {p['description']} {' '.join(p.get('tags', []))}"
            for p in products_data
        ]
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_vectors = vectorizer.fit_transform(corpus)
        self.content_similarity_matrix = cosine_similarity(tfidf_vectors)

        # Persist weights to disk (.pkl)
        try:
            with open(MODEL_WEIGHTS_PATH, "wb") as f:
                pickle.dump({
                    "num_products": num_products,
                    "co_purchase_matrix": self.co_purchase_matrix,
                    "content_similarity_matrix": self.content_similarity_matrix
                }, f)
            print(f"[ML PERSIST] Saved trained model matrices to '{MODEL_WEIGHTS_PATH}'.")
        except Exception as e:
            print(f"[ML WARN] Could not save model weights: {e}")

        self.is_trained = True
        print(f"[ML SUCCESS] ML Recommender Engine Trained Successfully! ({num_products} products, {len(orders_data)} orders analyzed)")

    def recommend_candidates_for_cart(self, cart_product_ids: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Calculates hybrid ML similarity score for available candidate products.
        Score = 0.6 * CoPurchaseScore + 0.4 * SemanticContentScore
        Pure ML ranking path — zero hardcoded if/else category rules.
        """
        if not self.is_trained:
            candidates = [p for p in self.products if p["id"] not in cart_product_ids]
            return [{"product": c, "co_purchase_score": 0.5, "semantic_score": 0.5, "hybrid_ml_score": 0.5, "ml_confidence_percent": 50} for c in candidates[:top_k]]

        cart_indices = [self.product_index_map[pid] for pid in cart_product_ids if pid in self.product_index_map]
        
        if not cart_indices:
            cart_set = set(cart_product_ids)
            candidates = [p for p in self.products if p["id"] not in cart_set]
            return [{"product": c, "co_purchase_score": 0.4, "semantic_score": 0.4, "hybrid_ml_score": 0.4, "ml_confidence_percent": 40} for c in candidates[:top_k]]

        num_products = len(self.products)
        co_scores = np.zeros(num_products)
        content_scores = np.zeros(num_products)

        for idx in cart_indices:
            co_scores += self.co_purchase_matrix[idx]
            content_scores += self.content_similarity_matrix[idx]

        co_scores /= len(cart_indices)
        content_scores /= len(cart_indices)

        # Hybrid weighting (60% co-purchase collaborative signal + 40% TF-IDF NLP semantic signal)
        hybrid_scores = (0.6 * co_scores) + (0.4 * content_scores)

        results = []
        cart_set = set(cart_product_ids)

        for idx, prod in enumerate(self.products):
            p_id = prod["id"]
            if p_id in cart_set:
                continue

            c_score = float(co_scores[idx])
            s_score = float(content_scores[idx])
            h_score = float(hybrid_scores[idx])

            results.append({
                "product": prod,
                "co_purchase_score": round(c_score, 3),
                "semantic_score": round(s_score, 3),
                "hybrid_ml_score": round(h_score, 3),
                "ml_confidence_percent": int(round(h_score * 100))
            })

        results.sort(key=lambda x: x["hybrid_ml_score"], reverse=True)
        return results[:top_k]

ml_recommender = MLRecommenderEngine()

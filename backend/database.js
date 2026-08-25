const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database.sqlite');
let db = null;

// Initial dummy products catalog (6-8 items across categories)
const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "AuraSound Pro Wireless Headphones",
    description: "Active noise canceling over-ear headphones with 40-hour battery life and spatial audio.",
    price: 6999,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    stock: 15,
    tags: ["audio", "wireless", "premium", "bluetooth"],
    rating: 4.8
  },
  {
    id: "prod-2",
    name: "UltraMag 10,000mAh Magnetic Power Bank",
    description: "Compact 15W MagSafe fast-charging battery pack with LED battery percentage display.",
    price: 1899,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80",
    stock: 25,
    tags: ["accessories", "charging", "powerbank", "magsafe"],
    rating: 4.6
  },
  {
    id: "prod-3",
    name: "PulseFit Pro Smartwatch",
    description: "AMOLED fitness tracker with SpO2 sensor, GPS navigation, and 7-day battery endurance.",
    price: 4499,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    stock: 10,
    tags: ["fitness", "smartwatch", "wearables", "tech"],
    rating: 4.7
  },
  {
    id: "prod-4",
    name: "Braided Nylon USB-C SuperFast Cable (2-Pack)",
    description: "Reinforced 100W PD charging & 480Mbps data sync cable set with tangle-free design.",
    price: 499,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    stock: 50,
    tags: ["accessories", "cable", "usbc", "fast-charging"],
    rating: 4.5
  },
  {
    id: "prod-5",
    name: "ErgoComfort Laptop Stand",
    description: "Adjustable aluminum ergonomic cooling stand for laptops up to 17 inches.",
    price: 1299,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
    stock: 18,
    tags: ["desk", "stand", "ergonomic", "accessories"],
    rating: 4.9
  },
  {
    id: "prod-6",
    name: "NanoShield Screen Protection Kit",
    description: "9H Hardness tempered glass with automatic alignment tool and cleaning wipes.",
    price: 349,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80",
    stock: 40,
    tags: ["accessories", "protection", "screenguard"],
    rating: 4.4
  },
  {
    id: "prod-7",
    name: "SonicGlide RGB Mechanical Keyboard",
    description: "Compact 75% hot-swappable tactile wireless mechanical gaming keyboard.",
    price: 3899,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    stock: 8,
    tags: ["electronics", "keyboard", "gaming", "desk"],
    rating: 4.8
  },
  {
    id: "prod-8",
    name: "VelvetTouch Microfiber Cleaning Pouch",
    description: "Anti-static scratchless pouch for lenses, smart glasses, and phone screens.",
    price: 199,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
    stock: 0, // Intentionally 0 stock to test Out-Of-Stock Bounded Gate!
    tags: ["accessories", "cleaning", "budget"],
    rating: 4.2
  }
];

// Memory/JSON fallback store in case SQLite sqlite3 native bindings fail on system
let fallbackMemoryStore = {
  products: [...INITIAL_PRODUCTS],
  orders: [],
  audit_logs: []
};
let isUsingFallback = false;

function initDatabase() {
  return new Promise((resolve) => {
    try {
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.warn("⚠️ SQLite initialization warning, using in-memory store fallback:", err.message);
          isUsingFallback = true;
          return resolve(false);
        }

        // Enable WAL mode & foreign keys
        db.serialize(() => {
          db.run(`CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            image TEXT,
            stock INTEGER NOT NULL,
            tags TEXT,
            rating REAL
          )`);

          db.run(`CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_number TEXT NOT NULL,
            razorpay_order_id TEXT,
            razorpay_payment_id TEXT,
            total_amount REAL NOT NULL,
            items TEXT NOT NULL,
            status TEXT NOT NULL,
            failure_reason TEXT,
            created_at TEXT NOT NULL
          )`);

          db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            cart_items TEXT NOT NULL,
            candidates_evaluated TEXT NOT NULL,
            rule_results TEXT NOT NULL,
            final_suggestions TEXT NOT NULL,
            user_action TEXT,
            payment_status TEXT NOT NULL,
            failure_reason TEXT
          )`);

          // Seed products if table empty
          db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (row && row.count === 0) {
              const stmt = db.prepare(`INSERT INTO products (id, name, description, price, category, image, stock, tags, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
              INITIAL_PRODUCTS.forEach((p) => {
                stmt.run(p.id, p.name, p.description, p.price, p.category, p.image, p.stock, JSON.stringify(p.tags), p.rating);
              });
              stmt.finalize();
              console.log("✅ Database seeded with initial 8 products.");
            }
          });
        });

        console.log("✅ SQLite Database initialized successfully at:", DB_PATH);
        resolve(true);
      });
    } catch (e) {
      console.warn("⚠️ SQLite fallback activated:", e.message);
      isUsingFallback = true;
      resolve(false);
    }
  });
}

// Product Queries
function getProducts() {
  return new Promise((resolve, reject) => {
    if (isUsingFallback || !db) {
      return resolve(fallbackMemoryStore.products);
    }
    db.all("SELECT * FROM products", (err, rows) => {
      if (err) return reject(err);
      const parsed = rows.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : []
      }));
      resolve(parsed);
    });
  });
}

function updateProductStock(id, qtyDeducted) {
  return new Promise((resolve, reject) => {
    if (isUsingFallback || !db) {
      const prod = fallbackMemoryStore.products.find(p => p.id === id);
      if (prod) prod.stock = Math.max(0, prod.stock - qtyDeducted);
      return resolve(true);
    }
    db.run("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?", [qtyDeducted, id], function(err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

// Order Queries
function saveOrder(orderData) {
  return new Promise((resolve, reject) => {
    if (isUsingFallback || !db) {
      fallbackMemoryStore.orders.unshift(orderData);
      return resolve(orderData);
    }
    const stmt = db.prepare(`INSERT INTO orders (id, order_number, razorpay_order_id, razorpay_payment_id, total_amount, items, status, failure_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(
      orderData.id,
      orderData.order_number,
      orderData.razorpay_order_id || null,
      orderData.razorpay_payment_id || null,
      orderData.total_amount,
      JSON.stringify(orderData.items),
      orderData.status,
      orderData.failure_reason || null,
      orderData.created_at,
      function(err) {
        if (err) return reject(err);
        resolve(orderData);
      }
    );
    stmt.finalize();
  });
}

// Audit Log Queries
function saveAuditLog(logEntry) {
  return new Promise((resolve, reject) => {
    if (isUsingFallback || !db) {
      // Upsert by id or push
      const idx = fallbackMemoryStore.audit_logs.findIndex(l => l.id === logEntry.id);
      if (idx >= 0) {
        fallbackMemoryStore.audit_logs[idx] = logEntry;
      } else {
        fallbackMemoryStore.audit_logs.unshift(logEntry);
      }
      return resolve(logEntry);
    }

    const {
      id,
      session_id,
      timestamp,
      cart_items,
      candidates_evaluated,
      rule_results,
      final_suggestions,
      user_action = "pending",
      payment_status = "pending",
      failure_reason = null
    } = logEntry;

    db.run(
      `INSERT INTO audit_logs (id, session_id, timestamp, cart_items, candidates_evaluated, rule_results, final_suggestions, user_action, payment_status, failure_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_action=excluded.user_action,
         payment_status=excluded.payment_status,
         failure_reason=excluded.failure_reason`,
      [
        id,
        session_id,
        timestamp,
        JSON.stringify(cart_items),
        JSON.stringify(candidates_evaluated),
        JSON.stringify(rule_results),
        JSON.stringify(final_suggestions),
        user_action,
        payment_status,
        failure_reason
      ],
      function(err) {
        if (err) return reject(err);
        resolve(logEntry);
      }
    );
  });
}

function getAuditLogs() {
  return new Promise((resolve, reject) => {
    if (isUsingFallback || !db) {
      return resolve(fallbackMemoryStore.audit_logs);
    }
    db.all("SELECT * FROM audit_logs ORDER BY timestamp DESC", (err, rows) => {
      if (err) return reject(err);
      const parsed = rows.map(r => ({
        ...r,
        cart_items: r.cart_items ? JSON.parse(r.cart_items) : [],
        candidates_evaluated: r.candidates_evaluated ? JSON.parse(r.candidates_evaluated) : [],
        rule_results: r.rule_results ? JSON.parse(r.rule_results) : [],
        final_suggestions: r.final_suggestions ? JSON.parse(r.final_suggestions) : []
      }));
      resolve(parsed);
    });
  });
}

function clearAuditLogs() {
  return new Promise((resolve, reject) => {
    if (isUsingFallback || !db) {
      fallbackMemoryStore.audit_logs = [];
      return resolve(true);
    }
    db.run("DELETE FROM audit_logs", (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
}

module.exports = {
  initDatabase,
  getProducts,
  updateProductStock,
  saveOrder,
  saveAuditLog,
  getAuditLogs,
  clearAuditLogs,
  INITIAL_PRODUCTS
};

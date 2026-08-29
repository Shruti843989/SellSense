import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import json
import random
import pandas as pd
import numpy as np
from app.db.database import engine, Base, SessionLocal
from app.db.models import Product, SyntheticOrder
from app.ml.recommender import ml_recommender

INITIAL_PRODUCTS = [
  # --- Category 1: Audio (6 items) ---
  {
    "id": "prod-1",
    "name": "AuraSound Pro Wireless Headphones",
    "description": "Active noise-canceling over-ear studio headphones featuring 40mm custom titanium drivers, 40-hour battery life, 3D spatial audio processing, and protein memory foam ear cushions.",
    "price": 6999.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    "stock": 15,
    "sales_velocity": 185,
    "tags": ["audio", "wireless", "headphones", "anc", "bluetooth", "studio", "titanium"],
    "rating": 4.8
  },
  {
    "id": "prod-2",
    "name": "SoundPulse Waterproof Bluetooth Speaker",
    "description": "Rugged IPX7 waterproof outdoor Bluetooth 5.3 speaker with dual 360-degree passive bass radiators, 20W RMS power output, and 12-hour continuous mountain playback.",
    "price": 2499.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
    "stock": 14,
    "sales_velocity": 60,
    "tags": ["audio", "speaker", "waterproof", "bluetooth", "outdoor", "bass", "ipx7"],
    "rating": 4.7
  },
  {
    "id": "prod-3",
    "name": "StudioMaster ANC Wireless Earbuds",
    "description": "True wireless earbuds featuring active hybrid ANC (-35dB), quad beamforming microphones, 60ms ultra-low-latency gaming mode, and Qi wireless charging case.",
    "price": 3299.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    "stock": 25,
    "sales_velocity": 120,
    "tags": ["audio", "earbuds", "wireless", "anc", "bluetooth", "gaming", "qi-charging"],
    "rating": 4.6
  },
  {
    "id": "prod-4",
    "name": "ProBass Magnetic Neckband Headphones",
    "description": "Flexible ergonomic silicone neckband bluetooth earphones with fast-charge technology (10 min charge = 10 hrs play), magnetic snap earbuds, and HD dynamic bass drivers.",
    "price": 1199.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&auto=format&fit=crop&q=80",
    "stock": 40,
    "sales_velocity": 160,
    "tags": ["audio", "neckband", "sports", "budget", "bluetooth", "fast-charge", "silicone"],
    "rating": 4.4
  },
  {
    "id": "prod-5",
    "name": "HiFiStation Studio Monitor Desktop Speakers",
    "description": "Pair of powered bookshelf studio monitors with 4-inch Kevlar woven woofers, 1-inch silk dome tweeters, Bluetooth 5.0, optical RCA inputs, and acoustic wood cabinets.",
    "price": 8999.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
    "stock": 10,
    "sales_velocity": 40,
    "tags": ["audio", "speakers", "studio", "desktop", "hifi", "monitors", "kevlar"],
    "rating": 4.9
  },
  {
    "id": "prod-6",
    "name": "VocalPro USB Condenser Podcast Microphone",
    "description": "Professional cardioid studio condenser USB microphone with built-in dual pop filter, metal gain control dial, zero-latency 3.5mm headphone monitoring, and shock mount arm.",
    "price": 4299.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    "stock": 18,
    "sales_velocity": 75,
    "tags": ["audio", "microphone", "usb", "podcast", "streaming", "recording", "condenser"],
    "rating": 4.7
  },

  # --- Category 2: Accessories (8 items) ---
  {
    "id": "prod-7",
    "name": "UltraMag 10,000mAh Magnetic Power Bank",
    "description": "Compact 15W MagSafe wireless fast-charging external battery pack with dual USB-C Power Delivery 20W ports and digital OLED battery percentage display.",
    "price": 1899.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80",
    "stock": 22,
    "sales_velocity": 140,
    "tags": ["accessories", "charging", "powerbank", "magsafe", "portable", "oled"],
    "rating": 4.6
  },
  {
    "id": "prod-8",
    "name": "Braided Nylon USB-C SuperFast Cable (2-Pack)",
    "description": "Reinforced 100W Power Delivery charging & 480Mbps data sync cable set (2m) with tangle-free Kevlar braided armor and strain-relief aluminum connectors.",
    "price": 499.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    "stock": 50,
    "sales_velocity": 210,
    "tags": ["accessories", "cable", "usbc", "fast-charging", "braided", "kevlar"],
    "rating": 4.5
  },
  {
    "id": "prod-9",
    "name": "ErgoComfort Aluminum Laptop Stand",
    "description": "Adjustable 6-level ergonomic aluminum alloy laptop elevator for desk setups, supporting laptops up to 17 inches with heat dissipation slots and anti-scratch silicone pads.",
    "price": 1299.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
    "stock": 35,
    "sales_velocity": 80,
    "tags": ["desk", "stand", "ergonomic", "accessories", "aluminum", "laptop"],
    "rating": 4.9
  },
  {
    "id": "prod-10",
    "name": "NanoShield Screen Protection Kit",
    "description": "9H Hardness tempered glass screen protector with auto dust-elimination tray, oleophobic anti-fingerprint coating, and edge-to-edge 2.5D curved arc.",
    "price": 349.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80",
    "stock": 45,
    "sales_velocity": 90,
    "tags": ["accessories", "protection", "screenguard", "tempered-glass", "budget"],
    "rating": 4.4
  },
  {
    "id": "prod-11",
    "name": "VelvetTouch Microfiber Cleaning Pouch",
    "description": "Ultra-soft anti-static microfiber cleaning pouch for optical camera lenses, smart glasses, tablet displays, and smartphone touchscreens.",
    "price": 199.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
    "stock": 30,
    "sales_velocity": 50,
    "tags": ["accessories", "cleaning", "microfiber", "budget", "pouch"],
    "rating": 4.2
  },
  {
    "id": "prod-12",
    "name": "MagSafe Wireless Car Charging Mount",
    "description": "Air-vent magnetic car phone holder featuring 15W fast wireless charging, strong N52 neodymium magnet ring, and 360-degree rotation ball joint.",
    "price": 1599.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80",
    "stock": 18,
    "sales_velocity": 75,
    "tags": ["accessories", "car", "magsafe", "charging", "mount"],
    "rating": 4.6
  },
  {
    "id": "prod-13",
    "name": "Genuine Leather Smartwatch Strap",
    "description": "Premium top-grain Italian leather replacement watch band with quick-release stainless steel buckle for 20mm and 22mm smartwatches.",
    "price": 799.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
    "stock": 28,
    "sales_velocity": 65,
    "tags": ["accessories", "watch", "leather", "straps", "premium"],
    "rating": 4.5
  },
  {
    "id": "prod-14",
    "name": "65W GaN Fast Charger Dual Port Adapter",
    "description": "Ultra-compact Gallium Nitride (GaN III) fast wall charger with dual USB-C Power Delivery 65W ports capable of charging laptops and smartphones simultaneously.",
    "price": 2199.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    "stock": 24,
    "sales_velocity": 110,
    "tags": ["accessories", "charger", "gan", "fast-charging", "usbc"],
    "rating": 4.8
  },

  # --- Category 3: Bags (7 items) ---
  {
    "id": "prod-15",
    "name": "TravelTech Pro Anti-Theft Backpack",
    "description": "Water-resistant 30L travel backpack with hidden TSA combination lock, padded 16-inch laptop compartment, luggage trolley strap, and external USB charging pass-through.",
    "price": 2899.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    "stock": 20,
    "sales_velocity": 110,
    "tags": ["bags", "backpack", "travel", "anti-theft", "laptop"],
    "rating": 4.8
  },
  {
    "id": "prod-16",
    "name": "ProProtector Padded Laptop Sleeve (15-Inch)",
    "description": "360-degree shockproof plush fleece-lined laptop pouch with water-repellent splashproof polyester exterior and zippered cable organization pocket.",
    "price": 899.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80",
    "stock": 35,
    "sales_velocity": 95,
    "tags": ["bags", "laptop", "sleeve", "protection", "pouch"],
    "rating": 4.6
  },
  {
    "id": "prod-17",
    "name": "UrbanCommute Canvas Messenger Bag",
    "description": "Vintage heavy canvas messenger shoulder bag with magnetic snap closures, padded 14-inch tablet sleeve, and memory foam padded shoulder strap.",
    "price": 1999.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
    "stock": 16,
    "sales_velocity": 70,
    "tags": ["bags", "messenger", "canvas", "office", "shoulder-bag"],
    "rating": 4.7
  },
  {
    "id": "prod-18",
    "name": "Weekender Waterproof Travel Duffel",
    "description": "Spacious 45L gym & travel duffel bag with separate ventilated shoe compartment, waterproof PVC wet clothes pocket, and padded shoulder strap.",
    "price": 2399.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1512413912139-91415f42d90c?w=600&auto=format&fit=crop&q=80",
    "stock": 12,
    "sales_velocity": 55,
    "tags": ["bags", "duffel", "travel", "gym", "waterproof"],
    "rating": 4.5
  },
  {
    "id": "prod-19",
    "name": "Minimalist Slim Crossbody Sling Pouch",
    "description": "Lightweight water-repellent chest sling pouch designed for smartphone, keys, wallet, power bank, and passport concealment on transit.",
    "price": 699.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80",
    "stock": 40,
    "sales_velocity": 130,
    "tags": ["bags", "crossbody", "sling", "budget", "travel"],
    "rating": 4.4
  },
  {
    "id": "prod-20",
    "name": "HardShell Protective Tech Organizer Case",
    "description": "Rigid molded EVA hard-shell tech pouch with internal elastic mesh dividers for charging cables, wall adapters, portable SSDs, and power banks.",
    "price": 799.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80",
    "stock": 30,
    "sales_velocity": 85,
    "tags": ["bags", "organizer", "hardshell", "travel", "tech-case"],
    "rating": 4.6
  },
  {
    "id": "prod-21",
    "name": "EcoCanvas Grocery & Utility Tote Bag",
    "description": "Heavy-duty 16oz organic cotton canvas tote bag featuring reinforced cross-stitched handles and inner zippered phone pocket.",
    "price": 399.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
    "stock": 50,
    "sales_velocity": 140,
    "tags": ["bags", "tote", "canvas", "eco", "budget"],
    "rating": 4.3
  },

  # --- Category 4: Electronics (7 items) ---
  {
    "id": "prod-22",
    "name": "PulseFit Pro Smartwatch",
    "description": "1.43-inch AMOLED touch display smartwatch featuring SpO2 blood oxygen sensor, PPG heart rate monitor, standalone GPS, and 7-day battery life.",
    "price": 4499.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    "stock": 10,
    "sales_velocity": 90,
    "tags": ["electronics", "smartwatch", "fitness", "wearables", "amoled", "gps"],
    "rating": 4.7
  },
  {
    "id": "prod-23",
    "name": "SonicGlide RGB Mechanical Keyboard",
    "description": "Compact 75% hot-swappable tactile mechanical wireless gaming keyboard featuring south-facing per-key RGB backlighting, sound-dampening foam, and Bluetooth 5.1.",
    "price": 3899.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    "stock": 8,
    "sales_velocity": 75,
    "tags": ["electronics", "keyboard", "mechanical", "rgb", "gaming", "desk", "hot-swappable"],
    "rating": 4.8
  },
  {
    "id": "prod-24",
    "name": "AirGlide Precision Wireless Mouse",
    "description": "Ergonomic 4000 DPI silent-click optical wireless mouse featuring SmartWheel scrolling, multi-device Bluetooth switching, and USB-C fast charging.",
    "price": 1499.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
    "stock": 20,
    "sales_velocity": 85,
    "tags": ["electronics", "mouse", "wireless", "ergonomic", "desk", "silent"],
    "rating": 4.6
  },
  {
    "id": "prod-25",
    "name": "UltraClear 4K HDR USB Webcam",
    "description": "Autofocus 4K Ultra HD video webcam featuring dual stereo omnidirectional noise-reduction mics, magnetic privacy lens cover, and tripods mount.",
    "price": 4999.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&auto=format&fit=crop&q=80",
    "stock": 15,
    "sales_velocity": 65,
    "tags": ["electronics", "webcam", "4k", "video", "streaming", "desk"],
    "rating": 4.7
  },
  {
    "id": "prod-26",
    "name": "MultiPort 7-in-1 USB-C Aluminum Hub",
    "description": "Aluminum USB-C multiport hub dongle featuring 4K@60Hz HDMI, 100W Power Delivery pass-through, 3x USB 3.0 5Gbps ports, and SD/microSD card reader.",
    "price": 1799.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    "stock": 30,
    "sales_velocity": 125,
    "tags": ["electronics", "usbc", "hub", "adapter", "hdmi", "desk"],
    "rating": 4.7
  },
  {
    "id": "prod-27",
    "name": "SmartDesk RGB LED Screenbar Monitor Light",
    "description": "Asymmetric optical monitor screen light bar featuring ambient light sensor, touch color temperature tuning (2700K-6500K), and RGB backlighting.",
    "price": 2699.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&auto=format&fit=crop&q=80",
    "stock": 16,
    "sales_velocity": 70,
    "tags": ["electronics", "lighting", "monitor-light", "desk", "eyecare"],
    "rating": 4.8
  },
  {
    "id": "prod-28",
    "name": "Ergonomic Vertical Wireless Optical Mouse",
    "description": "57-degree vertical handshake angle ergonomic mouse designed to alleviate wrist pronation, with 2400 DPI optical sensor and whisper-quiet click switches.",
    "price": 1299.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
    "stock": 22,
    "sales_velocity": 60,
    "tags": ["electronics", "mouse", "vertical", "ergonomic", "desk"],
    "rating": 4.5
  },

  # --- Category 5: Wearables (5 items) ---
  {
    "id": "prod-29",
    "name": "ActiveRing Health & Sleep Tracker",
    "description": "Ultra-lightweight aerospace titanium smart ring monitoring continuous HRV, sleep architecture stages, body temperature trends, and daily recovery readiness score.",
    "price": 8999.0,
    "category": "Wearables",
    "image": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80",
    "stock": 8,
    "sales_velocity": 45,
    "tags": ["wearables", "smartring", "health", "sleep", "premium", "titanium"],
    "rating": 4.9
  },
  {
    "id": "prod-30",
    "name": "FitStep Waterproof Fitness Band",
    "description": "Slim color OLED fitness wristband tracking steps, active minutes, sleep stages, call/message alerts, with 14-day battery life and 50m water resistance.",
    "price": 1499.0,
    "category": "Wearables",
    "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
    "stock": 30,
    "sales_velocity": 140,
    "tags": ["wearables", "fitnessband", "tracker", "budget", "waterproof"],
    "rating": 4.5
  },
  {
    "id": "prod-31",
    "name": "AeroVision Anti-Blue Light Gaming Glasses",
    "description": "Flexible TR90 memory frame anti-fatigue gaming glasses blocking 99% UV400 and blue light rays to prevent digital eye strain and sleep disturbance.",
    "price": 799.0,
    "category": "Wearables",
    "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
    "stock": 40,
    "sales_velocity": 95,
    "tags": ["wearables", "glasses", "bluelight", "eyecare", "gaming", "tr90"],
    "rating": 4.4
  },
  {
    "id": "prod-32",
    "name": "ThermoGrip Thermal Smart Fitness Gloves",
    "description": "Breathable touchscreen-compatible gym workout gloves with anatomical silicon palm grip pads and heavy-duty wrist wrapping support.",
    "price": 599.0,
    "category": "Wearables",
    "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
    "stock": 35,
    "sales_velocity": 70,
    "tags": ["wearables", "gloves", "fitness", "workout", "budget"],
    "rating": 4.3
  },
  {
    "id": "prod-33",
    "name": "SmartPedometer Clip-On Fitness Tracker",
    "description": "Compact clip-on 3D tri-axis digital pedometer tracking steps, distance, and calorie expenditure without requiring smartphone pairing.",
    "price": 499.0,
    "category": "Wearables",
    "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
    "stock": 25,
    "sales_velocity": 50,
    "tags": ["wearables", "pedometer", "clip", "fitness", "budget"],
    "rating": 4.2
  },

  # --- Category 6: Fitness (6 items) ---
  {
    "id": "prod-34",
    "name": "ProGrip Heavy Resistance Bands Set (5-Pack)",
    "description": "100% natural Malaysian latex stackable resistance exercise bands (10 to 150 lbs total tension) with foam handles, heavy door anchor, and ankle cuffs.",
    "price": 899.0,
    "category": "Fitness",
    "image": "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&auto=format&fit=crop&q=80",
    "stock": 35,
    "sales_velocity": 105,
    "tags": ["fitness", "gym", "workout", "resistance-bands", "latex"],
    "rating": 4.6
  },
  {
    "id": "prod-35",
    "name": "SmartCount Speed Jump Rope",
    "description": "Tangle-free high-speed ball bearing jump rope featuring digital backlit LED step/calorie counter and removable weighted handle inserts.",
    "price": 599.0,
    "category": "Fitness",
    "image": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80",
    "stock": 40,
    "sales_velocity": 115,
    "tags": ["fitness", "jumprope", "cardio", "smart", "budget"],
    "rating": 4.4
  },
  {
    "id": "prod-36",
    "name": "EcoGrip Non-Slip TPE Yoga Mat (6mm)",
    "description": "Eco-friendly high-density dual-layer TPE non-slip yoga mat with laser-engraved body alignment posture lines and carrying harness strap.",
    "price": 1299.0,
    "category": "Fitness",
    "image": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80",
    "stock": 25,
    "sales_velocity": 85,
    "tags": ["fitness", "yoga", "mat", "tpe", "workout", "alignment"],
    "rating": 4.7
  },
  {
    "id": "prod-37",
    "name": "HydroSteel Vacuum Insulated Water Bottle (1L)",
    "description": "Double-wall 18/8 food-grade stainless steel thermal water bottle keeping drinks ice cold for 24 hours or piping hot for 12 hours, with leakproof straw lid.",
    "price": 999.0,
    "category": "Fitness",
    "image": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80",
    "stock": 45,
    "sales_velocity": 130,
    "tags": ["fitness", "water-bottle", "insulated", "gym", "hydration", "stainless-steel"],
    "rating": 4.8
  },
  {
    "id": "prod-38",
    "name": "DeepTissue Percussion Massage Gun",
    "description": "High-torque 24V brushless motor deep muscle percussion massager with 30 adjustable speeds, 6 ergonomic silicone attachment heads, and carrying case.",
    "price": 3299.0,
    "category": "Fitness",
    "image": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80",
    "stock": 15,
    "sales_velocity": 65,
    "tags": ["fitness", "massage-gun", "recovery", "deep-tissue", "muscle"],
    "rating": 4.7
  },
  {
    "id": "prod-39",
    "name": "Ankle & Wrist Weighted Straps (Pair)",
    "description": "Adjustable breathable neoprene ankle weights (2kg total pair weight) with heavy-duty steel D-ring buckle and reflective safety strip.",
    "price": 699.0,
    "category": "Fitness",
    "image": "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&auto=format&fit=crop&q=80",
    "stock": 30,
    "sales_velocity": 60,
    "tags": ["fitness", "weights", "ankle-weights", "cardio", "budget"],
    "rating": 4.4
  },

  # --- Category 7: Home (5 items) ---
  {
    "id": "prod-40",
    "name": "TempControl Smart Thermal Desk Mug",
    "description": "App-controlled scratch-resistant ceramic coated thermal mug keeping coffee or tea at your target temperature (120°F – 145°F) for 2 hours.",
    "price": 3499.0,
    "category": "Home",
    "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    "stock": 12,
    "sales_velocity": 50,
    "tags": ["home", "mug", "smart", "desk", "thermal", "coffee"],
    "rating": 4.8
  },
  {
    "id": "prod-41",
    "name": "LuminaLED Dimmable Smart Desk Lamp",
    "description": "Architect LED aluminum desk lamp featuring integrated 10W wireless smartphone charging pad, touch dimming slider, and 5 color temperature spectrums.",
    "price": 2199.0,
    "category": "Home",
    "image": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&auto=format&fit=crop&q=80",
    "stock": 22,
    "sales_velocity": 75,
    "tags": ["home", "lamp", "desk", "lighting", "wireless-charging", "led"],
    "rating": 4.7
  },
  {
    "id": "prod-42",
    "name": "PureAir Ultrasonic Desk Humidifier & Diffuser",
    "description": "Whisper-quiet 500ml ultrasonic cool mist humidifier with essential oil aroma tray, automatic shut-off safety sensor, and 7 soft LED nightlight colors.",
    "price": 1199.0,
    "category": "Home",
    "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    "stock": 28,
    "sales_velocity": 80,
    "tags": ["home", "humidifier", "diffuser", "desk", "aroma"],
    "rating": 4.5
  },
  {
    "id": "prod-43",
    "name": "SmartPlug Mini Wi-Fi Power Outlet",
    "description": "Compact 16A Wi-Fi smart plug enabling remote mobile app control, custom timer schedules, energy consumption monitoring, and Alexa/Google voice control.",
    "price": 699.0,
    "category": "Home",
    "image": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&auto=format&fit=crop&q=80",
    "stock": 40,
    "sales_velocity": 110,
    "tags": ["home", "smart-plug", "wifi", "automation", "budget"],
    "rating": 4.6
  },
  {
    "id": "prod-44",
    "name": "ErgoCushion Memory Foam Lumbar Support Pillow",
    "description": "Contoured high-density orthopedic memory foam back cushion for desk office chairs, featuring 3D breathable mesh cover and dual adjustable straps.",
    "price": 1399.0,
    "category": "Home",
    "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    "stock": 20,
    "sales_velocity": 65,
    "tags": ["home", "pillow", "lumbar", "ergonomic", "desk-chair", "memory-foam"],
    "rating": 4.7
  },

  # --- Category 8: Stationery (6 items) ---
  {
    "id": "prod-45",
    "name": "ReSmart Reusable Digital Notebook",
    "description": "Erasable 36-page cloud-connected smart notebook with OCR app auto-sync to Google Drive/Dropbox, including erasable Pilot Frixion gel pen.",
    "price": 1699.0,
    "category": "Stationery",
    "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    "stock": 25,
    "sales_velocity": 90,
    "tags": ["stationery", "notebook", "digital", "reusable", "cloud", "office"],
    "rating": 4.6
  },
  {
    "id": "prod-46",
    "name": "Executive Matte Aluminum Pen Set",
    "description": "Weight-balanced matte aircraft aluminum rollerball and ballpoint executive pen duo in magnetic velvet gift box with 0.5mm Japanese archival ink refills.",
    "price": 499.0,
    "category": "Stationery",
    "image": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80",
    "stock": 45,
    "sales_velocity": 120,
    "tags": ["stationery", "pen", "executive", "gift", "budget", "office"],
    "rating": 4.5
  },
  {
    "id": "prod-47",
    "name": "ErgoLeather Desk Blotter & Pad",
    "description": "Waterproof anti-scratch PU leather desk blotter pad (90x40cm) providing smooth mouse tracking surface and desktop protection for keyboards and laptops.",
    "price": 799.0,
    "category": "Stationery",
    "image": "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80",
    "stock": 30,
    "sales_velocity": 100,
    "tags": ["stationery", "deskpad", "leather", "office", "desk", "waterproof"],
    "rating": 4.7
  },
  {
    "id": "prod-48",
    "name": "WireOrganizer Magnetic Cable Clips (6-Pack)",
    "description": "Heavy-duty magnetic silicone cable management organizer clips keeping desktop charging cords, USB-C cables, and headphone wires neatly anchored.",
    "price": 399.0,
    "category": "Stationery",
    "image": "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80",
    "stock": 50,
    "sales_velocity": 150,
    "tags": ["stationery", "cable-organizer", "magnetic", "desk", "budget"],
    "rating": 4.6
  },
  {
    "id": "prod-49",
    "name": "Minimalist Acrylic Desk Organizer Stand",
    "description": "Shatterproof clear acrylic desktop storage caddy featuring 5 tiered compartments for organizing pens, notebooks, sticky notes, and mobile devices.",
    "price": 899.0,
    "category": "Stationery",
    "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    "stock": 25,
    "sales_velocity": 70,
    "tags": ["stationery", "organizer", "acrylic", "desk", "storage"],
    "rating": 4.5
  },
  {
    "id": "prod-50",
    "name": "DailyPlanner Hardcover Habit Journal",
    "description": "Undated 12-month productivity planner featuring daily habit tracker matrices, weekly reflection spreads, and 120gsm ink-proof bleed-resistant paper.",
    "price": 999.0,
    "category": "Stationery",
    "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    "stock": 35,
    "sales_velocity": 85,
    "tags": ["stationery", "journal", "planner", "productivity", "habit"],
    "rating": 4.8
  }
]

# Granular 12 Co-Purchase Affinity Clusters (Priority 3 Expansion)
AFFINITY_GROUPS = [
  # 1. Home Office Desktop Setup
  ["prod-9", "prod-24", "prod-23", "prod-47", "prod-27"],
  # 2. Travel Workspace Mobility
  ["prod-16", "prod-15", "prod-26", "prod-14", "prod-20"],
  # 3. Wireless Mobile Audio
  ["prod-3", "prod-1", "prod-7", "prod-8"],
  # 4. Studio & Wired Audio
  ["prod-5", "prod-6", "prod-1", "prod-25"],
  # 5. Smartphone Fast Charging
  ["prod-7", "prod-8", "prod-14", "prod-10"],
  # 6. Car & Commute Mobile
  ["prod-12", "prod-7", "prod-19", "prod-2"],
  # 7. Fitness & Cardio Recovery
  ["prod-36", "prod-35", "prod-38", "prod-37", "prod-18"],
  # 8. Wearables & Health Tracking
  ["prod-29", "prod-22", "prod-30", "prod-13", "prod-34"],
  # 9. Study & Daily Journaling
  ["prod-45", "prod-46", "prod-50", "prod-41"],
  # 10. Desk Organization & Cable Management
  ["prod-48", "prod-49", "prod-47", "prod-11"],
  # 11. Smart Home Climate & Lighting
  ["prod-41", "prod-40", "prod-42", "prod-43"],
  # 12. Ergonomic Lumbar & Seating
  ["prod-44", "prod-28", "prod-9", "prod-31"]
]

CUSTOMER_TYPES = [
  {"type": "student_budget", "budget_tier": "budget", "affinity_idx": 8},
  {"type": "tech_enthusiast", "budget_tier": "mid-range", "affinity_idx": 0},
  {"type": "mobile_professional", "budget_tier": "mid-range", "affinity_idx": 1},
  {"type": "fitness_pro", "budget_tier": "mid-range", "affinity_idx": 6},
  {"type": "executive_premium", "budget_tier": "premium", "affinity_idx": 10},
  {"type": "audiophile_creator", "budget_tier": "premium", "affinity_idx": 3}
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed products (replace existing to update catalog to 50 items)
    db.query(Product).delete()
    for p in INITIAL_PRODUCTS:
        prod_obj = Product(
            id=p["id"],
            name=p["name"],
            description=p["description"],
            price=p["price"],
            category=p["category"],
            image=p["image"],
            stock=p["stock"],
            sales_velocity=p["sales_velocity"],
            tags=json.dumps(p["tags"]),
            rating=p["rating"]
        )
        db.add(prod_obj)
    db.commit()
    print(f"[SUCCESS] {len(INITIAL_PRODUCTS)} Products seeded successfully across 8 categories.")

    # Generate 1,000 Realistic Synthetic Orders with 12 granular affinity clusters & customer session context
    db.query(SyntheticOrder).delete()
    random.seed(42)
    np.random.seed(42)

    orders_list = []
    all_prod_ids = [p["id"] for p in INITIAL_PRODUCTS]

    for i in range(1000):
        cust = random.choice(CUSTOMER_TYPES)
        order_items = set()
        
        # 85% probability: generate order based on 12 granular affinity clusters
        if random.random() < 0.85:
            group_idx = cust["affinity_idx"] if random.random() < 0.70 else random.randint(0, len(AFFINITY_GROUPS) - 1)
            group = AFFINITY_GROUPS[group_idx]
            
            num_items = random.choices([1, 2, 3, 4], weights=[0.20, 0.50, 0.20, 0.10])[0]
            selected = random.sample(group, min(num_items, len(group)))
            order_items.update(selected)
        else:
            primary = random.choice(all_prod_ids)
            order_items.add(primary)
            if random.random() < 0.50:
                order_items.add(random.choice(all_prod_ids))

        order_id = f"synth_ord_{i+1:04d}"
        order_items_json = json.dumps(list(order_items))

        synth_obj = SyntheticOrder(
            id=order_id,
            product_ids=order_items_json
        )
        db.add(synth_obj)
        orders_list.append({
            "id": order_id, 
            "products": list(order_items),
            "customer_type": cust["type"],
            "budget_tier": cust["budget_tier"]
        })

    db.commit()
    print(f"[SUCCESS] {len(orders_list)} Synthetic Orders generated with 12 granular co-purchase affinity clusters.")

    # Export to CSV for audit/versioning
    df_orders = pd.DataFrame([
        {
            "order_id": o["id"], 
            "products_json": json.dumps(o["products"]),
            "customer_type": o["customer_type"],
            "budget_tier": o["budget_tier"]
        } for o in orders_list
    ])
    csv_path = "synthetic_orders.csv"
    df_orders.to_csv(csv_path, index=False)
    print(f"[DATA] Saved synthetic purchase history dataset to '{csv_path}'.")

    # Trigger ML Training & Weight Grid Search Evaluation
    print("\n------------------------------------------------------")
    print("[ML INITIATION] Triggering 80/20 Train/Test ML Model Training & Weight Optimization...")
    print("------------------------------------------------------")
    db_products = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "image": p.image,
            "stock": p.stock,
            "sales_velocity": p.sales_velocity,
            "tags": json.loads(p.tags) if isinstance(p.tags, str) else p.tags,
            "rating": p.rating
        } for p in db.query(Product).all()
    ]
    db_orders = [{"id": o.id, "product_ids": json.loads(o.product_ids)} for o in db.query(SyntheticOrder).all()]
    
    ml_recommender.train(db_products, db_orders, force_retrain=True)

    db.close()

if __name__ == "__main__":
    seed_database()

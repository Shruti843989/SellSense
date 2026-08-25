import uvicorn
import os

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"\n======================================================")
    print(f"[START] Starting NudgeAI FastAPI Backend on http://localhost:{port}")
    print(f"======================================================\n")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)

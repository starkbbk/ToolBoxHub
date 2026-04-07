from typing import Dict, List
from fastapi import WebSocket
import datetime
import json

class ProgressManager:
    def __init__(self):
        self.connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, project_id: int, websocket: WebSocket):
        await websocket.accept()
        if project_id not in self.connections:
            self.connections[project_id] = []
        self.connections[project_id].append(websocket)

    def disconnect(self, project_id: int, websocket: WebSocket):
        if project_id in self.connections:
            if websocket in self.connections[project_id]:
                self.connections[project_id].remove(websocket)
            if not self.connections[project_id]:
                del self.connections[project_id]

    async def send_update(self, project_id: int, step: str, progress: float, message: str):
        if project_id in self.connections:
            payload = {
                "step": step,
                "progress": float(round(progress, 2)),
                "message": message,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            dead_sockets = []
            for websocket in self.connections[project_id]:
                try:
                    await websocket.send_json(payload)
                except Exception:
                    dead_sockets.append(websocket)
            
            for dead in dead_sockets:
                self.disconnect(project_id, dead)

progress_manager = ProgressManager()

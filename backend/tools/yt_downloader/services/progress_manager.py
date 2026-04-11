from typing import Dict, List
from fastapi import WebSocket
import datetime

class YTDownloaderProgressManager:
    def __init__(self):
        # Maps download_id to a list of connected WebSockets
        self.connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, download_id: int, websocket: WebSocket):
        await websocket.accept()
        if download_id not in self.connections:
            self.connections[download_id] = []
        self.connections[download_id].append(websocket)

    def disconnect(self, download_id: int, websocket: WebSocket):
        if download_id in self.connections:
            if websocket in self.connections[download_id]:
                self.connections[download_id].remove(websocket)
            if not self.connections[download_id]:
                del self.connections[download_id]

    async def send_update(self, download_id: int, step: str, progress: float, message: str, speed: str = None, eta: str = None):
        if download_id in self.connections:
            payload = {
                "step": step,
                "progress": float(round(progress, 2)),
                "speed": speed,
                "eta": eta,
                "message": message,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            dead_sockets = []
            for websocket in self.connections[download_id]:
                try:
                    await websocket.send_json(payload)
                except Exception:
                    dead_sockets.append(websocket)
            
            for dead in dead_sockets:
                self.disconnect(download_id, dead)

progress_manager = YTDownloaderProgressManager()

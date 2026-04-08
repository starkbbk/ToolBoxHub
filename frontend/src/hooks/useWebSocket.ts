"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WS_URL } from "@/constants";
import { WSMessage } from "@/lib/types";

export function useWebSocket(projectId: number) {
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const maxReconnects = 5;

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname || "localhost";
    const finalWsUrl = `${wsProtocol}//${host}:8000/ws/clipmaster/progress/${projectId}`;
    
    console.log("Connecting to WebSocket:", finalWsUrl);
    const socket = new WebSocket(finalWsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setError(null);
      reconnectCount.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error", err);
      setError("Connection error");
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
      
      if (reconnectCount.current < maxReconnects) {
        reconnectCount.current += 1;
        setTimeout(connect, 2000);
      } else {
        setError("Connection lost. Please refresh.");
      }
    };
  }, [projectId]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.close();
    };
  }, [connect]);

  return { lastMessage, isConnected, error };
}

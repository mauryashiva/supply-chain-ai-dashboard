import { useEffect } from "react";

export const useInventorySocket = (onUpdate: () => void) => {
  useEffect(() => {
    // Connect to the FastAPI WebSocket
    const socket = new WebSocket("ws://localhost:8000/ws/inventory");

    socket.onmessage = (event) => {
      if (event.data === "inventory_updated") {
        console.log("Real-time update received!");
        onUpdate(); // This triggers the re-fetch
      }
    };

    socket.onerror = (error) => console.error("WebSocket Error:", error);

    // Cleanup on unmount
    return () => socket.close();
  }, [onUpdate]);
};

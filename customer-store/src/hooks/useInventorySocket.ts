import { useEffect } from "react";

export const useInventorySocket = (onUpdate: () => void) => {
  useEffect(() => {
    // Get backend URL from ENV
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    if (!baseUrl) {
      console.error("VITE_API_BASE_URL is missing in .env");
      return;
    }

    // Convert http -> ws, https -> wss automatically
    const wsUrl = `${baseUrl.replace(/^http/, "ws")}/ws/inventory`;

    console.log("Connecting WebSocket to:", wsUrl);

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket Connected");
    };

    socket.onmessage = (event) => {
      console.log("WS Message:", event.data);

      // Listen to BOTH real-time events
      if (
        event.data === "inventory_updated" ||
        event.data === "order_updated"
      ) {
        console.log("Real-time update triggered");
        onUpdate(); // Auto refresh data
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket Closed");
    };

    return () => {
      socket.close();
    };
  }, [onUpdate]);
};

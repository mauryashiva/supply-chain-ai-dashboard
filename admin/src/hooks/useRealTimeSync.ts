import { useEffect } from "react";

/**
 * Hook to listen for real-time updates from the backend.
 * Triggers a callback (like refetching orders) when a message is received.
 */
export const useRealTimeSync = (onUpdate: () => void) => {
  useEffect(() => {
    // Connect to the existing WebSocket endpoint
    const socket = new WebSocket("ws://localhost:8000/ws/inventory");

    socket.onmessage = (event) => {
      // If any inventory or order change happens, the backend sends this string
      if (event.data === "inventory_updated") {
        console.log("Real-time sync triggered: refreshing data...");
        onUpdate();
      }
    };

    socket.onerror = (err) => console.error("WebSocket Error:", err);

    return () => socket.close();
  }, [onUpdate]);
};

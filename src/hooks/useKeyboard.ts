"use client";

import { useEffect } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

export function useKeyboard(handlers: { [key: string]: KeyHandler }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const handler = handlers[event.key.toLowerCase()] || handlers[event.code.toLowerCase()];
      if (handler) {
        // event.preventDefault(); // Optional: prevent default if you want to swallow the key
        handler(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlers]);
}

/// <reference types="vite/client" />

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        HapticFeedback?: { impactOccurred?: (style: string) => void };
      };
    };
  }
}
export {};

/// <reference types="vite/client" />

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        // Signed login data; the server verifies it with the bot token.
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        showAlert?: (message: string) => void;
        HapticFeedback?: { impactOccurred?: (style: string) => void };
      };
    };
  }
}
export {};

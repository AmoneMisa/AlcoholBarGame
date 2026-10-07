/// <reference types="vite/client" />
/// <reference types="@webgpu/types" />

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        // Signed login data; the server verifies it with the bot token.
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        requestWriteAccess?: (callback: (allowed: boolean) => void) => void;
        showAlert?: (message: string) => void;
        openTelegramLink?: (url: string) => void;
        openInvoice?: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
        HapticFeedback?: { impactOccurred?: (style: string) => void };
      };
    };
  }
}
export {};

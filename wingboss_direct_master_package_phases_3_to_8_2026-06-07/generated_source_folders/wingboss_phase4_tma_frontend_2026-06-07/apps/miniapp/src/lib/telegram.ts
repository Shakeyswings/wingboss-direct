declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
            language_code?: string;
          };
        };
      };
    };
  }
}

export function getTelegramWebApp() {
  return window.Telegram?.WebApp ?? null;
}

export function isTelegramRuntime() {
  return Boolean(getTelegramWebApp());
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (!tg) return null;
  tg.ready();
  tg.expand();
  return tg;
}

export function sendOrderToTelegram(payload: unknown) {
  const tg = getTelegramWebApp();
  if (!tg) return { ok: false, reason: 'NOT_IN_TELEGRAM' as const };
  tg.sendData(JSON.stringify(payload));
  return { ok: true as const };
}

import { useEffect, useMemo } from 'react';
import { initTelegramApp, isTelegramRuntime } from '../lib/telegram';

export function useTelegramWebApp() {
  useEffect(() => { initTelegramApp(); }, []);
  return useMemo(() => ({ isTelegram: isTelegramRuntime(), user: window.Telegram?.WebApp?.initDataUnsafe?.user ?? null }), []);
}

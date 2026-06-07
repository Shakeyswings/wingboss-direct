import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

export function AppHeader({ lang, setLang }: { lang: string; setLang: (lang: string) => void }) {
  const { isTelegram, user } = useTelegramWebApp();
  return <header className="app-header">
    <div>
      <div className="brand">Wing⚡Boss Direct</div>
      <div className="subtle">Telegram ordering • Staff confirms shortly</div>
    </div>
    <div className="header-controls">
      <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
        <option value="en">EN</option><option value="km">KM</option><option value="zh">中文</option><option value="ko">KO</option><option value="ja">JA</option><option value="ru">RU</option>
      </select>
      <span className={isTelegram ? 'pill ok' : 'pill warn'}>{isTelegram ? 'Telegram' : 'Test'}</span>
      {user?.first_name ? <span className="pill">{user.first_name}</span> : null}
    </div>
  </header>;
}

import { useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { HomePage } from './pages/HomePage';
import { OrderBuilderPage } from './pages/OrderBuilderPage';
import { ReviewPage } from './pages/ReviewPage';
import { SentPage } from './pages/SentPage';
import { StaffAcademyPage } from './pages/StaffAcademyPage';
import { createEmptyCustomer } from './lib/order';
import { readStorage, writeStorage } from './lib/storage';
import type { HeatProfile, OrderDraft } from './types/app';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

function createDraft(): OrderDraft {
  return { lines: [], customer: createEmptyCustomer(), createdAt: new Date().toISOString() };
}

function createHeatProfile(): HeatProfile {
  return {
    heat_points_available: 0,
    heat_points_lifetime: 0,
    heat_spend_lifetime_usd: 0,
    heat_points_redeemed_total: 0,
    max_heat_level_reached: 'original',
    bottles_purchased_count: {},
    last_redeem_at: null,
  };
}

type Screen = 'home' | 'order' | 'review' | 'sent' | 'staff';

export default function App() {
  const [lang, setLangState] = useState(() => readStorage('wingboss.lang.v1', 'en'));
  const [screen, setScreen] = useState<Screen>('home');
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<OrderDraft>(() => createDraft());
  const [sentPayload, setSentPayload] = useState<unknown>(null);
  const [sentToTelegram, setSentToTelegram] = useState(false);
  const heatProfile = useMemo(() => readStorage<HeatProfile>('wingboss.heatProfile.v1', createHeatProfile()), []);
  const lastOrder = readStorage<OrderDraft | null>('wingboss.lastOrder.v1', null);

  function setLang(lang: string) { setLangState(lang); writeStorage('wingboss.lang.v1', lang); }
  function start() { setDraft(createDraft()); setStep(1); setScreen('order'); }
  function reorder() { if (lastOrder) { setDraft(lastOrder); setStep(3); setScreen('review'); } }
  function onSent(payload: unknown, ok: boolean) { setSentPayload(payload); setSentToTelegram(ok); setScreen('sent'); }

  return <div className="app-shell">
    <AppHeader lang={lang} setLang={setLang} />
    {screen === 'home' ? <HomePage onStart={start} hasLastOrder={Boolean(lastOrder)} onReorder={reorder} onStaff={() => setScreen('staff')} /> : null}
    {screen === 'order' ? <OrderBuilderPage step={step} setStep={setStep} draft={draft} setDraft={setDraft} onReview={() => setScreen('review')} /> : null}
    {screen === 'review' ? <ReviewPage draft={draft} setDraft={setDraft} heatProfile={heatProfile} onBack={() => setScreen('order')} onSent={onSent} /> : null}
    {screen === 'sent' ? <SentPage payload={sentPayload} sentToTelegram={sentToTelegram} onHome={() => setScreen('home')} /> : null}
    {screen === 'staff' ? <StaffAcademyPage onHome={() => setScreen('home')} /> : null}
  </div>;
}

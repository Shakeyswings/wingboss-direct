import { OrderSummary } from '../components/OrderSummary';
import type { HeatProfile, OrderDraft } from '../types/app';
import { validateDraft, buildTelegramPayload } from '../lib/order';
import { sendOrderToTelegram } from '../lib/telegram';
import { writeStorage } from '../lib/storage';

export function ReviewPage({ draft, setDraft, heatProfile, onBack, onSent }: { draft: OrderDraft; setDraft: (draft: OrderDraft) => void; heatProfile: HeatProfile; onBack: () => void; onSent: (payload: unknown, sentToTelegram: boolean) => void }) {
  const issues = validateDraft(draft);
  function submit() {
    const payload = buildTelegramPayload(draft);
    writeStorage('wingboss.lastOrder.v1', draft);
    const result = sendOrderToTelegram(payload);
    onSent(payload, result.ok);
  }
  return <main className="page">
    <h1>Review Order</h1>
    <section className="card">
      <h2>Customer Details</h2>
      <label>Name<input value={draft.customer.name} onChange={(e) => setDraft({ ...draft, customer: { ...draft.customer, name: e.target.value.slice(0, 80) } })} /></label>
      <label>Phone<input value={draft.customer.phone} onChange={(e) => setDraft({ ...draft, customer: { ...draft.customer, phone: e.target.value.slice(0, 40) } })} /></label>
      <label>Order Type<select value={draft.customer.orderType} onChange={(e) => setDraft({ ...draft, customer: { ...draft.customer, orderType: e.target.value as 'pickup' | 'delivery' } })}><option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></label>
      {draft.customer.orderType === 'delivery' ? <label>Delivery Address<textarea value={draft.customer.address} onChange={(e) => setDraft({ ...draft, customer: { ...draft.customer, address: e.target.value.slice(0, 300) } })} /></label> : null}
      <label>Customer Notes<textarea value={draft.customer.notes} onChange={(e) => setDraft({ ...draft, customer: { ...draft.customer, notes: e.target.value.slice(0, 300) } })} /></label>
    </section>
    <OrderSummary draft={draft} heatProfile={heatProfile} />
    {issues.length ? <section className="card warning"><strong>Fix before sending:</strong><ul>{issues.map((i) => <li key={i}>{i}</li>)}</ul></section> : null}
    <div className="sticky-actions"><button className="secondary" onClick={onBack}>Edit Order</button><button className="primary" disabled={issues.length > 0} onClick={submit}>Send Order to Telegram</button></div>
  </main>;
}

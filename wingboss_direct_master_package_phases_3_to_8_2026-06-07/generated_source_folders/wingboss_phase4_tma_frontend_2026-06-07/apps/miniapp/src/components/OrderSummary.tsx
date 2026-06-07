import type { OrderDraft, HeatProfile } from '../types/app';
import { formatPrice } from '../lib/price';
import { linePrice, orderPricing } from '../lib/order';
import { HeatMeter } from './HeatMeter';

export function OrderSummary({ draft, heatProfile }: { draft: OrderDraft; heatProfile: HeatProfile }) {
  const pricing = orderPricing(draft.lines);
  return <section className="card">
    <h2>Order Summary</h2>
    {!draft.lines.length ? <p className="subtle">No items yet.</p> : draft.lines.map((line) => {
      const p = linePrice(line);
      return <div className="summary-line" key={line.lineId}>
        <div><strong>{line.quantity}× {line.item.name}</strong></div>
        <div className="subtle">Flavor: {line.flavor?.name || 'None selected'} • Heat: {line.heatTierId}</div>
        {line.addons.length ? <div className="subtle">Add-ons: {line.addons.map((a) => a.name).join(', ')}</div> : null}
        {line.notes ? <div className="subtle">Note: {line.notes}</div> : null}
        <div>{p.verified ? `$${p.total.toFixed(2)}` : 'Staff will confirm'}</div>
      </div>;
    })}
    <HeatMeter lines={draft.lines} profile={heatProfile} />
    <div className="total-row"><strong>Total</strong><strong>{pricing.verified ? `$${pricing.total.toFixed(2)}` : 'Staff will confirm'}</strong></div>
    {!pricing.verified ? <div className="warning">Some prices are missing from the source menu. Staff must confirm final total.</div> : null}
  </section>;
}

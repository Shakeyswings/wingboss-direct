import menu from '../data/menu.json';
import flavorsData from '../data/flavors.json';
import addonsData from '../data/addons.json';
import { StepProgress } from '../components/StepProgress';
import { formatPrice } from '../lib/price';
import { createOrderLine } from '../lib/order';
import { getHeatTiers } from '../lib/heat';
import type { Addon, Flavor, MenuItem, OrderDraft } from '../types/app';

const items = menu.items as MenuItem[];
const flavors = (flavorsData.flavors as Flavor[]).filter((f) => f.includedAsWingFlavor !== false);
const addons = addonsData.addons as Addon[];

export function OrderBuilderPage({ step, setStep, draft, setDraft, onReview }: { step: number; setStep: (n: number) => void; draft: OrderDraft; setDraft: (draft: OrderDraft) => void; onReview: () => void }) {
  const activeLine = draft.lines[0] || null;
  function chooseItem(item: MenuItem) {
    if (!item.available) return;
    const flavor = item.requiresFlavor ? null : null;
    setDraft({ ...draft, lines: [createOrderLine(item, flavor)] });
    setStep(item.requiresFlavor ? 2 : 3);
  }
  function patchLine(patch: any) {
    if (!activeLine) return;
    setDraft({ ...draft, lines: [{ ...activeLine, ...patch }] });
  }
  function toggleAddon(addon: Addon) {
    if (!activeLine || !addon.available) return;
    const exists = activeLine.addons.some((a) => a.id === addon.id);
    patchLine({ addons: exists ? activeLine.addons.filter((a) => a.id !== addon.id) : [...activeLine.addons, addon] });
  }

  return <main className="page">
    <StepProgress step={step} />
    {step === 1 ? <section className="grid-list">
      <h2>STEP 1 — Pick Your Item</h2>
      {items.map((item) => <button key={item.id} className={item.available ? 'card item-card' : 'card item-card disabled'} onClick={() => chooseItem(item)}>
        <span className="item-title">{item.name}</span>
        <span className="subtle">{item.customerDescription}</span>
        <span>{formatPrice(item.price)}</span>
        {!item.available ? <span className="warning">Unavailable</span> : null}
      </button>)}
    </section> : null}

    {step === 2 && activeLine ? <section className="grid-list">
      <h2>STEP 2 — Pick Your Flavor</h2>
      <div className="subtle">Advanced options stay available, but the customer is not forced through extra education.</div>
      {flavors.map((flavor) => <button key={flavor.id} className={flavor.available ? 'card flavor-card' : 'card flavor-card disabled'} onClick={() => flavor.available && patchLine({ flavor })}>
        <span className="item-title">{flavor.number ? `#${flavor.number} ` : ''}{flavor.name}</span>
        <span className="subtle">{flavor.type} {flavor.heatLevel ? `• ${flavor.heatLevel}` : ''}</span>
        <span>{formatPrice(flavor.price)}</span>
        {activeLine.flavor?.id === flavor.id ? <span className="pill ok">Selected</span> : null}
        {!flavor.available ? <span className="warning">Unavailable</span> : null}
      </button>)}
      <div className="sticky-actions"><button className="secondary" onClick={() => setStep(1)}>Back</button><button className="primary" disabled={activeLine.item.requiresFlavor && !activeLine.flavor} onClick={() => setStep(3)}>Next</button></div>
    </section> : null}

    {step === 3 && activeLine ? <section className="grid-list">
      <h2>STEP 3 — Add Extras / Review / Send</h2>
      <div className="card">
        <label>Quantity<input type="number" min="1" max="99" value={activeLine.quantity} onChange={(e) => patchLine({ quantity: Math.max(1, Number(e.target.value || 1)) })} /></label>
        <label>Heat Tier<select value={activeLine.heatTierId} onChange={(e) => patchLine({ heatTierId: e.target.value })}>{getHeatTiers().map((tier) => <option key={tier.id} value={tier.id}>{tier.display} (+${tier.priceUsd.toFixed(2)})</option>)}</select></label>
        <label>Item Notes<textarea value={activeLine.notes} onChange={(e) => patchLine({ notes: e.target.value.slice(0, 300) })} placeholder="No onions, sauce on side, etc." /></label>
      </div>
      <h3>Add-ons</h3>
      {addons.map((addon) => <button key={addon.id} className={addon.available ? 'card addon-card' : 'card addon-card disabled'} onClick={() => toggleAddon(addon)}>
        <span className="item-title">{addon.name}</span><span className="subtle">{addon.category}</span><span>{formatPrice(addon.price)}</span>
        {activeLine.addons.some((a) => a.id === addon.id) ? <span className="pill ok">Added</span> : null}
      </button>)}
      <div className="sticky-actions"><button className="secondary" onClick={() => activeLine.item.requiresFlavor ? setStep(2) : setStep(1)}>Back</button><button className="primary" onClick={onReview}>Review Order</button></div>
    </section> : null}
  </main>;
}

import { useState } from 'react';
import flavorsData from '../data/flavors.json';
import addonsData from '../data/addons.json';
import { StepProgress } from '../components/StepProgress';
import { formatPrice } from '../lib/price';
import { createOrderLine } from '../lib/order';
import { getHeatTiers } from '../lib/heat';
import type { Addon, Flavor, MenuItem, OrderDraft } from '../types/app';

const customerItems: MenuItem[] = [
  {
    id: 'wings_6',
    code: '6W',
    name: '6 Classic Wings',
    categoryId: 'wings',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: true,
    staffLabel: '6 Wings',
    customerDescription: 'Classic bone-in wings. Pick one flavor.',
    translationKey: 'wings_6'
  },
  {
    id: 'wings_12',
    code: '12W',
    name: '12 Classic Wings',
    categoryId: 'wings',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: true,
    staffLabel: '12 Wings',
    customerDescription: 'Classic bone-in wings. Good for sharing.',
    translationKey: 'wings_12'
  },
  {
    id: 'wings_20',
    code: '20W',
    name: '20 Classic Wings',
    categoryId: 'wings',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: true,
    staffLabel: '20 Wings',
    customerDescription: 'Classic bone-in wings for groups.',
    translationKey: 'wings_20'
  },
  {
    id: 'wings_48_tray',
    code: '48W',
    name: '48 Wing Party Tray',
    categoryId: 'party_trays',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: true,
    staffLabel: '48 Wing Tray',
    customerDescription: 'Party tray. Staff confirms flavor split and total.',
    translationKey: 'wings_48_tray'
  },
  {
    id: 'boneless_8',
    code: '8B',
    name: '8 Boneless Wings',
    categoryId: 'boneless',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: true,
    staffLabel: '8 Boneless',
    customerDescription: 'Boneless starts at 8 pieces.',
    translationKey: 'boneless_8'
  },
  {
    id: 'boneless_12',
    code: '12B',
    name: '12 Boneless Wings',
    categoryId: 'boneless',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: true,
    staffLabel: '12 Boneless',
    customerDescription: 'Boneless wings with your chosen flavor.',
    translationKey: 'boneless_12'
  },
  {
    id: 'boneless_20',
    code: '20B',
    name: '20 Boneless Wings',
    categoryId: 'boneless',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: true,
    staffLabel: '20 Boneless',
    customerDescription: 'Boneless wings for sharing.',
    translationKey: 'boneless_20'
  },
  {
    id: 'burger_classic',
    code: 'CB',
    name: 'Classic Burger',
    categoryId: 'burgers',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: false,
    staffLabel: 'Classic Burger',
    customerDescription: 'Burger item. Staff confirms final build and total.',
    translationKey: 'burger_classic'
  },
  {
    id: 'burger_double',
    code: 'DB',
    name: 'Double Burger',
    categoryId: 'burgers',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: false,
    staffLabel: 'Double Burger',
    customerDescription: 'Double burger. Staff confirms final build and total.',
    translationKey: 'burger_double'
  },
  {
    id: 'fries_regular',
    code: 'FR',
    name: 'Regular Fries',
    categoryId: 'sides',
    price: 'PRICE_REQUIRED_FROM_MENU',
    available: true,
    requiresFlavor: false,
    staffLabel: 'Regular Fries',
    customerDescription: 'Side item. Choose add-ons on the next screen if needed.',
    translationKey: 'fries_regular'
  }
];

const allFlavors = (flavorsData.flavors as Flavor[]).filter((f) => f.includedAsWingFlavor !== false);

const coreFlavorOrder = [
  'Buffalo',
  'Jerk',
  'Jamaican Jerk',
  'Homemade BBQ',
  'BBQ',
  'Honey Garlic',
  'Honey Teriyaki',
  'Khmer Chili',
  'Korean Yangnyeom',
  'Train to Busan',
  'Fire Storm',
  'Firestorm'
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isDryRub(flavor: Flavor) {
  return normalize(flavor.type || '').includes('dry') || normalize(flavor.name).includes('rub');
}

function flavorRank(flavor: Flavor) {
  const name = normalize(flavor.name);
  const exact = coreFlavorOrder.findIndex((label) => normalize(label) === name);
  if (exact >= 0) return exact;

  const partial = coreFlavorOrder.findIndex((label) => name.includes(normalize(label)) || normalize(label).includes(name));
  if (partial >= 0) return partial;

  if (isDryRub(flavor)) return 100;

  return 999;
}

const coreFlavors = allFlavors
  .filter((flavor) => flavor.available && flavorRank(flavor) < 100)
  .sort((a, b) => flavorRank(a) - flavorRank(b) || (a.number || 999) - (b.number || 999));

const dryRubFlavors = allFlavors
  .filter((flavor) => flavor.available && isDryRub(flavor))
  .sort((a, b) => (a.number || 999) - (b.number || 999));

const expertFlavors = allFlavors
  .filter((flavor) => flavor.available && flavorRank(flavor) === 999 && !isDryRub(flavor))
  .sort((a, b) => (a.number || 999) - (b.number || 999));

const unavailableFlavors = allFlavors
  .filter((flavor) => !flavor.available)
  .sort((a, b) => (a.number || 999) - (b.number || 999));

const addons = addonsData.addons as Addon[];

function groupAddons(category: string) {
  const needle = normalize(category);
  return addons.filter((addon) => addon.available && normalize(addon.category || '').includes(needle));
}

const dipAddons = addons.filter((addon) => addon.available && ['dip', 'dips', 'sauce', 'ranch'].some((word) => normalize(addon.category + addon.name).includes(word)));
const drizzleAddons = groupAddons('drizzle');
const bottleAddons = addons.filter((addon) => addon.available && ['bottle', 'armageddon', 'mayhem'].some((word) => normalize(addon.category + addon.name).includes(word)));
const otherAddons = addons.filter((addon) =>
  addon.available &&
  !dipAddons.some((a) => a.id === addon.id) &&
  !drizzleAddons.some((a) => a.id === addon.id) &&
  !bottleAddons.some((a) => a.id === addon.id)
);

export function OrderBuilderPage({
  step,
  setStep,
  draft,
  setDraft,
  onReview
}: {
  step: number;
  setStep: (n: number) => void;
  draft: OrderDraft;
  setDraft: (draft: OrderDraft) => void;
  onReview: () => void;
}) {
  const [showExpert, setShowExpert] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const activeLine = draft.lines[0] || null;

  function chooseItem(item: MenuItem) {
    if (!item.available) return;
    setDraft({ ...draft, lines: [createOrderLine(item, null)] });
    setStep(item.requiresFlavor ? 2 : 3);
  }

  function patchLine(patch: Partial<typeof activeLine>) {
    if (!activeLine) return;
    setDraft({ ...draft, lines: [{ ...activeLine, ...patch }] });
  }

  function chooseFlavor(flavor: Flavor) {
    if (!activeLine || !flavor.available) return;
    patchLine({ flavor });
  }

  function toggleAddon(addon: Addon) {
    if (!activeLine || !addon.available) return;
    const exists = activeLine.addons.some((a) => a.id === addon.id);
    patchLine({
      addons: exists
        ? activeLine.addons.filter((a) => a.id !== addon.id)
        : [...activeLine.addons, addon]
    });
  }

  function FlavorButton({ flavor }: { flavor: Flavor }) {
    const selected = activeLine?.flavor?.id === flavor.id;
    return (
      <button
        key={flavor.id}
        className={flavor.available ? 'card flavor-card' : 'card flavor-card disabled'}
        onClick={() => chooseFlavor(flavor)}
      >
        <span className="item-title">{flavor.number ? `#${flavor.number} ` : ''}{flavor.name}</span>
        <span className="subtle">{flavor.type}{flavor.heatLevel ? ` • ${flavor.heatLevel}` : ''}</span>
        <span>{formatPrice(flavor.price)}</span>
        {selected ? <span className="pill ok">Selected</span> : null}
        {!flavor.available ? <span className="warning">Out of stock</span> : null}
      </button>
    );
  }

  function AddonGroup({ title, items }: { title: string; items: Addon[] }) {
    if (!items.length) return null;
    return (
      <>
        <h3>{title}</h3>
        {items.map((addon) => {
          const added = activeLine?.addons.some((a) => a.id === addon.id);
          return (
            <button
              key={addon.id}
              className={addon.available ? 'card addon-card' : 'card addon-card disabled'}
              onClick={() => toggleAddon(addon)}
            >
              <span className="item-title">{addon.name}</span>
              <span className="subtle">{addon.category}</span>
              <span>{formatPrice(addon.price)}</span>
              {added ? <span className="pill ok">Added</span> : null}
            </button>
          );
        })}
      </>
    );
  }

  return (
    <main className="page">
      <StepProgress step={step} />

      {step === 1 ? (
        <section className="grid-list">
          <h2>STEP 1 — Pick Your Item</h2>
          <div className="subtle">Choose the food first. Prices marked “Staff will confirm” need final menu pricing before live launch.</div>

          {customerItems.map((item) => (
            <button
              key={item.id}
              className={item.available ? 'card item-card' : 'card item-card disabled'}
              onClick={() => chooseItem(item)}
            >
              <span className="item-title">{item.name}</span>
              <span className="subtle">{item.customerDescription}</span>
              <span>{formatPrice(item.price)}</span>
              {!item.available ? <span className="warning">Unavailable</span> : null}
            </button>
          ))}
        </section>
      ) : null}

      {step === 2 && activeLine ? (
        <section className="grid-list">
          <h2>STEP 2 — Pick Your Flavor</h2>
          <div className="subtle">Core flavors first. Expert options stay hidden until requested.</div>

          <h3>Core Sauces</h3>
          {coreFlavors.map((flavor) => <FlavorButton key={flavor.id} flavor={flavor} />)}

          {dryRubFlavors.length ? (
            <>
              <h3>Dry Rubs</h3>
              {dryRubFlavors.map((flavor) => <FlavorButton key={flavor.id} flavor={flavor} />)}
            </>
          ) : null}

          {expertFlavors.length ? (
            <>
              <button className="card" onClick={() => setShowExpert(!showExpert)}>
                <span className="item-title">{showExpert ? 'Hide Expert Flavors' : 'Show Expert / Advanced Flavors'}</span>
                <span className="subtle">For experienced customers who already know the menu.</span>
              </button>

              {showExpert ? expertFlavors.map((flavor) => <FlavorButton key={flavor.id} flavor={flavor} />) : null}
            </>
          ) : null}

          {unavailableFlavors.length ? (
            <>
              <button className="card" onClick={() => setShowUnavailable(!showUnavailable)}>
                <span className="item-title">{showUnavailable ? 'Hide Out-of-Stock Flavors' : 'Show Out-of-Stock Flavors'}</span>
                <span className="subtle">Visible for staff awareness only. Customers cannot select these.</span>
              </button>

              {showUnavailable ? unavailableFlavors.map((flavor) => <FlavorButton key={flavor.id} flavor={flavor} />) : null}
            </>
          ) : null}

          <div className="sticky-actions">
            <button className="secondary" onClick={() => setStep(1)}>Back</button>
            <button
              className="primary"
              disabled={activeLine.item.requiresFlavor && !activeLine.flavor}
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 && activeLine ? (
        <section className="grid-list">
          <h2>STEP 3 — Add Extras / Review / Send</h2>

          <div className="card">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max="99"
                value={activeLine.quantity}
                onChange={(e) => patchLine({ quantity: Math.max(1, Number(e.target.value || 1)) })}
              />
            </label>

            <label>
              Heat Tier
              <select value={activeLine.heatTierId} onChange={(e) => patchLine({ heatTierId: e.target.value })}>
                {getHeatTiers().map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.display} (+${tier.priceUsd.toFixed(2)})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Item Notes
              <textarea
                value={activeLine.notes}
                onChange={(e) => patchLine({ notes: e.target.value.slice(0, 300) })}
                placeholder="No onions, sauce on side, extra crispy, etc."
              />
            </label>
          </div>

          <AddonGroup title="Dips" items={dipAddons} />
          <AddonGroup title="Drizzles" items={drizzleAddons} />
          <AddonGroup title="Hot Sauce Bottles" items={bottleAddons} />
          <AddonGroup title="Other Add-ons" items={otherAddons} />

          <div className="sticky-actions">
            <button className="secondary" onClick={() => activeLine.item.requiresFlavor ? setStep(2) : setStep(1)}>Back</button>
            <button className="primary" onClick={onReview}>Review Order</button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

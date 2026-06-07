import { useState } from 'react';
import { FoodTypePicker } from '../components/order/FoodTypePicker';
import { ItemSizePicker } from '../components/order/ItemSizePicker';
import { FlavorPicker } from '../components/order/FlavorPicker';
import { HeatTierPicker } from '../components/order/HeatTierPicker';
import { DipPicker } from '../components/order/DipPicker';
import { AddonPicker } from '../components/order/AddonPicker';
import { StickyOrderActions } from '../components/order/StickyOrderActions';
import { createOrderLine } from '../lib/order';
import { bottleAddons, burgerAddons, dipAddons, drizzleAddons, otherAddons } from '../order/addonGroups';
import { getItemsForGroup, type FoodType } from '../order/catalog';
import { isBurgerItem, isFriesItem, isPartyTray, isWingItem, needsHeatTier } from '../order/orderRules';
import type { Addon, Flavor, MenuItem, OrderDraft } from '../types/app';

export function OrderBuilderPage({
  step,
  setStep,
  draft,
  setDraft,
  onReview,
}: {
  step: number;
  setStep: (n: number) => void;
  draft: OrderDraft;
  setDraft: (draft: OrderDraft) => void;
  onReview: () => void;
}) {
  const activeLine = draft.lines[0] || null;
  const [selectedGroup, setSelectedGroup] = useState<FoodType | null>((activeLine?.item.categoryId as FoodType) || null);

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
    const exists = activeLine.addons.some((item) => item.id === addon.id);
    patchLine({
      addons: exists
        ? activeLine.addons.filter((item) => item.id !== addon.id)
        : [...activeLine.addons, addon],
    });
  }

  function setDip(addon: Addon | null) {
    if (!activeLine) return;
    const withoutDips = activeLine.addons.filter((item) => !dipAddons.some((dip) => dip.id === item.id));
    patchLine({ addons: addon ? [...withoutDips, addon] : withoutDips });
  }

  function renderStep3() {
    if (!activeLine) return null;
    const item = activeLine.item;

    return (
      <section className="stack order-builder with-sticky-space">
        <h2>STEP 3 — Add Extras / Review / Send</h2>

        <div className="panel">
          <h3>{item.name}</h3>
          <label className="field">
            <span>Quantity</span>
            <input
              type="number"
              min="1"
              value={activeLine.quantity}
              onChange={(event) => patchLine({ quantity: Math.max(1, Number(event.target.value || 1)) })}
            />
          </label>

          {needsHeatTier(item) ? (
            <HeatTierPicker value={activeLine.heatTierId} onChange={(heatTierId) => patchLine({ heatTierId })} />
          ) : null}

          {isPartyTray(item) ? (
            <p className="notice">Party tray flavor split and final total will be confirmed by staff before cooking.</p>
          ) : null}

          {isBurgerItem(item) ? (
            <div className="mini-checklist">
              <label><input type="checkbox" onChange={(event) => patchLine({ notes: `${activeLine.notes} ${event.target.checked ? 'No cheese.' : ''}`.trim() })} /> No Cheese</label>
              <label><input type="checkbox" onChange={(event) => patchLine({ notes: `${activeLine.notes} ${event.target.checked ? 'No mustard.' : ''}`.trim() })} /> No Mustard</label>
              <label><input type="checkbox" onChange={(event) => patchLine({ notes: `${activeLine.notes} ${event.target.checked ? 'No ketchup.' : ''}`.trim() })} /> No Ketchup</label>
            </div>
          ) : null}

          {isFriesItem(item) ? (
            <p className="notice">Choose seasoning, drizzle, or dip only if needed.</p>
          ) : null}
        </div>

        {(isWingItem(item) || isPartyTray(item) || isFriesItem(item)) ? (
          <DipPicker selectedAddons={activeLine.addons} onSetDip={setDip} />
        ) : null}

        {(isWingItem(item) || isPartyTray(item) || isFriesItem(item)) ? (
          <AddonPicker title="Drizzle" addons={drizzleAddons} selectedAddons={activeLine.addons} onToggle={toggleAddon} />
        ) : null}

        {(isWingItem(item) || isPartyTray(item)) ? (
          <AddonPicker title="Hot Sauce Bottles" addons={bottleAddons} selectedAddons={activeLine.addons} onToggle={toggleAddon} />
        ) : null}

        {isBurgerItem(item) ? (
          <AddonPicker title="Burger Add-ons" addons={burgerAddons} selectedAddons={activeLine.addons} onToggle={toggleAddon} />
        ) : null}

        <AddonPicker title="Other Add-ons" addons={otherAddons} selectedAddons={activeLine.addons} onToggle={toggleAddon} />

        <label className="field">
          <span>Item Notes</span>
          <textarea
            value={activeLine.notes}
            onChange={(event) => patchLine({ notes: event.target.value.slice(0, 300) })}
            placeholder="Extra crispy, sauce on side, no onions, etc."
          />
        </label>

        <StickyOrderActions
          onBack={() => setStep(activeLine.item.requiresFlavor ? 2 : 1)}
          onNext={onReview}
          nextLabel="Review Order"
        />
      </section>
    );
  }

  return (
    <main className="page">
      {step === 1 ? (
        <section className="stack order-builder with-sticky-space">
          <h2>STEP 1 — Pick Your Item</h2>
          <p>Choose the food first. Prices marked “Staff will confirm” need final menu pricing before live launch.</p>

          <FoodTypePicker selectedGroup={selectedGroup} onSelect={setSelectedGroup} />

          {selectedGroup ? (
            <>
              <h3>Choose Size / Item</h3>
              <ItemSizePicker
                items={getItemsForGroup(selectedGroup)}
                selectedItemId={activeLine?.item.id}
                onSelect={chooseItem}
              />
            </>
          ) : null}
        </section>
      ) : null}

      {step === 2 && activeLine ? (
        <section className="stack order-builder with-sticky-space">
          <h2>STEP 2 — Pick Your Flavor</h2>
          <p>Core sauces first. Expert options are hidden unless needed.</p>

          <FlavorPicker selectedFlavorId={activeLine.flavor?.id} onSelect={chooseFlavor} />

          <StickyOrderActions
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextLabel="Next"
            nextDisabled={!activeLine.flavor}
          />
        </section>
      ) : null}

      {step === 3 ? renderStep3() : null}
    </main>
  );
}

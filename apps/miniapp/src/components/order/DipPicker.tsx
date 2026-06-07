import { useMemo, useState } from 'react';
import { findDipAddon, getDipSauces, getDipSizesForSauce } from '../../order/addonGroups';
import type { Addon } from '../../types/app';

export function DipPicker({ selectedAddons, onSetDip }: {
  selectedAddons: Addon[];
  onSetDip: (addon: Addon | null) => void;
}) {
  const sauces = useMemo(() => getDipSauces(), []);
  const currentDip = selectedAddons.find((addon) => /\b(30ml|60ml|90ml)\b/i.test(addon.name));
  const inferredSauce = currentDip ? sauces.find((sauce) => sauce !== 'No Dip' && currentDip.name.toLowerCase().includes(sauce.toLowerCase())) || 'No Dip' : 'No Dip';
  const inferredSize = currentDip?.name.match(/\b(30ml|60ml|90ml)\b/i)?.[1] || '';

  const [sauce, setSauce] = useState(inferredSauce);
  const sizes = getDipSizesForSauce(sauce);

  function chooseSauce(nextSauce: string) {
    setSauce(nextSauce);
    if (nextSauce === 'No Dip') onSetDip(null);
  }

  function chooseSize(size: string) {
    const addon = findDipAddon(sauce, size);
    onSetDip(addon);
  }

  return (
    <div className="panel">
      <h3>Dipping Sauce</h3>
      <label className="field">
        <span>Choose sauce</span>
        <select value={sauce} onChange={(event) => chooseSauce(event.target.value)}>
          {sauces.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      {sauce !== 'No Dip' ? (
        <label className="field">
          <span>Choose size</span>
          <select value={inferredSize} onChange={(event) => chooseSize(event.target.value)}>
            <option value="">Select size</option>
            {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      ) : null}
    </div>
  );
}

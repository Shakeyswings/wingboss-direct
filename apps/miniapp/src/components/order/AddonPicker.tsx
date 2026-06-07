import { formatPrice } from '../../lib/price';
import type { Addon } from '../../types/app';

export function AddonPicker({ title, addons, selectedAddons, onToggle }: {
  title: string;
  addons: Addon[];
  selectedAddons: Addon[];
  onToggle: (addon: Addon) => void;
}) {
  if (!addons.length) return null;

  return (
    <div className="panel">
      <h3>{title}</h3>
      <div className="order-grid compact">
        {addons.map((addon) => {
          const selected = selectedAddons.some((item) => item.id === addon.id);
          return (
            <button
              key={addon.id}
              className={`card-button ${selected ? 'selected' : ''}`}
              onClick={() => onToggle(addon)}
            >
              <strong>{addon.name}</strong>
              <span>{addon.category}</span>
              <em>{formatPrice(addon.price)}</em>
            </button>
          );
        })}
      </div>
    </div>
  );
}

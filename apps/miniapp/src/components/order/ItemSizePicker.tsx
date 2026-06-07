import { formatPrice } from '../../lib/price';
import type { MenuItem } from '../../types/app';

export function ItemSizePicker({ items, selectedItemId, onSelect }: {
  items: MenuItem[];
  selectedItemId?: string;
  onSelect: (item: MenuItem) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="order-grid compact">
      {items.map((item) => (
        <button
          key={item.id}
          className={`card-button ${selectedItemId === item.id ? 'selected' : ''}`}
          disabled={!item.available}
          onClick={() => onSelect(item)}
        >
          <strong>{item.name}</strong>
          <span>{item.customerDescription}</span>
          <em>{formatPrice(item.price)}</em>
        </button>
      ))}
    </div>
  );
}

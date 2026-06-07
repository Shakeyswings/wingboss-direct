import { useState } from 'react';
import { formatPrice } from '../../lib/price';
import { coreFlavors, dryRubFlavors, expertFlavors, unavailableFlavors } from '../../order/flavorGroups';
import type { Flavor } from '../../types/app';

function FlavorButton({ flavor, selected, onSelect, disabled = false }: {
  flavor: Flavor;
  selected: boolean;
  onSelect: (flavor: Flavor) => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={`card-button ${selected ? 'selected' : ''}`}
      disabled={disabled || !flavor.available}
      onClick={() => onSelect(flavor)}
    >
      <strong>{flavor.number ? `#${flavor.number} ` : ''}{flavor.name}</strong>
      <span>{flavor.type}{flavor.heatLevel ? ` • ${flavor.heatLevel}` : ''}</span>
      <em>{formatPrice(flavor.price)}</em>
    </button>
  );
}

export function FlavorPicker({ selectedFlavorId, onSelect }: {
  selectedFlavorId?: string;
  onSelect: (flavor: Flavor) => void;
}) {
  const [showExpert, setShowExpert] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);

  return (
    <section className="stack">
      <h3>Core Sauces</h3>
      <div className="order-grid compact">
        {coreFlavors.map((flavor) => (
          <FlavorButton key={flavor.id} flavor={flavor} selected={selectedFlavorId === flavor.id} onSelect={onSelect} />
        ))}
      </div>

      {dryRubFlavors.length ? (
        <>
          <h3>Dry Rubs</h3>
          <div className="order-grid compact">
            {dryRubFlavors.map((flavor) => (
              <FlavorButton key={flavor.id} flavor={flavor} selected={selectedFlavorId === flavor.id} onSelect={onSelect} />
            ))}
          </div>
        </>
      ) : null}

      {expertFlavors.length ? (
        <>
          <button className="secondary full-width" onClick={() => setShowExpert(!showExpert)}>
            {showExpert ? 'Hide Expert / Advanced Flavors' : 'Show Expert / Advanced Flavors'}
          </button>
          {showExpert ? (
            <div className="order-grid compact">
              {expertFlavors.map((flavor) => (
                <FlavorButton key={flavor.id} flavor={flavor} selected={selectedFlavorId === flavor.id} onSelect={onSelect} />
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {unavailableFlavors.length ? (
        <>
          <button className="secondary full-width muted" onClick={() => setShowUnavailable(!showUnavailable)}>
            {showUnavailable ? 'Hide Out-of-Stock Flavors' : 'Show Out-of-Stock Flavors'}
          </button>
          {showUnavailable ? (
            <div className="order-grid compact">
              {unavailableFlavors.map((flavor) => (
                <FlavorButton key={flavor.id} flavor={flavor} selected={false} onSelect={onSelect} disabled />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

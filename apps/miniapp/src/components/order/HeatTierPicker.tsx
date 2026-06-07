import { getHeatTiers } from '../../lib/heat';

export function HeatTierPicker({ value, onChange }: {
  value: string;
  onChange: (heatTierId: string) => void;
}) {
  return (
    <label className="field">
      <span>Heat Tier</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {getHeatTiers().filter((tier) => tier.customerFacing && tier.available).map((tier) => (
          <option key={tier.id} value={tier.id}>
            {tier.display} (+${tier.priceUsd.toFixed(2)})
          </option>
        ))}
      </select>
    </label>
  );
}

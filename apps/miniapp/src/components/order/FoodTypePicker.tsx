import { foodGroups, type FoodType } from '../../order/catalog';

export function FoodTypePicker({ selectedGroup, onSelect }: {
  selectedGroup: FoodType | null;
  onSelect: (group: FoodType) => void;
}) {
  return (
    <div className="order-grid">
      {foodGroups.map((group) => (
        <button
          key={group.id}
          className={`card-button ${selectedGroup === group.id ? 'selected' : ''}`}
          onClick={() => onSelect(group.id)}
        >
          <strong>{group.label}</strong>
          <span>{group.description}</span>
        </button>
      ))}
    </div>
  );
}

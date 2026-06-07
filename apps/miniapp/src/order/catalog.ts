import type { MenuItem } from '../types/app';

export type FoodType = 'classic_wings' | 'boneless_wings' | 'burgers' | 'fries_sides' | 'party_trays';

export interface FoodGroup {
  id: FoodType;
  label: string;
  description: string;
}

export const foodGroups: FoodGroup[] = [
  { id: 'classic_wings', label: 'Classic Wings', description: 'Bone-in wings. Pick size, then flavor.' },
  { id: 'boneless_wings', label: 'Boneless Wings', description: 'Boneless starts at 8 pieces.' },
  { id: 'burgers', label: 'Burgers', description: 'Simple burger ordering. Staff confirms final build.' },
  { id: 'fries_sides', label: 'Fries & Sides', description: 'Fries and side items.' },
  { id: 'party_trays', label: 'Party Trays', description: 'Large trays. Staff confirms split rules.' },
];

export const customerItems: MenuItem[] = [
  { id: 'wings_6', code: '6W', name: '6 Classic Wings', categoryId: 'classic_wings', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: true, staffLabel: '6 Classic Wings', customerDescription: 'Classic bone-in wings.', translationKey: 'wings_6' },
  { id: 'wings_12', code: '12W', name: '12 Classic Wings', categoryId: 'classic_wings', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: true, staffLabel: '12 Classic Wings', customerDescription: 'Good for sharing.', translationKey: 'wings_12' },
  { id: 'wings_20', code: '20W', name: '20 Classic Wings', categoryId: 'classic_wings', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: true, staffLabel: '20 Classic Wings', customerDescription: 'Group size wings.', translationKey: 'wings_20' },

  { id: 'boneless_8', code: '8B', name: '8 Boneless Wings', categoryId: 'boneless_wings', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: true, staffLabel: '8 Boneless Wings', customerDescription: 'Boneless starts at 8 pieces.', translationKey: 'boneless_8' },
  { id: 'boneless_12', code: '12B', name: '12 Boneless Wings', categoryId: 'boneless_wings', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: true, staffLabel: '12 Boneless Wings', customerDescription: 'Boneless wings with your chosen flavor.', translationKey: 'boneless_12' },
  { id: 'boneless_20', code: '20B', name: '20 Boneless Wings', categoryId: 'boneless_wings', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: true, staffLabel: '20 Boneless Wings', customerDescription: 'Boneless wings for sharing.', translationKey: 'boneless_20' },

  { id: 'burger_classic', code: 'CB', name: 'Classic Burger', categoryId: 'burgers', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: false, staffLabel: 'Classic Burger', customerDescription: 'Burger item. Staff confirms final total.', translationKey: 'burger_classic' },
  { id: 'burger_double', code: 'DB', name: 'Double Burger', categoryId: 'burgers', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: false, staffLabel: 'Double Burger', customerDescription: 'Double burger. Staff confirms final total.', translationKey: 'burger_double' },

  { id: 'fries_regular', code: 'FR', name: 'Regular Fries', categoryId: 'fries_sides', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: false, staffLabel: 'Regular Fries', customerDescription: 'Choose seasoning or dip if needed.', translationKey: 'fries_regular' },

  { id: 'wings_48_tray', code: '48W', name: '48 Wing Party Tray', categoryId: 'party_trays', price: 'PRICE_REQUIRED_FROM_MENU', available: true, requiresFlavor: true, staffLabel: '48 Wing Party Tray', customerDescription: 'Staff confirms flavor split and total.', translationKey: 'wings_48_tray' },
];

export function getItemsForGroup(groupId: FoodType): MenuItem[] {
  return customerItems.filter((item) => item.categoryId === groupId);
}

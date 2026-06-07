export type PriceValue = number | "PRICE_REQUIRED_FROM_MENU" | string;

export interface MenuItem {
  id: string;
  code?: string;
  name: string;
  categoryId?: string;
  price: PriceValue;
  available: boolean;
  requiresFlavor?: boolean;
  requiredOptions?: string[];
  optionalOptions?: string[];
  staffLabel?: string;
  customerDescription?: string;
  translationKey?: string;
}

export interface Flavor {
  id: string;
  code?: string;
  number?: number | null;
  name: string;
  shortName?: string | null;
  type: string;
  heatLevel?: string | null;
  heatIcons?: string | null;
  includedAsWingFlavor?: boolean;
  price?: PriceValue;
  priceBasis?: string;
  available: boolean;
  status?: string;
  staffNote?: string | null;
  formula?: string | null;
}

export interface Addon {
  id: string;
  code?: string;
  name: string;
  category: string;
  price: PriceValue;
  priceBasis?: string;
  available: boolean;
}

export interface HeatTier {
  id: string;
  label: string;
  display: string;
  priceUsd: number;
  heatPointsPreview: number;
  customerFacing: boolean;
  available: boolean;
  rules?: string[];
}

export interface OrderLine {
  lineId: string;
  item: MenuItem;
  quantity: number;
  flavor?: Flavor | null;
  heatTierId: string;
  addons: Addon[];
  notes: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  orderType: 'pickup' | 'delivery';
  address: string;
  notes: string;
}

export interface OrderDraft {
  lines: OrderLine[];
  customer: CustomerDetails;
  createdAt: string;
}

export interface HeatProfile {
  heat_points_available: number;
  heat_points_lifetime: number;
  heat_spend_lifetime_usd: number;
  heat_points_redeemed_total: number;
  max_heat_level_reached: string;
  bottles_purchased_count: Record<string, number>;
  last_redeem_at: string | null;
}

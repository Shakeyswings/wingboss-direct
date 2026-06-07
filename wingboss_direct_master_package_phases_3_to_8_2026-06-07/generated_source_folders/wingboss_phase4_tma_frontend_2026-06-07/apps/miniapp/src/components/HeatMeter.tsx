import type { OrderLine, HeatProfile } from '../types/app';
import { calcHeatSpend, heatPointsFromSpend, getHeatMeter, shouldShowBottleSuggestion } from '../lib/heat';

export function HeatMeter({ lines, profile }: { lines: OrderLine[]; profile: HeatProfile }) {
  const spend = calcHeatSpend(lines);
  const points = heatPointsFromSpend(spend);
  const meter = getHeatMeter(points);
  const showBottle = shouldShowBottleSuggestion(spend, profile.heat_spend_lifetime_usd || 0);
  return <section className="card heat-card">
    <div className="row between"><strong>🔥 Heat Score</strong><span>{points} pts</span></div>
    <div className="heat-bar">{meter?.bar || '[□□□□□□□□□□]'}</div>
    <div className="subtle">{meter?.label || 'No added heat'} • Heat spend this cart: ${spend.toFixed(2)}</div>
    {profile.heat_points_available > 0 ? <div className="notice">Your Heat Score: {profile.heat_points_available.toLocaleString()} pts</div> : null}
    {showBottle ? <div className="warning">You are building serious heat. A bottle may be the smarter move.</div> : null}
  </section>;
}

import type { OrderDraft } from '../types/app';

export function HomePage({ onStart, onReorder, hasLastOrder, onStaff }: { onStart: () => void; onReorder: () => void; hasLastOrder: boolean; onStaff: () => void }) {
  return <main className="page home">
    <section className="hero card">
      <h1>Order Wing⚡Boss direct in Telegram</h1>
      <p>Fast reorder. Clear customization. Staff confirms shortly.</p>
      <button className="primary" onClick={onStart}>Start Order</button>
      {hasLastOrder ? <button className="secondary" onClick={onReorder}>Order Again</button> : null}
    </section>
    <section className="card compact">
      <h2>How it works</h2>
      <ol><li>Pick your item.</li><li>Pick your flavor.</li><li>Add extras, review, and send.</li></ol>
    </section>
    <button className="text-button" onClick={onStaff}>Staff Academy / Staff Mode</button>
  </main>;
}

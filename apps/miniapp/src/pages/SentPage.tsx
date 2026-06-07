export function SentPage({ payload, sentToTelegram, onHome }: { payload: unknown; sentToTelegram: boolean; onHome: () => void }) {
  return <main className="page">
    <section className="card hero">
      <h1>{sentToTelegram ? 'Order sent' : 'Order ready to copy'}</h1>
      <p>{sentToTelegram ? 'Staff will confirm shortly in Telegram.' : 'This test is not running inside Telegram. Copy this payload for backend testing.'}</p>
      {!sentToTelegram ? <pre className="payload">{JSON.stringify(payload, null, 2)}</pre> : null}
      <button className="primary" onClick={onHome}>Back Home</button>
    </section>
  </main>;
}

import academy from '../data/staff-academy.json';

export function StaffAcademyPage({ onHome }: { onHome: () => void }) {
  return <main className="page">
    <section className="card">
      <h1>Staff Academy</h1>
      <p className="subtle">Simple English is the source of truth. Khmer placeholders require review before live staff training.</p>
    </section>
    {(academy.lessons || []).map((lesson: any) => <article className="card lesson" key={lesson.id}>
      <div className="pill">{lesson.category}</div>
      <h2>{lesson.title}</h2>
      <p><strong>Simple English:</strong> {lesson.english}</p>
      <p><strong>Khmer:</strong> {lesson.khmer}</p>
      <p><strong>Example:</strong> {lesson.exampleOrder}</p>
      <p><strong>Staff Action:</strong> {lesson.staffAction}</p>
      <p><strong>Mistake to avoid:</strong> {lesson.commonMistake}</p>
      <details><summary>Quick check</summary><p>{lesson.checkQuestion}</p><p>{lesson.answer || 'ANSWER_REQUIRED'}</p></details>
    </article>)}
    <button className="secondary" onClick={onHome}>Back Home</button>
  </main>;
}

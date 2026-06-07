export function StepProgress({ step }: { step: number }) {
  return <div className="step-progress" aria-label={`Step ${step} of 3`}>
    {[1,2,3].map((n) => <div key={n} className={n === step ? 'step active' : n < step ? 'step done' : 'step'}>STEP {n}</div>)}
  </div>;
}

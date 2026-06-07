export function StickyOrderActions({ backLabel = 'Back', nextLabel, onBack, onNext, nextDisabled = false }: {
  backLabel?: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="sticky-actions safe-sticky">
      <button className="secondary" onClick={onBack}>{backLabel}</button>
      <button className="primary" disabled={nextDisabled} onClick={onNext}>{nextLabel}</button>
    </div>
  );
}

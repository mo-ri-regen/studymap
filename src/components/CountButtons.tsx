/** 解いた数を足し引きするボタン（「+1」「+5」「+10」など） */
export function CountButtons({
  steps,
  onAdd,
}: {
  steps: readonly number[];
  onAdd: (delta: number) => void;
}) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step) => (
        <button
          key={step}
          type="button"
          className="min-h-12 rounded-lg border border-brand text-base font-semibold text-brand-strong hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={() => onAdd(step)}
          aria-label={step > 0 ? `${step}問足す` : `${-step}問減らす`}
        >
          {step > 0 ? `+${step}` : `−${-step}`}
        </button>
      ))}
    </div>
  );
}

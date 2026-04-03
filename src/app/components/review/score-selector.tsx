import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const SCORE_LABELS: Record<number, string> = {
  1: "매우 미흡",
  2: "미흡",
  3: "보통",
  4: "우수",
  5: "매우 우수",
};

interface ScoreSelectorProps {
  name: string;
  description: string;
  value: number | null;
  onChange: (score: number) => void;
}

export function ScoreSelector({ name, description, value, onChange }: ScoreSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-sm">{name}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <RadioGroup
        value={value?.toString() || ""}
        onValueChange={(v) => onChange(parseInt(v))}
        className="flex gap-2"
      >
        {[1, 2, 3, 4, 5].map((score) => (
          <label
            key={score}
            className={`flex flex-col items-center gap-1.5 cursor-pointer rounded-lg border px-3 py-2 transition-all ${
              value === score
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-primary/40"
            }`}
          >
            <RadioGroupItem value={score.toString()} className="sr-only" />
            <span className={`text-lg font-semibold ${value === score ? "text-primary" : ""}`}>
              {score}
            </span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {SCORE_LABELS[score]}
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

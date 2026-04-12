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
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">{name}</h4>
        <p className="text-sm text-foreground/60 mt-1">{description}</p>
      </div>
      <RadioGroup
        value={value?.toString() || ""}
        onValueChange={(v) => onChange(parseInt(v))}
        className="flex gap-3"
      >
        {[1, 2, 3, 4, 5].map((score) => (
          <label
            key={score}
            className={`flex-1 flex flex-col items-center gap-2 cursor-pointer rounded-xl border-2 px-4 py-4 transition-all ${
              value === score
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-primary/40"
            }`}
          >
            <RadioGroupItem value={score.toString()} className="sr-only" />
            <span className={`text-2xl font-bold ${value === score ? "text-primary" : ""}`}>
              {score}
            </span>
            <span className={`text-xs ${value === score ? "text-primary font-medium" : "text-foreground/60"}`}>
              {SCORE_LABELS[score]}
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

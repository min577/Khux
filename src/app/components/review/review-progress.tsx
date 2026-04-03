interface ReviewProgressProps {
  label: string;
  done: number;
  total: number;
}

export function ReviewProgress({ label, done, total }: ReviewProgressProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = done >= total && total > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${isComplete ? "text-green-600" : ""}`}>
          {done}/{total}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete ? "bg-green-500" : "bg-primary"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

import { Check, Pencil, ChevronRight } from "lucide-react";

interface MemberCardProps {
  name: string;
  isLeader?: boolean;
  completed: boolean;
  onClick: () => void;
}

export function MemberCard({ name, isLeader, completed, onClick }: MemberCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/40 hover:bg-accent/50 transition-all text-left"
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          completed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
        }`}
      >
        {completed ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{name}</span>
          {isLeader && (
            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
              Leader
            </span>
          )}
        </div>
        <span className={`text-xs ${completed ? "text-green-600" : "text-muted-foreground"}`}>
          {completed ? "작성 완료" : "미작성"}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

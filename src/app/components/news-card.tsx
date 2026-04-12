import { Calendar } from "lucide-react";
import { NoticeItem } from "../data/mock-data";

interface NoticeCardProps {
  notice: NoticeItem;
}

export function NoticeCard({ notice }: NoticeCardProps) {
  const formattedDate = new Date(notice.date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {notice.imageUrl && (
        <img
          src={notice.imageUrl}
          alt={notice.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {notice.pinned && (
              <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded font-bold">고정</span>
            )}
            <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">
              {notice.category}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
        </div>
        <h3 className="mb-3">{notice.title}</h3>
        <p className="text-sm text-muted-foreground">{notice.content}</p>
      </div>
    </div>
  );
}

/** @deprecated Use NoticeCard instead */
export const NewsCard = NoticeCard;

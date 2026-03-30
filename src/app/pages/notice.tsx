import { useState } from "react";
import { ChevronDown, ChevronUp, Pin } from "lucide-react";

interface NoticeItem {
  id: number;
  title: string;
  category: string;
  date: string;
  content: string;
  important: boolean;
  author: string;
  views: number;
}

const mockNotices: NoticeItem[] = [
  {
    id: 1,
    title: "2025년 1학기 신입 부원 모집 공지",
    category: "모집",
    date: "2025-03-01",
    content: "KHUX 학회 신입 부원을 모집합니다. UX 디자인에 관심 있는 경희대학교 재학생이라면 누구나 지원 가능합니다. 지원서는 이메일(khux@khu.ac.kr)로 제출해주세요. 서류 합격자에 한해 면접 일정을 개별 안내드립니다.",
    important: true,
    author: "운영진",
    views: 142,
  },
  {
    id: 2,
    title: "3월 정기 세미나 일정 안내",
    category: "세미나",
    date: "2025-03-10",
    content: "3월 정기 세미나가 3월 22일(토) 오후 2시에 진행될 예정입니다. 장소는 경희대학교 전자정보대학 206호이며, 주제는 '사용자 리서치 방법론'입니다. 많은 참여 바랍니다.",
    important: false,
    author: "에듀팀",
    views: 89,
  },
  {
    id: 3,
    title: "학회비 납부 안내",
    category: "안내",
    date: "2025-03-15",
    content: "2025년 1학기 학회비 납부 기한은 3월 31일까지입니다. 계좌번호는 개별 안내된 카카오톡 메시지를 확인해주세요. 기한 내 미납 시 활동에 제한이 있을 수 있습니다.",
    important: true,
    author: "운영진",
    views: 210,
  },
  {
    id: 4,
    title: "KHUX 스터디 그룹 모집",
    category: "모집",
    date: "2025-03-18",
    content: "Figma 기초 스터디 그룹 멤버를 모집합니다. 매주 화요일 저녁 7시에 진행되며, 관심 있는 분은 운영진에게 DM 주세요.",
    important: false,
    author: "브랜드팀",
    views: 67,
  },
  {
    id: 5,
    title: "4월 외부 특강 안내",
    category: "특강",
    date: "2025-03-25",
    content: "현직 UX 디자이너를 초청한 외부 특강이 4월 중 예정되어 있습니다. 일정이 확정되는 대로 추가 공지 드리겠습니다.",
    important: false,
    author: "에듀팀",
    views: 53,
  },
];

const CATEGORIES = ["전체", "모집", "세미나", "안내", "특강"];

export function Notice() {
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockNotices.filter((n) => {
    const matchCategory = selectedCategory === "전체" || n.category === selectedCategory;
    const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const importantNotices = filtered.filter((n) => n.important);
  const normalNotices = filtered.filter((n) => !n.important);
  const sortedNotices = [...importantNotices, ...normalNotices];

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">공지사항</h1>
          <p className="text-muted-foreground text-lg">
            KHUX 학회의 공지사항을 확인하세요.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="공지사항 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 공지 개수 */}
        <p className="text-sm text-muted-foreground mb-4">
          총 {sortedNotices.length}개의 공지사항
        </p>

        {/* Notice List */}
        <div className="flex flex-col divide-y divide-border border rounded-xl overflow-hidden">
          {sortedNotices.map((notice) => (
            <div
              key={notice.id}
              className={`cursor-pointer transition-colors ${
                notice.important ? "bg-primary/5" : "bg-background"
              } hover:bg-accent/40`}
              onClick={() =>
                setExpandedId(expandedId === notice.id ? null : notice.id)
              }
            >
              {/* 목록 행 */}
              <div className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {notice.important && (
                    <Pin className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    notice.category === "모집" ? "bg-green-100 text-green-700" :
                    notice.category === "세미나" ? "bg-blue-100 text-blue-700" :
                    notice.category === "특강" ? "bg-purple-100 text-purple-700" :
                    "bg-accent text-muted-foreground"
                  }`}>
                    {notice.category}
                  </span>
                  <span className="font-medium text-sm truncate">{notice.title}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                  <span className="hidden sm:block">{notice.author}</span>
                  <span>{notice.date}</span>
                  <span className="hidden sm:block">조회 {notice.views}</span>
                  {expandedId === notice.id
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                </div>
              </div>

              {/* 펼쳐진 내용 */}
              {expandedId === notice.id && (
                <div className="px-5 pb-5 pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notice.content}
                  </p>
                </div>
              )}
            </div>
          ))}

          {sortedNotices.length === 0 && (
            <div className="text-center py-20 text-muted-foreground text-sm">
              검색 결과가 없습니다.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
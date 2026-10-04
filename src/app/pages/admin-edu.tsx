import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Download, GraduationCap, Lock, LogOut } from "lucide-react";
import { useReviewUser, reviewApiFetch } from "../../utils/review-auth";

interface EduQuestion {
  id: string;
  desc: string;
  options: string[];
}

interface EduResponse {
  respondent_id: string;
  respondent_name: string;
  team_name: string;
  answers: number[];
  comment: string;
  submitted_at: string;
}

interface EduData {
  title: string;
  questions: EduQuestion[];
  comment_question: { desc: string };
  responses: EduResponse[];
}

function downloadCsv(data: EduData) {
  const headers = [
    "응답자ID", "응답자", "소속팀",
    ...data.questions.map((q) => q.desc),
    ...data.questions.map((_, i) => `${i + 1}번(점수)`),
    data.comment_question.desc, "제출시간",
  ];
  const rows = data.responses.map((r) =>
    [
      r.respondent_id, r.respondent_name, r.team_name,
      ...r.answers.map((a, i) => data.questions[i].options[a]),
      // 5 = first option (매우 만족 / 매우 쉬웠다 ...) ... 1 = last option
      ...r.answers.map((a) => 5 - a),
      r.comment, r.submitted_at,
    ].map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = "﻿" + [headers.map((h) => `"${h}"`).join(","), ...rows].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `${data.title}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function AdminEdu() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useReviewUser();
  const [data, setData] = useState<EduData | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/review/login?redirect=${encodeURIComponent("/admin/edu")}`);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    reviewApiFetch("/edu-eval/responses")
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (!res.ok) throw new Error();
        setData(await res.json());
      })
      .catch(() => setError("데이터를 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="animate-pulse text-foreground/60">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-2">접근 권한이 없습니다</h1>
          <p className="text-sm text-muted-foreground mb-6">
            디스코드에서 Education 역할이 있는 멤버만 확인할 수 있습니다.
          </p>
          <button
            onClick={async () => { await logout(); navigate("/review/login?redirect=/admin/edu"); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <p className="text-sm text-destructive">{error || "데이터가 없습니다."}</p>
      </div>
    );
  }

  const total = data.responses.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <GraduationCap className="w-5 h-5 text-primary shrink-0" />
            <p className="font-medium truncate">{data.title}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-foreground/60 hidden sm:inline">{user.display_name}</span>
            <button
              onClick={async () => { await logout(); navigate("/review/login?redirect=/admin/edu"); }}
              className="p-1.5 text-foreground/60 hover:text-foreground transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-foreground/60">총 응답</p>
            <p className="text-3xl font-bold">{total}명</p>
          </div>
          <button
            onClick={() => downloadCsv(data)}
            disabled={total === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border bg-card rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            CSV 다운로드
          </button>
        </div>

        {/* Per-question distribution */}
        {data.questions.map((q, qi) => {
          const counts = q.options.map((_, oi) => data.responses.filter((r) => r.answers[qi] === oi).length);
          const avg = total ? data.responses.reduce((sum, r) => sum + (5 - r.answers[qi]), 0) / total : 0;
          return (
            <div key={q.id} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-semibold">{qi + 1}. {q.desc}</h2>
                {total > 0 && (
                  <span className="shrink-0 text-sm text-foreground/60">평균 {avg.toFixed(2)} / 5</span>
                )}
              </div>
              <div className="space-y-2">
                {q.options.map((option, oi) => {
                  const pct = total ? (counts[oi] / total) * 100 : 0;
                  return (
                    <div key={option} className="grid grid-cols-[150px,1fr,64px] items-center gap-3 text-sm">
                      <span className="truncate">{option}</span>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-right text-foreground/60">{counts[oi]}명</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Comments */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">5. {data.comment_question.desc}</h2>
          {total === 0 ? (
            <p className="text-sm text-foreground/60">아직 응답이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {data.responses.map((r) => (
                <li key={r.respondent_id} className="border border-border rounded-lg p-4">
                  <p className="text-xs text-foreground/60 mb-1.5">
                    {r.respondent_name}{r.team_name ? ` · ${r.team_name}` : ""} ·{" "}
                    {new Date(r.submitted_at).toLocaleString("ko-KR")}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

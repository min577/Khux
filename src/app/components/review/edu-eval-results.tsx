import { useEffect, useState } from "react";
import { Download, GraduationCap, RefreshCw } from "lucide-react";
import { apiFetchAuth } from "../../../utils/supabase-client";

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

// Results of the Discord /교육평가 survey, shown inside the PIN-gated peer review tab
export function EduEvalResults() {
  const [data, setData] = useState<EduData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetchAuth("/edu-eval/responses");
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("교육평가 결과를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = data?.responses.length ?? 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header (same layout as peer review groups) */}
      <div className="p-5 flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 hover:opacity-70 transition-opacity text-left"
        >
          <svg className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <GraduationCap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">{data?.title ?? "교육 만족도 조사"}</h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
            디스코드 /교육평가
          </span>
          <span className="text-sm text-muted-foreground">
            {loading && !data ? "불러오는 중..." : `응답 ${total}명`}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => data && downloadCsv(data)}
            disabled={!data || total === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {error && <p className="px-5 pb-4 text-sm text-destructive">{error}</p>}

      {/* Expanded results */}
      {expanded && data && (
        <div className="border-t border-border p-5 space-y-4">
          {data.questions.map((q, qi) => {
            const counts = q.options.map((_, oi) => data.responses.filter((r) => r.answers[qi] === oi).length);
            const avg = total ? data.responses.reduce((sum, r) => sum + (5 - r.answers[qi]), 0) / total : 0;
            return (
              <div key={q.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-medium text-sm">{qi + 1}. {q.desc}</h4>
                  {total > 0 && (
                    <span className="shrink-0 text-xs text-muted-foreground">평균 {avg.toFixed(2)} / 5</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {q.options.map((option, oi) => {
                    const pct = total ? (counts[oi] / total) * 100 : 0;
                    return (
                      <div key={option} className="grid grid-cols-[140px,1fr,48px] items-center gap-3 text-sm">
                        <span className="truncate">{option}</span>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-right text-muted-foreground">{counts[oi]}명</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="border border-border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">5. {data.comment_question.desc}</h4>
            {total === 0 ? (
              <p className="text-sm text-muted-foreground">아직 응답이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {data.responses.map((r) => (
                  <li key={r.respondent_id} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">
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
      )}
    </div>
  );
}

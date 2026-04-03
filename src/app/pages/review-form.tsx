import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Send, Check } from "lucide-react";
import { useReviewUser, reviewApiFetch } from "../../utils/review-auth";
import { ScoreSelector } from "../components/review/score-selector";

interface Criterion {
  name: string;
  desc: string;
}

interface SessionData {
  id: string;
  title: string;
  members: { discord_id: string; display_name: string; is_leader: boolean }[];
  criteria: Criterion[];
  leader_criteria: Criterion[];
}

export function ReviewForm() {
  const navigate = useNavigate();
  const { sessionId, targetId } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "common";

  const { user, loading: authLoading } = useReviewUser();
  const [session, setSession] = useState<SessionData | null>(null);
  const [scores, setScores] = useState<(number | null)[]>([null, null, null]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/review/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !sessionId) return;

    async function fetchData() {
      try {
        // Load session
        const sessionRes = await reviewApiFetch(`/review/sessions/${sessionId}`);
        if (!sessionRes.ok) throw new Error("Session not found");
        const { session: sess } = await sessionRes.json();
        setSession(sess);

        // Load existing review if any
        const reviewsRes = await reviewApiFetch(`/review/sessions/${sessionId}/my-reviews`);
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          const reviews = type === "leader" ? data.leader_reviews : data.reviews;
          const existing = reviews.find((r: any) => r.target_id === targetId);
          if (existing) {
            setScores(existing.scores);
            setComment(existing.comment || "");
          }
        }
      } catch (err) {
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, sessionId, targetId, type]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!user || !session) return null;

  const target = session.members.find((m) => m.discord_id === targetId);
  const criteria = type === "leader" ? session.leader_criteria : session.criteria;
  const allScoresFilled = scores.every((s) => s !== null);

  const handleSubmit = async () => {
    if (!allScoresFilled) {
      setError("모든 항목에 점수를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const endpoint =
        type === "leader"
          ? `/review/sessions/${sessionId}/leader-reviews`
          : `/review/sessions/${sessionId}/reviews`;

      const res = await reviewApiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_discord_id: targetId,
          scores,
          comment,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "제출 실패");
      }

      setSubmitted(true);
      setTimeout(() => navigate("/review"), 1500);
    } catch (err: any) {
      setError(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-medium">제출 완료!</p>
          <p className="text-sm text-muted-foreground mt-1">대시보드로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/review")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-sm font-medium">
              {type === "leader" ? "리더 평가" : "공통 피어리뷰"}
            </p>
            <p className="text-xs text-muted-foreground">{session.title}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Target Info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">평가 대상</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold">{target?.display_name || "Unknown"}</p>
            {target?.is_leader && (
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                Leader
              </span>
            )}
          </div>
        </div>

        {/* Score Selectors */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-6">
          {criteria.map((criterion, index) => (
            <ScoreSelector
              key={criterion.name}
              name={criterion.name}
              description={criterion.desc}
              value={scores[index]}
              onChange={(score) => {
                const newScores = [...scores];
                newScores[index] = score;
                setScores(newScores);
              }}
            />
          ))}
        </div>

        {/* Comment */}
        <div className="bg-card border border-border rounded-xl p-5">
          <label className="block text-sm font-medium mb-2">코멘트 (선택사항)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="해당 팀원에 대한 피드백이나 의견을 자유롭게 작성해주세요."
            className="w-full min-h-[120px] p-3 bg-background border border-border rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !allScoresFilled}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitting ? "제출 중..." : "리뷰 제출"}
        </button>
      </div>
    </div>
  );
}

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
        <div className="animate-pulse text-foreground/60">로딩 중...</div>
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
    if (comment.length < 50) {
      setError("코멘트를 50자 이상 작성해주세요.");
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
          <p className="text-sm text-foreground/60 mt-1">대시보드로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/review")}
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </button>
          <div className="border-l border-border pl-4">
            <p className="font-medium">
              {type === "leader" ? "리더 평가" : "공통 피어리뷰"}
            </p>
            <p className="text-sm text-foreground/60">{session.title}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Target Info */}
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
          <p className="text-sm text-foreground/60 mb-2">평가 대상</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold">{target?.display_name || "Unknown"}</p>
            {target?.is_leader && (
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                Leader
              </span>
            )}
          </div>
        </div>

        {/* Score Selectors */}
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-8">
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
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
          <label className="block font-medium mb-3">코멘트 (필수, 50자 이상)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="해당 팀원에 대한 피드백이나 의견을 자유롭게 작성해주세요. (50자 이상)"
            className={`w-full min-h-[160px] p-4 bg-background border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
              comment.length > 0 && comment.length < 50 ? "border-destructive" : "border-border"
            }`}
          />
          <p className={`text-sm mt-2 ${comment.length >= 50 ? "text-green-600" : "text-foreground/60"}`}>
            {comment.length}/50자
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !allScoresFilled || comment.length < 50}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-medium text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          {submitting ? "제출 중..." : "리뷰 제출"}
        </button>
      </div>
    </div>
  );
}

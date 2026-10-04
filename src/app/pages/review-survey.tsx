import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Send, Check, GraduationCap } from "lucide-react";
import { useReviewUser, reviewApiFetch } from "../../utils/review-auth";

interface SurveyQuestion {
  name: string;
  desc: string;
  options: string[];
}

interface CommentQuestion {
  name: string;
  desc: string;
  hint: string;
  min_length: number;
}

export function ReviewSurvey() {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const { user, loading: authLoading } = useReviewUser();
  const [sessionTitle, setSessionTitle] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [commentQuestion, setCommentQuestion] = useState<CommentQuestion | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
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
        const sessionRes = await reviewApiFetch(`/review/sessions/${sessionId}`);
        if (!sessionRes.ok) throw new Error("Session not found");
        const { session } = await sessionRes.json();
        setSessionTitle(session.title);

        const surveyRes = await reviewApiFetch(`/review/sessions/${sessionId}/edu-survey`);
        if (!surveyRes.ok) throw new Error("Survey not found");
        const data = await surveyRes.json();
        setQuestions(data.questions);
        setCommentQuestion(data.comment_question);
        if (data.response) {
          setAnswers(data.response.answers);
          setComment(data.response.comment || "");
        } else {
          setAnswers(new Array(data.questions.length).fill(null));
        }
      } catch {
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, sessionId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="animate-pulse text-foreground/60">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  const minLength = commentQuestion?.min_length ?? 50;
  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);

  const handleSubmit = async () => {
    if (!allAnswered) {
      setError("모든 문항에 응답해주세요.");
      return;
    }
    if (comment.length < minLength) {
      setError(`의견을 ${minLength}자 이상 작성해주세요.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await reviewApiFetch(`/review/sessions/${sessionId}/edu-survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, comment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "교육만족도 조사 제출 실패");
      }

      setSubmitted(true);
      setTimeout(() => navigate("/review?list=1"), 1500);
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
            onClick={() => navigate("/review?list=1")}
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </button>
          <div className="border-l border-border pl-4">
            <p className="font-medium">교육만족도 조사</p>
            <p className="text-sm text-foreground/60">{sessionTitle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Intro */}
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">EDU팀 교육만족도 조사</h1>
          </div>
          <p className="text-sm text-foreground/60">
            더 나은 교육을 위해 솔직한 의견을 남겨주세요. 응답 내용은 운영진만 확인합니다.
          </p>
        </div>

        {/* Choice questions */}
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8 space-y-8">
          {questions.map((question, qIndex) => (
            <div key={question.name} className="space-y-3">
              <div>
                <h3 className="font-medium">
                  {qIndex + 1}. {question.desc}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {question.options.map((option, oIndex) => {
                  const selected = answers[qIndex] === oIndex;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const next = [...answers];
                        next[qIndex] = oIndex;
                        setAnswers(next);
                      }}
                      className={`px-3 py-3 rounded-lg border text-sm transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/40 hover:bg-accent/50"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Comment */}
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
          <label className="block font-medium mb-1">
            {questions.length + 1}. {commentQuestion?.desc} (필수, {minLength}자 이상)
          </label>
          {commentQuestion?.hint && (
            <p className="text-xs text-foreground/60 mb-3">{commentQuestion.hint}</p>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`교육 세션, 복습 퀴즈, 추가로 필요한 교육 등 자유롭게 작성해주세요. (${minLength}자 이상)`}
            className={`w-full min-h-[160px] p-4 bg-background border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
              comment.length > 0 && comment.length < minLength ? "border-destructive" : "border-border"
            }`}
          />
          <p className={`text-sm mt-2 ${comment.length >= minLength ? "text-green-600" : "text-foreground/60"}`}>
            {comment.length}/{minLength}자
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
          disabled={submitting || !allAnswered || comment.length < minLength}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-medium text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          {submitting ? "제출 중..." : "설문 제출"}
        </button>
      </div>
    </div>
  );
}

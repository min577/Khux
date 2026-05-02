import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router";
import { LogOut, ArrowLeft, Users, Crown, ChevronRight, Check, Layers } from "lucide-react";
import { useReviewUser, reviewApiFetch } from "../../utils/review-auth";
import { MemberCard } from "../components/review/member-card";
import { ReviewProgress } from "../components/review/review-progress";

interface SessionMember {
  discord_id: string;
  display_name: string;
  is_leader: boolean;
}

interface ReviewSession {
  id: string;
  title: string;
  team: string;
  team_name: string;
  active: boolean;
  members: SessionMember[];
}

interface MyReview {
  target_id: string;
}

interface SessionProgress {
  common: { done: number; total: number };
  leader: { done: number; total: number };
}

export function ReviewDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceList = searchParams.get("list") === "1";
  const { user, loading: authLoading, logout } = useReviewUser();
  const [mySessions, setMySessions] = useState<ReviewSession[]>([]);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [myLeaderReviews, setMyLeaderReviews] = useState<MyReview[]>([]);
  const [sessionProgress, setSessionProgress] = useState<Record<string, SessionProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/review/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch sessions list
  useEffect(() => {
    if (!user) return;

    async function fetchSessions() {
      try {
        const sessionsRes = await reviewApiFetch("/review/sessions?active=true");
        if (!sessionsRes.ok) throw new Error("Failed to fetch sessions");
        const { sessions } = await sessionsRes.json();

        const mine = sessions.filter((s: ReviewSession) =>
          s.members?.some((m) => m.discord_id === user!.discord_id)
        );
        setMySessions(mine);

        // Fetch progress for each of my sessions in parallel
        const progressEntries = await Promise.all(
          mine.map(async (sess: ReviewSession) => {
            try {
              const res = await reviewApiFetch(`/review/sessions/${sess.id}/my-reviews`);
              if (!res.ok) return null;
              const { reviews, leader_reviews } = await res.json();
              const otherCount = sess.members.filter((m) => m.discord_id !== user!.discord_id).length;
              const leaderCount = sess.members.filter((m) => m.is_leader && m.discord_id !== user!.discord_id).length;
              return [
                sess.id,
                {
                  common: { done: (reviews || []).length, total: otherCount },
                  leader: { done: (leader_reviews || []).length, total: leaderCount },
                },
              ] as [string, SessionProgress];
            } catch {
              return null;
            }
          })
        );
        const progressMap = Object.fromEntries(
          progressEntries.filter(Boolean) as [string, SessionProgress][]
        );
        setSessionProgress(progressMap);

        // Auto-select only on initial entry (not when forced to list view via ?list=1)
        if (mine.length === 1 && !forceList) {
          selectSession(mine[0]);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError("데이터를 불러오는데 실패했습니다.");
        setLoading(false);
      }
    }

    fetchSessions();
  }, [user]);

  async function selectSession(sess: ReviewSession) {
    setSession(sess);
    setLoading(true);
    try {
      const reviewsRes = await reviewApiFetch(`/review/sessions/${sess.id}/my-reviews`);
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setMyReviews(data.reviews || []);
        setMyLeaderReviews(data.leader_reviews || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="animate-pulse text-foreground/60">로딩 중...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/review/login");
  };

  const otherMembers = session?.members.filter((m) => m.discord_id !== user.discord_id) || [];
  const leaders = session?.members.filter((m) => m.is_leader && m.discord_id !== user.discord_id) || [];

  const reviewedIds = new Set(myReviews.map((r) => r.target_id));
  const leaderReviewedIds = new Set(myLeaderReviews.map((r) => r.target_id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            메인
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user.display_name}</p>
              <p className="text-xs text-foreground/60">{user.team_name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-foreground/60 hover:text-foreground transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Session list view */}
        {!session && mySessions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Layers className="w-4 h-4 text-primary" />
              <span className="font-medium">
                {mySessions.length > 1
                  ? `동시 진행 중인 피어리뷰 ${mySessions.length}개`
                  : "진행 중인 피어리뷰"}
              </span>
            </div>
            <p className="text-xs text-foreground/60">
              {mySessions.length > 1
                ? "각 세션을 모두 완료해주세요."
                : "세션을 선택해 리뷰를 작성하세요."}
            </p>
            {mySessions.map((sess) => {
              const prog = sessionProgress[sess.id];
              const commonDone = prog ? prog.common.done >= prog.common.total : false;
              const leaderDone = prog ? prog.leader.done >= prog.leader.total : false;
              const allDone = !!prog && commonDone && leaderDone;
              return (
                <button
                  key={sess.id}
                  onClick={() => selectSession(sess)}
                  className={`w-full flex items-center justify-between p-4 bg-card border rounded-xl hover:bg-accent/50 transition-all text-left ${
                    allDone ? "border-green-500/40 bg-green-50/40" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{sess.title}</p>
                      {allDone && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          <Check className="w-3 h-3" /> 완료
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/60 mt-0.5">
                      {sess.team_name} — {sess.members?.length || 0}명
                    </p>
                    {prog && (
                      <div className="mt-2 flex gap-3 text-xs">
                        <span
                          className={
                            commonDone ? "text-green-600 font-medium" : "text-foreground/60"
                          }
                        >
                          공통 {prog.common.done}/{prog.common.total}
                        </span>
                        {prog.leader.total > 0 && (
                          <span
                            className={
                              leaderDone ? "text-green-600 font-medium" : "text-foreground/60"
                            }
                          >
                            리더 {prog.leader.done}/{prog.leader.total}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground/60 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {!session && mySessions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-foreground/60">현재 진행 중인 피어리뷰가 없습니다.</p>
          </div>
        )}

        {session && (
          <>
            {/* Concurrent sessions banner */}
            {mySessions.length > 1 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="font-medium">동시 진행 중 {mySessions.length}개</span>
                  </div>
                  <button
                    onClick={() => { setSession(null); setMyReviews([]); setMyLeaderReviews([]); }}
                    className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    세션 목록 보기
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {mySessions.map((s) => {
                    const prog = sessionProgress[s.id];
                    const allDone = !!prog &&
                      prog.common.done >= prog.common.total &&
                      prog.leader.done >= prog.leader.total;
                    const isCurrent = s.id === session.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (!isCurrent) selectSession(s);
                        }}
                        disabled={isCurrent}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
                          isCurrent
                            ? "bg-primary text-primary-foreground border-primary cursor-default"
                            : allDone
                              ? "border-green-500/40 bg-green-50 text-green-700 hover:bg-green-100"
                              : "border-border hover:bg-accent"
                        }`}
                      >
                        {allDone && <Check className="w-3 h-3" />}
                        <span className="font-medium">{s.team_name}</span>
                        {prog && (
                          <span className="opacity-70">
                            {prog.common.done + prog.leader.done}/{prog.common.total + prog.leader.total}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Session Title */}
            <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{session.title}</h1>
                  <p className="text-foreground/60 mt-1">{session.team_name} 팀</p>
                </div>
                {mySessions.length > 1 && (
                  <button
                    onClick={() => { setSession(null); setMyReviews([]); setMyLeaderReviews([]); }}
                    className="text-xs text-foreground/60 hover:text-foreground transition-colors"
                  >
                    다른 리뷰 선택
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <ReviewProgress
                  label="공통 피어리뷰"
                  done={reviewedIds.size}
                  total={otherMembers.length}
                />
                {leaders.length > 0 && (
                  <ReviewProgress
                    label="리더 평가"
                    done={leaderReviewedIds.size}
                    total={leaders.length}
                  />
                )}
              </div>
            </div>

            {/* Common Review */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="font-semibold">공통 피어리뷰</h2>
              </div>
              <div className="space-y-2">
                {otherMembers.map((member) => (
                  <MemberCard
                    key={member.discord_id}
                    name={member.display_name}
                    isLeader={member.is_leader}
                    completed={reviewedIds.has(member.discord_id)}
                    onClick={() =>
                      navigate(`/review/${session.id}/${member.discord_id}?type=common`)
                    }
                  />
                ))}
              </div>
            </div>

            {/* Leader Review */}
            {leaders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <h2 className="font-semibold">리더 평가</h2>
                </div>
                <div className="space-y-2">
                  {leaders.map((leader) => (
                    <MemberCard
                      key={`leader-${leader.discord_id}`}
                      name={leader.display_name}
                      isLeader
                      completed={leaderReviewedIds.has(leader.discord_id)}
                      onClick={() =>
                        navigate(`/review/${session.id}/${leader.discord_id}?type=leader`)
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

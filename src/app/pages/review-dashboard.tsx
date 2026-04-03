import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { LogOut, ArrowLeft, Users, Crown } from "lucide-react";
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

export function ReviewDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useReviewUser();
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [myLeaderReviews, setMyLeaderReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/review/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        // Find active session for user's team
        const sessionsRes = await reviewApiFetch("/review/sessions?active=true");
        if (!sessionsRes.ok) throw new Error("Failed to fetch sessions");
        const { sessions } = await sessionsRes.json();

        const mySession = sessions.find((s: ReviewSession) => s.team === user!.team);
        if (!mySession) {
          setSession(null);
          setLoading(false);
          return;
        }
        setSession(mySession);

        // Fetch my reviews
        const reviewsRes = await reviewApiFetch(`/review/sessions/${mySession.id}/my-reviews`);
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setMyReviews(data.reviews || []);
          setMyLeaderReviews(data.leader_reviews || []);
        }
      } catch (err) {
        console.error(err);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
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
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            메인
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user.display_name}</p>
              <p className="text-xs text-muted-foreground">{user.team_name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!session ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">현재 진행 중인 피어리뷰가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* Session Title */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h1 className="text-xl font-bold">{session.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{session.team_name} 팀</p>

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

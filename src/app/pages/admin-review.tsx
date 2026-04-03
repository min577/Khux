import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Download, StopCircle, RefreshCw, Check, X } from "lucide-react";
import { supabase, apiFetchAuth, API_BASE_URL } from "../../utils/supabase-client";
import { publicAnonKey } from "/utils/supabase/info";

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
  started_at: string;
  members: SessionMember[];
}

interface MemberStatus {
  discord_id: string;
  display_name: string;
  is_leader: boolean;
  common_total: number;
  common_done: number;
  leader_total: number;
  leader_done: number;
  complete: boolean;
}

export function AdminReview() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<MemberStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/admin/login");
      else fetchSessions();
    });
  }, [navigate]);

  async function fetchSessions() {
    try {
      const res = await apiFetchAuth("/review/sessions");
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.sessions || []).sort(
          (a: ReviewSession, b: ReviewSession) =>
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
        setSessions(sorted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatus(sessionId: string) {
    setStatusLoading(true);
    setSelectedSession(sessionId);
    try {
      const res = await apiFetchAuth(`/review/sessions/${sessionId}/status`);
      if (res.ok) {
        const data = await res.json();
        setStatusData(data.status || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  }

  async function endSession(sessionId: string) {
    if (!confirm("이 세션을 종료하시겠습니까?")) return;
    try {
      const res = await apiFetchAuth(`/review/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (res.ok) fetchSessions();
    } catch (err) {
      console.error(err);
    }
  }

  async function exportCsv(sessionId: string, type: "common" | "leader") {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const url = `${API_BASE_URL}/review/sessions/${sessionId}/export?type=${type}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        "x-user-token": session.access_token,
      },
    });

    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${sessionId}_${type}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-bold">피어리뷰 관리</h1>
          </div>
          <button
            onClick={fetchSessions}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Session List */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">리뷰 세션이 없습니다.</p>
            <p className="text-sm text-muted-foreground mt-1">
              디스코드 봇에서 /리뷰시작 명령어로 세션을 시작하세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Session header */}
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{sess.title}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          sess.active
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {sess.active ? "진행 중" : "종료"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {sess.team_name} — {sess.members?.length || 0}명 —{" "}
                      {new Date(sess.started_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchStatus(sess.id)}
                      className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      {selectedSession === sess.id ? "새로고침" : "현황 보기"}
                    </button>
                    <button
                      onClick={() => exportCsv(sess.id, "common")}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="공통 리뷰 CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => exportCsv(sess.id, "leader")}
                      className="p-1.5 text-amber-500 hover:text-amber-600 transition-colors"
                      title="리더 평가 CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {sess.active && (
                      <button
                        onClick={() => endSession(sess.id)}
                        className="p-1.5 text-destructive hover:text-destructive/80 transition-colors"
                        title="세션 종료"
                      >
                        <StopCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status detail */}
                {selectedSession === sess.id && (
                  <div className="border-t border-border p-5">
                    {statusLoading ? (
                      <p className="text-sm text-muted-foreground animate-pulse">불러오는 중...</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-[1fr,80px,80px,60px] gap-2 text-xs text-muted-foreground font-medium pb-2 border-b border-border">
                          <span>이름</span>
                          <span className="text-center">공통 리뷰</span>
                          <span className="text-center">리더 평가</span>
                          <span className="text-center">상태</span>
                        </div>
                        {statusData.map((member) => (
                          <div
                            key={member.discord_id}
                            className="grid grid-cols-[1fr,80px,80px,60px] gap-2 items-center text-sm py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span>{member.display_name}</span>
                              {member.is_leader && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                  Leader
                                </span>
                              )}
                            </div>
                            <span className="text-center text-muted-foreground">
                              {member.common_done}/{member.common_total}
                            </span>
                            <span className="text-center text-muted-foreground">
                              {member.leader_done}/{member.leader_total}
                            </span>
                            <div className="flex justify-center">
                              {member.complete ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-destructive" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

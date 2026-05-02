import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Download, StopCircle, RefreshCw, Check, X, Play, Lock, Users, Plus, Trash2 } from "lucide-react";
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

const PROJECT_TEAM_PRESETS: { key: string; name: string; members: string[] }[] = [
  { key: "team_a", name: "TEAM A", members: ["전지원", "강예빈", "한유민", "최정윤"] },
  { key: "team_b", name: "TEAM B", members: ["이수민", "정예원", "이신유", "이유진"] },
  { key: "team_c", name: "TEAM C", members: ["김민우", "곽슬기", "한지원", "고민서", "이유나"] },
  { key: "team_d", name: "TEAM D", members: ["박진홍", "송유영", "서지은", "이혜린", "한가람"] },
];

export function AdminReview() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<MemberStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [starting, setStarting] = useState(false);
  const [startResult, setStartResult] = useState<string | null>(null);

  // Custom (project-team) session form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customTeamKey, setCustomTeamKey] = useState("team_a");
  const [customTeamName, setCustomTeamName] = useState("TEAM A");
  const [customMembers, setCustomMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [creatingCustom, setCreatingCustom] = useState(false);
  const [customResult, setCustomResult] = useState<string | null>(null);

  // PIN gate
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/admin/login");
    });
  }, [navigate]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    try {
      const res = await apiFetchAuth("/review-pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.valid) {
        setUnlocked(true);
        setPin("");
        fetchSessions();
      } else {
        setPinError("PIN이 올바르지 않습니다.");
      }
    } catch {
      setPinError("인증에 실패했습니다.");
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Link to="/admin/dashboard" className="fixed top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> 대시보드
        </Link>
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">피어리뷰 접근 제한</h1>
          <p className="text-sm text-muted-foreground mb-6">최고 관리자만 접근할 수 있습니다. PIN을 입력하세요.</p>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN 입력"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" autoFocus />
            {pinError && <p className="text-sm text-destructive">{pinError}</p>}
            <button type="submit" disabled={!pin} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">확인</button>
          </form>
        </div>
      </div>
    );
  }

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

  async function startAllSessions() {
    if (!newTitle.trim()) return;
    setStarting(true);
    setStartResult(null);
    try {
      const res = await apiFetchAuth("/review/sessions/start-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        const summary = data.sessions
          .map((s: any) => `${s.team} (${s.members}명)`)
          .join(", ");
        setStartResult(`세션 생성 완료: ${summary}`);
        setNewTitle("");
        setShowStartForm(false);
        fetchSessions();
      } else {
        setStartResult(`오류: ${data.error}`);
      }
    } catch (err) {
      setStartResult("세션 생성에 실패했습니다.");
    } finally {
      setStarting(false);
    }
  }

  function applyPreset(key: string) {
    const preset = PROJECT_TEAM_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setCustomTeamKey(preset.key);
    setCustomTeamName(preset.name);
    setCustomMembers([...preset.members]);
  }

  function addMember() {
    const name = memberInput.trim();
    if (!name) return;
    if (customMembers.includes(name)) {
      setMemberInput("");
      return;
    }
    setCustomMembers([...customMembers, name]);
    setMemberInput("");
  }

  function removeMember(name: string) {
    setCustomMembers(customMembers.filter((m) => m !== name));
  }

  function resetCustomForm() {
    setShowCustomForm(false);
    setCustomTitle("");
    setCustomTeamKey("team_a");
    setCustomTeamName("TEAM A");
    setCustomMembers([]);
    setMemberInput("");
  }

  async function createCustomSession() {
    if (!customTitle.trim() || !customTeamName.trim() || customMembers.length === 0) return;
    setCreatingCustom(true);
    setCustomResult(null);
    try {
      const res = await apiFetchAuth("/review/sessions/create-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customTitle.trim(),
          team_key: customTeamKey.trim(),
          team_name: customTeamName.trim(),
          member_names: customMembers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const notFoundMsg = data.not_found && data.not_found.length > 0
          ? ` (매칭 실패: ${data.not_found.join(", ")})`
          : "";
        setCustomResult(`${customTeamName} 세션 생성 완료 — ${data.matched}명${notFoundMsg}`);
        resetCustomForm();
        fetchSessions();
      } else {
        const notFoundMsg = data.not_found && data.not_found.length > 0
          ? ` — 매칭 실패: ${data.not_found.join(", ")}`
          : "";
        setCustomResult(`오류: ${data.error}${notFoundMsg}`);
      }
    } catch (err) {
      setCustomResult("세션 생성에 실패했습니다.");
    } finally {
      setCreatingCustom(false);
    }
  }

  async function deleteSession(sessionId: string, title: string) {
    if (!confirm(`"${title}" 세션을 삭제하시겠습니까?\n관련된 모든 리뷰 데이터도 함께 삭제됩니다.`)) return;
    try {
      const res = await apiFetchAuth(`/review/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedSession === sessionId) {
          setSelectedSession(null);
          setStatusData([]);
        }
        fetchSessions();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(`삭제 실패: ${data.error || res.status}`);
      }
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
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
        {/* Action buttons */}
        {!showStartForm && !showCustomForm && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setShowStartForm(true)}
              className="flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Play className="w-4 h-4" />
              부서별 피어리뷰 시작
            </button>
            <button
              onClick={() => setShowCustomForm(true)}
              className="flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground border border-border rounded-xl font-medium hover:bg-accent transition-colors"
            >
              <Users className="w-4 h-4" />
              프로젝트 팀 세션 만들기
            </button>
          </div>
        )}

        {/* Department-based session form */}
        {showStartForm && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">부서별 피어리뷰 세션 시작</h3>
            <p className="text-sm text-muted-foreground">
              모든 팀의 세션이 일괄 생성되고, 디스코드 역할 기반으로 팀원이 자동 등록됩니다.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="세션 제목 (예: 4월 부서 피어리뷰)"
                className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={starting}
              />
              <button
                onClick={startAllSessions}
                disabled={starting || !newTitle.trim()}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {starting ? "생성 중..." : "시작"}
              </button>
              <button
                onClick={() => { setShowStartForm(false); setNewTitle(""); }}
                className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* Custom (project-team) session form */}
        {showCustomForm && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">프로젝트 팀 세션 만들기</h3>
              <button
                onClick={resetCustomForm}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              프리셋을 선택하거나 멤버를 직접 추가/제거할 수 있습니다. 입력한 이름은 디스코드 닉네임과 매칭됩니다.
            </p>

            {/* Preset chips */}
            <div className="flex flex-wrap gap-2">
              {PROJECT_TEAM_PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    customTeamKey === p.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setCustomTeamKey("custom");
                  setCustomTeamName("");
                  setCustomMembers([]);
                }}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  customTeamKey === "custom"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                직접 입력
              </button>
            </div>

            {/* Title + team name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">세션 제목</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="예: 4월 프로젝트 피어리뷰"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={creatingCustom}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">팀 이름</label>
                <input
                  type="text"
                  value={customTeamName}
                  onChange={(e) => setCustomTeamName(e.target.value)}
                  placeholder="예: TEAM A"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={creatingCustom}
                />
              </div>
            </div>

            {/* Members */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">
                멤버 ({customMembers.length}명)
              </label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                {customMembers.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic py-1">멤버를 추가하세요</span>
                ) : (
                  customMembers.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-sm rounded-full"
                    >
                      {name}
                      <button
                        onClick={() => removeMember(name)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        disabled={creatingCustom}
                        title="제거"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMember();
                    }
                  }}
                  placeholder="멤버 이름 (Enter로 추가)"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  disabled={creatingCustom}
                />
                <button
                  onClick={addMember}
                  disabled={creatingCustom || !memberInput.trim()}
                  className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 추가
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={resetCustomForm}
                disabled={creatingCustom}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
              >
                취소
              </button>
              <button
                onClick={createCustomSession}
                disabled={
                  creatingCustom ||
                  !customTitle.trim() ||
                  !customTeamName.trim() ||
                  customMembers.length === 0
                }
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {creatingCustom ? "생성 중..." : "세션 생성"}
              </button>
            </div>
          </div>
        )}

        {startResult && (
          <div className={`p-3 rounded-lg text-sm ${
            startResult.startsWith("오류") ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700"
          }`}>
            {startResult}
          </div>
        )}

        {customResult && (
          <div className={`p-3 rounded-lg text-sm ${
            customResult.startsWith("오류") ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700"
          }`}>
            {customResult}
          </div>
        )}

        {/* Session List */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">리뷰 세션이 없습니다.</p>
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
                    <button
                      onClick={() => deleteSession(sess.id, sess.title)}
                      className="p-1.5 text-destructive hover:text-destructive/80 transition-colors"
                      title="세션 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

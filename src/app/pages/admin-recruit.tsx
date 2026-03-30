import { useState, useEffect } from "react";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { supabase } from "../../utils/supabase-client";
import { DEFAULT_RECRUIT_CONFIG, KV_KEY } from "../types/recruit-config";
import type { RecruitConfig, RecruitQuestion } from "../types/recruit-config";

const INPUT_CLASS =
  "w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm";

export function AdminRecruitTab() {
  const [config, setConfig] = useState<RecruitConfig>(DEFAULT_RECRUIT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("kv_store_d0140d55")
        .select("value")
        .eq("key", KV_KEY)
        .single();
      if (data?.value) {
        setConfig({ ...DEFAULT_RECRUIT_CONFIG, ...data.value });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("kv_store_d0140d55")
        .upsert({ key: KV_KEY, value: config });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      alert("저장에 실패했습니다. Supabase RLS 정책을 확인해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (
    id: RecruitQuestion["id"],
    field: keyof RecruitQuestion,
    value: string | boolean | number
  ) => {
    setConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8 pb-12">
      {/* 기본 설정 */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          기본 설정
        </h3>
        <div className="space-y-4 p-6 bg-card border border-border rounded-xl">
          <div>
            <label className="block text-sm font-medium mb-2">기수명</label>
            <input
              type="text"
              value={config.generation}
              onChange={(e) =>
                setConfig({ ...config, generation: e.target.value })
              }
              className={INPUT_CLASS}
              placeholder="KHUX 4기"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium">지원 폼 공개</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                비공개 시 지원 페이지에 "모집 기간이 아닙니다" 표시
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, isOpen: !config.isOpen })}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                config.isOpen ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  config.isOpen ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 모집 일정 */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          모집 일정
        </h3>
        <div className="space-y-4 p-6 bg-card border border-border rounded-xl">
          <div>
            <label className="block text-sm font-medium mb-2">지원 기간</label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={config.applicationStart}
                onChange={(e) =>
                  setConfig({ ...config, applicationStart: e.target.value })
                }
                className={INPUT_CLASS}
              />
              <span className="text-muted-foreground shrink-0">~</span>
              <input
                type="date"
                value={config.applicationEnd}
                onChange={(e) =>
                  setConfig({ ...config, applicationEnd: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">면접 일정</label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={config.interviewStart}
                onChange={(e) =>
                  setConfig({ ...config, interviewStart: e.target.value })
                }
                className={INPUT_CLASS}
              />
              <span className="text-muted-foreground shrink-0">~</span>
              <input
                type="date"
                value={config.interviewEnd}
                onChange={(e) =>
                  setConfig({ ...config, interviewEnd: e.target.value })
                }
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">결과 발표</label>
            <input
              type="date"
              value={config.resultDate}
              onChange={(e) =>
                setConfig({ ...config, resultDate: e.target.value })
              }
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </section>

      {/* 질문 항목 */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          질문 항목
        </h3>
        <div className="space-y-3">
          {config.questions.map((q) => (
            <div
              key={q.id}
              className={`p-5 bg-card border rounded-xl space-y-3 transition-opacity ${
                q.visible ? "border-border" : "border-border/50 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={q.label}
                  onChange={(e) => updateQuestion(q.id, "label", e.target.value)}
                  className="text-sm font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none pb-0.5 min-w-0 flex-1"
                />
                <div className="flex items-center gap-4 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) =>
                        updateQuestion(q.id, "required", e.target.checked)
                      }
                      className="rounded"
                    />
                    필수
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={q.visible}
                      onChange={(e) =>
                        updateQuestion(q.id, "visible", e.target.checked)
                      }
                      className="rounded"
                    />
                    표시
                  </label>
                </div>
              </div>
              <input
                type="text"
                value={q.placeholder}
                onChange={(e) =>
                  updateQuestion(q.id, "placeholder", e.target.value)
                }
                className="w-full text-xs text-muted-foreground px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                placeholder="플레이스홀더 텍스트"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 저장 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          저장
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">
            저장되었습니다!
          </span>
        )}
        <button
          onClick={loadConfig}
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors ml-auto"
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </button>
      </div>
    </div>
  );
}

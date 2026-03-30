import { useState, useEffect } from "react";
import { CheckCircle, Send, Calendar, Clock, FileText } from "lucide-react";
import { apiFetch } from "../../utils/supabase-client";
import { DEFAULT_RECRUIT_CONFIG, formatDate } from "../types/recruit-config";
import type { RecruitConfig } from "../types/recruit-config";

const INPUT_CLASS = "w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring";

const BASIC_FIELD_INPUT_TYPE: Record<string, string> = {
  name: "text",
  studentId: "text",
  major: "text",
  phone: "tel",
  email: "email",
  team: "select",
};


export function Recruit() {
  const [config, setConfig] = useState<RecruitConfig>(DEFAULT_RECRUIT_CONFIG);
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/recruit-config")
      .then((r) => r.json())
      .then(({ config: cfg }) => {
        if (cfg) setConfig({ ...DEFAULT_RECRUIT_CONFIG, ...cfg });
      });
  }, []);

  // Reset form when config loads (init all question fields to "")
  useEffect(() => {
    const initial: Record<string, string> = {};
    config.basicFields.forEach((f) => { initial[f.id] = ""; });
    config.questions.forEach((q) => { initial[q.id] = ""; });
    setForm(initial);
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch("/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("지원서 제출에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl mb-4">지원이 완료되었습니다!</h1>
            <p className="text-muted-foreground mb-2">KHUX에 관심을 가져주셔서 감사합니다.</p>
            <p className="text-muted-foreground">서류 검토 후 개별적으로 연락드리겠습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  const visibleBasicFields = config.basicFields.filter((f) => f.visible);
  const visibleQuestions = config.questions.filter((q) => q.visible);

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl mb-4">Recruit</h1>
            <p className="text-lg text-muted-foreground">
              {config.generation} 멤버를 모집합니다. {config.description}
            </p>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="p-6 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-medium">지원 기간</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(config.applicationStart)} ~ {formatDate(config.applicationEnd)}
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-medium">면접 일정</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(config.interviewStart)} ~ {formatDate(config.interviewEnd)}
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-medium">결과 발표</h3>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(config.resultDate)}</p>
            </div>
          </div>

          {/* Teams */}
          <div className="mb-12 p-8 bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl border border-border">
            <h2 className="text-2xl mb-6">모집 팀 소개</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Leaders",    desc: "학회의 비전과 방향성을 수립하고 활동 전반을 리딩" },
                { name: "Education",  desc: "UX/UI 커리큘럼 기획 및 교육 콘텐츠 제작" },
                { name: "Operations", desc: "학회 운영 관리 및 조직 문화 구축" },
                { name: "Growth",     desc: "브랜드 전략 수립 및 대외 활동 주도" },
              ].map((team) => (
                <div key={team.name} className="p-4 bg-background/60 rounded-xl">
                  <h4 className="font-medium mb-1">{team.name}</h4>
                  <p className="text-sm text-muted-foreground">{team.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="text-2xl mb-8">지원서 작성</h2>
            {!config.isOpen ? (
              <div className="text-center py-12 text-muted-foreground">
                현재 모집 기간이 아닙니다. 다음 모집 공고를 기다려주세요.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visibleBasicFields.map((f) => (
                    <div key={f.id}>
                      <label className="block text-sm font-medium mb-2">
                        {f.label}{f.required ? " *" : ""}
                      </label>
                      {f.id === "team" ? (
                        <select name="team" value={form.team ?? ""} onChange={handleChange}
                          required={f.required} className={INPUT_CLASS}>
                          <option value="">팀을 선택해주세요</option>
                          <option value="Leaders">Leaders</option>
                          <option value="Education">Education</option>
                          <option value="Operations">Operations</option>
                          <option value="Growth">Growth</option>
                        </select>
                      ) : (
                        <input
                          type={BASIC_FIELD_INPUT_TYPE[f.id] ?? "text"}
                          name={f.id}
                          value={form[f.id] ?? ""}
                          onChange={handleChange}
                          required={f.required}
                          className={INPUT_CLASS}
                          placeholder={f.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Long-form Questions */}
                {visibleQuestions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium mb-2">
                      {q.label}{q.required ? " *" : ""}
                    </label>
                    {q.type === "textarea" ? (
                      <textarea
                        name={q.id}
                        value={form[q.id] ?? ""}
                        onChange={handleChange}
                        required={q.required}
                        rows={q.rows ?? 4}
                        className={`${INPUT_CLASS} resize-none`}
                        placeholder={q.placeholder}
                      />
                    ) : (
                      <input
                        type={q.type === "url" ? "url" : "text"}
                        name={q.id}
                        value={form[q.id] ?? ""}
                        onChange={handleChange}
                        required={q.required}
                        className={INPUT_CLASS}
                        placeholder={q.placeholder}
                      />
                    )}
                  </div>
                ))}

                {/* Submit */}
                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium">
                  {submitting ? "제출 중..." : (<>지원서 제출<Send className="h-5 w-5" /></>)}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

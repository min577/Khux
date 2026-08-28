import { useState, useEffect } from "react";
import { CheckCircle, Send, Calendar, Clock, FileText, Loader2, Paperclip } from "lucide-react";
import { apiFetch, uploadApplicationFile } from "../../utils/supabase-client";
import { DEFAULT_RECRUIT_CONFIG, formatDate, splitBracketSegments } from "../types/recruit-config";
import type { RecruitConfig } from "../types/recruit-config";

function renderBracketBold(text: string, keyPrefix: string) {
  return splitBracketSegments(text).map((seg, i) =>
    seg.bold
      ? <strong key={`${keyPrefix}-${i}`} className="font-bold">{seg.text}</strong>
      : <span key={`${keyPrefix}-${i}`}>{seg.text}</span>
  );
}

// 대괄호로 감싼 구간([Deep Dive] 등)을 굵게 렌더링하는 폼 라벨.
// 필수 표시 "*"는 라벨 전체의 맨 끝이 아니라 첫 줄 끝(예: "...(500자 이내) *")에 붙인다.
// 안내 문구가 여러 줄 이어지는 질문에서 "*"가 마지막 줄 끝에 덩그러니 남는 걸 피하기 위함.
// hideRequiredMark가 켜진 항목은 "*"를 아예 표시하지 않는다.
function FieldLabel({ label, required, hideMark }: { label: string; required?: boolean; hideMark?: boolean }) {
  const nl = label.indexOf("\n");
  const firstLine = nl === -1 ? label : label.slice(0, nl);
  const rest = nl === -1 ? "" : label.slice(nl);
  return (
    <label className="block text-base font-medium mb-2 whitespace-pre-wrap">
      {renderBracketBold(firstLine, "head")}
      {required && !hideMark ? " *" : ""}
      {rest && renderBracketBold(rest, "rest")}
    </label>
  );
}

// 파일 항목의 form 값은 `{ url, name }`을 JSON 문자열로 저장한다 (원본 파일명 표시를 위해).
function parseFileAnswer(raw: string): { url: string; name: string } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.url === "string") {
      return { url: parsed.url, name: parsed.name || parsed.url.split("/").pop() || parsed.url };
    }
  } catch {
    // not JSON — fall through
  }
  return { url: raw, name: raw.split("/").pop() || raw };
}

// portfolio 항목은 링크(순수 URL 문자열) 또는 업로드 파일(`{ url, name }` JSON) 둘 중 하나로 저장된다.
function parsePortfolioAnswer(raw: string): { mode: "url" | "file"; url: string; name: string } {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.url === "string") {
      return { mode: "file", url: parsed.url, name: parsed.name || parsed.url.split("/").pop() || parsed.url };
    }
  } catch {
    // not JSON — plain URL
  }
  return { mode: "url", url: raw, name: raw };
}

const INPUT_CLASS = "w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring";

const BASIC_FIELD_INPUT_TYPE: Record<string, string> = {
  name: "text",
  studentId: "text",
  major: "text",
  phone: "tel",
  email: "email",
};


// admin 대시보드로 넣은 테스트용 항목. DB에서는 지우지 않고 지원서 폼에서만 숨김.
const HIDDEN_QUESTION_IDS = ["q_1774894363309"]; // "테스트용 질문"
const HIDDEN_BASIC_FIELD_IDS = ["field_1775024470751"]; // "test"

export function Recruit() {
  const [config, setConfig] = useState<RecruitConfig>(DEFAULT_RECRUIT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileUploading, setFileUploading] = useState<Record<string, boolean>>({});
  const [portfolioMode, setPortfolioMode] = useState<Record<string, "url" | "file">>({});

  useEffect(() => {
    apiFetch("/recruit-config")
      .then((r) => r.json())
      .then(({ config: cfg }) => {
        if (!cfg) return;
        const merged: RecruitConfig = { ...DEFAULT_RECRUIT_CONFIG, ...cfg };
        // teams는 나중에 추가된 항목이라, 이전에 저장된 config에는 없을 수 있다.
        if (!Array.isArray(merged.teams)) merged.teams = DEFAULT_RECRUIT_CONFIG.teams;
        merged.questions = merged.questions.filter((q) => !HIDDEN_QUESTION_IDS.includes(q.id));
        merged.basicFields = merged.basicFields.filter((f) => !HIDDEN_BASIC_FIELD_IDS.includes(f.id));
        setConfig(merged);
      })
      .catch((error) => console.error("Failed to load recruit config:", error))
      .finally(() => setConfigLoaded(true));
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

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setForm((prev) => ({ ...prev, [name]: checked ? "true" : "" }));
  };

  const handleFileChange = async (fieldId: string, file: File | null) => {
    if (!file) return;
    setFileUploading((prev) => ({ ...prev, [fieldId]: true }));
    try {
      const url = await uploadApplicationFile(file);
      setForm((prev) => ({ ...prev, [fieldId]: JSON.stringify({ url, name: file.name }) }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("파일 업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setFileUploading((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const handlePortfolioModeChange = (fieldId: string, mode: "url" | "file") => {
    setPortfolioMode((prev) => ({ ...prev, [fieldId]: mode }));
    setForm((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const handlePortfolioFileChange = async (fieldId: string, file: File | null) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert("PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    await handleFileChange(fieldId, file);
  };

  // 같은 excludeGroup을 공유하는 select 항목들끼리, 다른 항목에서 이미 선택된 값을 제외
  // (예: 1지망/2지망/3지망처럼 서로 중복 선택을 막고 싶은 선택형 항목 묶음)
  const groupPeers = [...config.basicFields, ...config.questions];
  const getSelectOptions = (fieldId: string, opts: string[] | undefined, group: string | undefined) => {
    if (!group) return opts ?? [];
    const usedElsewhere = groupPeers
      .filter((peer) => peer.id !== fieldId && peer.excludeGroup === group)
      .map((peer) => form[peer.id])
      .filter(Boolean);
    return (opts ?? []).filter((opt) => !usedElsewhere.includes(opt));
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

  if (!configLoaded) {
    return (
      <div className="w-full py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto text-center text-muted-foreground">불러오는 중...</div>
        </div>
      </div>
    );
  }

  const visibleBasicFields = config.basicFields.filter((f) => f.visible);
  const visibleQuestions = config.questions.filter((q) => q.visible);

  if (!config.isOpen) {
    return (
      <div className="w-full py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">모집 기간이 아닙니다</h1>
            <p className="text-muted-foreground text-lg mb-2">
              현재 {config.generation} 모집이 마감되었습니다.
            </p>
            <p className="text-muted-foreground">
              다음 모집 공고는 KHUX 공지사항을 통해 안내될 예정입니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl mb-4">Recruit</h1>
            <p className="text-base text-muted-foreground whitespace-pre-wrap">
              {config.generation} 추가 모집이 진행 중입니다.{"\n"}{config.description}
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
              {/* 추가 모집 일정 확정 전까지 임시 표기. 확정되면 {formatDate(config.resultDate)} 로 복원 */}
              <p className="text-sm text-muted-foreground">추후 개별 안내</p>
            </div>
          </div>

          {/* Teams */}
          <div className="mb-12 p-8 bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl border border-border">
            <h2 className="text-2xl mb-6">모집 팀 소개</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.teams.map((team) => (
                <div key={team.id} className="p-4 bg-background/60 rounded-xl">
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
                      <FieldLabel label={f.label} required={f.required} />
                      {f.type === "select" ? (
                        <select name={f.id} value={form[f.id] ?? ""} onChange={handleChange}
                          required={f.required} className={INPUT_CLASS}>
                          <option value="">{f.placeholder || "선택해주세요"}</option>
                          {getSelectOptions(f.id, f.options, f.excludeGroup).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
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
                    <FieldLabel label={q.label} required={q.required} hideMark={q.hideRequiredMark} />
                    {q.type === "textarea" ? (
                      <div>
                        <textarea
                          name={q.id}
                          value={form[q.id] ?? ""}
                          onChange={handleChange}
                          required={q.required}
                          rows={q.rows ?? 4}
                          maxLength={q.maxLength || undefined}
                          className={`${INPUT_CLASS} resize-none`}
                          placeholder={q.placeholder}
                        />
                        {!!q.maxLength && (
                          <p className="text-xs text-muted-foreground text-right mt-1">
                            {(form[q.id] ?? "").length} / {q.maxLength}
                          </p>
                        )}
                      </div>
                    ) : q.type === "select" ? (
                      <select name={q.id} value={form[q.id] ?? ""} onChange={handleChange}
                        required={q.required} className={INPUT_CLASS}>
                        <option value="">{q.placeholder || "선택해주세요"}</option>
                        {getSelectOptions(q.id, q.options, q.excludeGroup).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : q.type === "file" ? (
                      <div>
                        {q.placeholder && (
                          <p className="text-xs text-muted-foreground mb-2 whitespace-pre-wrap">{q.placeholder}</p>
                        )}
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(q.id, e.target.files?.[0] ?? null)}
                          required={q.required && !form[q.id]}
                          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                        {fileUploading[q.id] ? (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> 업로드 중...
                          </p>
                        ) : form[q.id] ? (
                          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5">
                            <Paperclip className="h-3.5 w-3.5" /> {parseFileAnswer(form[q.id]).name} 업로드 완료
                          </p>
                        ) : null}
                      </div>
                    ) : q.type === "portfolio" ? (
                      <div>
                        {q.placeholder && (
                          <p className="text-xs text-muted-foreground mb-2 whitespace-pre-wrap">{q.placeholder}</p>
                        )}
                        <div className="flex gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => handlePortfolioModeChange(q.id, "url")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                              (portfolioMode[q.id] ?? "url") === "url"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            링크로 제출
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePortfolioModeChange(q.id, "file")}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                              portfolioMode[q.id] === "file"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            PDF 업로드
                          </button>
                        </div>
                        {(portfolioMode[q.id] ?? "url") === "url" ? (
                          <input
                            type="url"
                            name={q.id}
                            value={form[q.id] ?? ""}
                            onChange={handleChange}
                            required={q.required}
                            className={INPUT_CLASS}
                            placeholder="https://..."
                          />
                        ) : (
                          <div>
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              onChange={(e) => handlePortfolioFileChange(q.id, e.target.files?.[0] ?? null)}
                              required={q.required && !form[q.id]}
                              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                            />
                            <p className="text-xs text-muted-foreground/70 mt-2">
                              PDF 업로드가 안 되면 구글 드라이브에 올린 뒤 &lsquo;링크로 제출&rsquo;에서 공유 링크를 첨부해주세요.
                            </p>
                            {fileUploading[q.id] ? (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> 업로드 중...
                              </p>
                            ) : form[q.id] ? (
                              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5">
                                <Paperclip className="h-3.5 w-3.5" /> {parsePortfolioAnswer(form[q.id]).name} 업로드 완료
                              </p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : q.type === "checkbox" ? (
                      <label className="flex items-start gap-2.5 text-base text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          name={q.id}
                          checked={form[q.id] === "true"}
                          onChange={(e) => handleCheckboxChange(q.id, e.target.checked)}
                          required={q.required}
                          className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
                        />
                        <span className="whitespace-pre-wrap">{q.placeholder}</span>
                      </label>
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
                <button type="submit" disabled={submitting || Object.values(fileUploading).some(Boolean)}
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

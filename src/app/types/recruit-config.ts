export interface RecruitQuestion {
  id: "motivation" | "experience" | "portfolio";
  label: string;
  placeholder: string;
  required: boolean;
  visible: boolean;
  type: "textarea" | "url";
  rows?: number;
}

export interface RecruitConfig {
  generation: string;
  isOpen: boolean;
  applicationStart: string;
  applicationEnd: string;
  interviewStart: string;
  interviewEnd: string;
  resultDate: string;
  questions: RecruitQuestion[];
}

export const KV_KEY = "recruit:config";

export const DEFAULT_RECRUIT_CONFIG: RecruitConfig = {
  generation: "KHUX 4기",
  isOpen: true,
  applicationStart: "2026-03-14",
  applicationEnd: "2026-05-05",
  interviewStart: "2026-05-08",
  interviewEnd: "2026-05-12",
  resultDate: "2026-05-15",
  questions: [
    {
      id: "motivation",
      label: "지원 동기",
      placeholder: "KHUX에 지원하게 된 동기와 학회에서 이루고 싶은 목표를 자유롭게 작성해주세요.",
      required: true,
      visible: true,
      type: "textarea",
      rows: 5,
    },
    {
      id: "experience",
      label: "관련 경험",
      placeholder: "UX/UI 관련 경험이나 프로젝트가 있다면 작성해주세요. (선택)",
      required: false,
      visible: true,
      type: "textarea",
      rows: 4,
    },
    {
      id: "portfolio",
      label: "포트폴리오 링크",
      placeholder: "https://... (선택)",
      required: false,
      visible: true,
      type: "url",
    },
  ],
};

/** "2026-03-14" → "2026.03.14" */
export function formatDate(iso: string): string {
  return iso.replace(/-/g, ".");
}

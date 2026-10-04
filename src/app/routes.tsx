import { createBrowserRouter } from "react-router";
import { Home } from "./pages/home";
import { ArticleDetail } from "./pages/article-detail";
import { ActivityDetail } from "./pages/activity-detail";
import { Gallery } from "./pages/gallery";
import { Recruit } from "./pages/recruit";
import { RecruitRedirect } from "./pages/recruit-redirect";
import { RecruitLanding } from "./pages/recruit-landing";
import { AdminLogin } from "./pages/admin-login";
import { AdminDashboard } from "./pages/admin-dashboard";
import { AdminApplications } from "./pages/admin-applications";
import { Layout } from "./components/layout";
import { RecruitOnlyLayout } from "./components/recruit-only-layout";
import { NotFound } from "./pages/not-found";
import { ReviewLogin } from "./pages/review-login";
import { DiscordCallback } from "./pages/discord-callback";
import { ReviewDashboard } from "./pages/review-dashboard";
import { ReviewForm } from "./pages/review-form";
import { AdminReview } from "./pages/admin-review";
import { Notice } from "./pages/notice";
import { Members } from "./pages/members";
import { MembersNotice } from "./pages/members-notice";
import { WhenToMeet } from "./pages/when-to-meet";
import { WhenToMeetMembers } from "./pages/when-to-meet-members";
import { WhenToMeetSchedule } from "./pages/when-to-meet-schedule";

// 리크루팅 전용 배포본(VITE_SITE_MODE=recruit-only)에서는 지원서 페이지만 노출.
// 같은 코드베이스로 두 개의 Vercel 프로젝트(메인 사이트 / 리크루팅 전용 사이트)를 운영하기 위한 분기.
const isRecruitOnly = import.meta.env.VITE_SITE_MODE === "recruit-only";

const recruitOnlyRoutes = [
  {
    path: "/",
    Component: RecruitOnlyLayout,
    children: [
      { index: true, Component: RecruitLanding },
      { path: "recruit", Component: Recruit },
      { path: "*", Component: NotFound },
    ],
  },
  { path: "/admin/login", Component: AdminLogin },
  { path: "/admin/dashboard", Component: AdminDashboard },
  { path: "/admin/applications", Component: AdminApplications },
];

const fullSiteRoutes = [
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      // 메인 사이트에서는 지원서 폼을 직접 노출하지 않고 리크루팅 전용 사이트로 보낸다
      { path: "recruit", Component: RecruitRedirect },
      { path: "notice", Component: Notice },
      { path: "articles/:id", Component: ArticleDetail },
      { path: "activities/:id", Component: ActivityDetail },
      { path: "gallery", Component: Gallery },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
  },
  {
    path: "/admin/review",
    Component: AdminReview,
  },
  {
    path: "/admin/applications",
    Component: AdminApplications,
  },
  {
    path: "/review/login",
    Component: ReviewLogin,
  },
  {
    path: "/members/login",
    Component: ReviewLogin,
  },
  {
    path: "/members",
    Component: Members,
  },
  {
    path: "/members/notice",
    Component: MembersNotice,
  },
  {
    path: "/auth/discord/callback",
    Component: DiscordCallback,
  },
  {
    path: "/review",
    Component: ReviewDashboard,
  },
  {
    path: "/review/:sessionId/:targetId",
    Component: ReviewForm,
  },
  {
    path: "/when-to-meet",
    Component: WhenToMeet,
  },
  {
    path: "/when-to-meet/members",
    Component: WhenToMeetMembers,
  },
  {
    path: "/when-to-meet/schedule/:discordId",
    Component: WhenToMeetSchedule,
  },
];

export const router = createBrowserRouter(isRecruitOnly ? recruitOnlyRoutes : fullSiteRoutes);

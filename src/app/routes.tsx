import { createBrowserRouter } from "react-router";
import { Home } from "./pages/home";
import { ArticleDetail } from "./pages/article-detail";
import { Recruit } from "./pages/recruit";
import { AdminLogin } from "./pages/admin-login";
import { AdminDashboard } from "./pages/admin-dashboard";
import { Layout } from "./components/layout";
import { NotFound } from "./pages/not-found";
import { ReviewLogin } from "./pages/review-login";
import { DiscordCallback } from "./pages/discord-callback";
import { ReviewDashboard } from "./pages/review-dashboard";
import { ReviewForm } from "./pages/review-form";
import { AdminReview } from "./pages/admin-review";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "recruit", Component: Recruit },
      { path: "articles/:id", Component: ArticleDetail },
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
    path: "/review/login",
    Component: ReviewLogin,
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
]);

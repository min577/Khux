import { createBrowserRouter } from "react-router";
import { Home } from "./pages/home";
import { About } from "./pages/about";
import { ArticleDetail } from "./pages/article-detail";
import { Articles } from "./pages/articles";
import { News } from "./pages/news";
import { Gallery } from "./pages/gallery";
import { Activities } from "./pages/activities";
import { Recruit } from "./pages/recruit";
import { AdminLogin } from "./pages/admin-login";
import { AdminDashboard } from "./pages/admin-dashboard";
import { Layout } from "./components/layout";
import { NotFound } from "./pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "articles", Component: Articles },
      { path: "articles/:id", Component: ArticleDetail },
      { path: "news", Component: News },
      { path: "gallery", Component: Gallery },
      { path: "activities", Component: Activities },
      { path: "recruit", Component: Recruit },
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
]);

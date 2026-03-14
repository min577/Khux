import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  Newspaper,
  Users,
  Image,
  Calendar,
  FileText,
  Target,
  Lightbulb,
} from "lucide-react";
import type { Article, NewsItem } from "../data/mock-data";
import { apiFetch } from "../../utils/supabase-client";

export function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, newsRes] = await Promise.all([
          apiFetch("/articles"),
          apiFetch("/news"),
        ]);
        const articlesData = await articlesRes.json();
        const newsData = await newsRes.json();
        setArticles(articlesData.articles || []);
        setNews(newsData.news || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-muted/50 to-background py-24 sm:py-36">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6">
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                UX to Product Builder
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10">
              당신의 다음 커리어는 어디를 향하고 있나요?
              <br />
              지금 KHUX에서, AI 시대를 주도할 UXer로 성장하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/recruit"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-lg font-medium"
              >
                4기 지원하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-8 py-4 bg-accent text-accent-foreground rounded-xl hover:bg-accent/80 transition-colors text-lg"
              >
                학회 소개
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl mb-2">4</div>
              <div className="text-sm text-muted-foreground">전문 팀</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl mb-2">{articles.length}</div>
              <div className="text-sm text-muted-foreground">아티클</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Newspaper className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl mb-2">{news.length}</div>
              <div className="text-sm text-muted-foreground">소식</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl mb-2">3</div>
              <div className="text-sm text-muted-foreground">기수 운영</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                About KHUX
              </h2>
              <p className="text-xl text-muted-foreground">
                경희대학교 UX/UI 리서치 학회
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="relative p-10 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-2xl border border-primary/20 overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl mb-4">Our Mission</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    사용자 중심의 디자인 사고를 통해 더 나은 디지털 경험을 만들고,
                    UX/UI 분야의 미래 인재를 양성합니다.
                  </p>
                </div>
              </div>

              <div className="relative p-10 bg-gradient-to-br from-accent via-accent/30 to-transparent rounded-2xl border border-border overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/30 rounded-full blur-3xl group-hover:bg-accent/40 transition-all" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-6">
                    <Lightbulb className="h-7 w-7 text-accent-foreground" />
                  </div>
                  <h3 className="text-2xl mb-4">Our Vision</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    국내 최고의 대학 UX/UI 커뮤니티로 성장하여, 업계와 학계를 연결하는
                    플랫폼이 되고자 합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                학회 소개 더 보기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Page Previews Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl mb-4">Explore KHUX</h2>
            <p className="text-lg text-muted-foreground">
              KHUX의 다양한 활동과 콘텐츠를 만나보세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Articles Card */}
            <Link
              to="/articles"
              className="group relative p-8 bg-card border border-border rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl mb-2">Articles</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  UX/UI 디자인 관련 아티클과 리서치 결과를 공유합니다.
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-blue-600 group-hover:gap-2 transition-all">
                  아티클 보기 <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* Activities Card */}
            <Link
              to="/activities"
              className="group relative p-8 bg-card border border-border rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <Calendar className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="text-xl mb-2">Activities</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  세미나, 프로젝트, 워크숍 등 다양한 활동을 소개합니다.
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600 group-hover:gap-2 transition-all">
                  활동 보기 <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* Gallery Card */}
            <Link
              to="/gallery"
              className="group relative p-8 bg-card border border-border rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                  <Image className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-xl mb-2">Gallery</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  KHUX의 활동 현장과 카드뉴스를 사진으로 만나보세요.
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-purple-600 group-hover:gap-2 transition-all">
                  갤러리 보기 <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* News Card */}
            <Link
              to="/news"
              className="group relative p-8 bg-card border border-border rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
                  <Newspaper className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="text-xl mb-2">News</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  학회 공지사항, 이벤트, 리크루팅 소식을 전합니다.
                </p>
                <span className="inline-flex items-center gap-1 text-sm text-amber-600 group-hover:gap-2 transition-all">
                  소식 보기 <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* Recruit Card */}
            <Link
              to="/recruit"
              className="group relative p-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden md:col-span-2 lg:col-span-2"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl mb-2">Recruit - 4기 모집 중!</h3>
                  <p className="text-muted-foreground text-sm">
                    KHUX 4기 멤버를 모집합니다. UX/UI에 관심 있는 경희대 학생이라면 지금 바로 지원하세요.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl group-hover:bg-primary/90 transition-colors whitespace-nowrap">
                  지원하기 <ArrowRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl mb-4">
            KHUX와 함께 성장하세요
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            UX/UI 디자인에 관심있는 모든 분들을 환영합니다.
            <br />
            함께 배우고, 연구하고, 성장하는 커뮤니티에 참여하세요.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-foreground text-primary rounded-lg hover:bg-primary-foreground/90 transition-colors"
          >
            자세히 알아보기
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

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
      <section className="relative bg-background py-24 sm:py-36 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6 text-foreground">
              UX to Product Builder
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
              당신의 다음 커리어는 어디를 향하고 있나요?
              <br />
              지금 KHUX에서, AI 시대를 주도할 UXer로 성장하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/recruit"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-foreground text-background rounded-md hover:bg-foreground/85 transition-colors text-base font-medium"
              >
                4기 지원하기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-8 py-3.5 border border-border text-foreground rounded-md hover:bg-muted transition-colors text-base"
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
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl mb-4">
                About KHUX
              </h2>
              <p className="text-lg text-muted-foreground">
                경희대학교 UX/UI 리서치 학회
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-8 bg-background rounded-lg border border-border hover:border-foreground/20 transition-colors">
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-5">
                  <Target className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="text-xl mb-3">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed text-[0.9375rem]">
                  사용자 중심의 디자인 사고를 통해 더 나은 디지털 경험을 만들고,
                  UX/UI 분야의 미래 인재를 양성합니다.
                </p>
              </div>

              <div className="p-8 bg-background rounded-lg border border-border hover:border-foreground/20 transition-colors">
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-5">
                  <Lightbulb className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="text-xl mb-3">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed text-[0.9375rem]">
                  국내 최고의 대학 UX/UI 커뮤니티로 성장하여, 업계와 학계를 연결하는
                  플랫폼이 되고자 합니다.
                </p>
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
      <section className="py-20 bg-muted/50 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl mb-3">Explore KHUX</h2>
            <p className="text-base text-muted-foreground">
              KHUX의 다양한 활동과 콘텐츠를 만나보세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {/* Articles Card */}
            <Link
              to="/articles"
              className="group p-7 bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-5">
                <BookOpen className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-lg mb-2">Articles</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                UX/UI 디자인 관련 아티클과 리서치 결과를 공유합니다.
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-foreground/70 group-hover:text-foreground group-hover:gap-2 transition-all">
                아티클 보기 <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* Activities Card */}
            <Link
              to="/activities"
              className="group p-7 bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-5">
                <Calendar className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-lg mb-2">Activities</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                세미나, 프로젝트, 워크숍 등 다양한 활동을 소개합니다.
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-foreground/70 group-hover:text-foreground group-hover:gap-2 transition-all">
                활동 보기 <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* Gallery Card */}
            <Link
              to="/gallery"
              className="group p-7 bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-5">
                <Image className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-lg mb-2">Gallery</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                KHUX의 활동 현장과 카드뉴스를 사진으로 만나보세요.
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-foreground/70 group-hover:text-foreground group-hover:gap-2 transition-all">
                갤러리 보기 <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* News Card */}
            <Link
              to="/news"
              className="group p-7 bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-5">
                <Newspaper className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-lg mb-2">News</h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                학회 공지사항, 이벤트, 리크루팅 소식을 전합니다.
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-foreground/70 group-hover:text-foreground group-hover:gap-2 transition-all">
                소식 보기 <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            {/* Recruit Card */}
            <Link
              to="/recruit"
              className="group p-7 bg-foreground text-background border border-foreground rounded-lg hover:bg-foreground/90 transition-colors md:col-span-2 lg:col-span-2"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <div className="w-10 h-10 rounded-md bg-background/15 flex items-center justify-center mb-5">
                    <FileText className="h-5 w-5 text-background" />
                  </div>
                  <h3 className="text-lg mb-2 text-background">Recruit - 4기 모집 중!</h3>
                  <p className="text-background/70 text-sm leading-relaxed">
                    KHUX 4기 멤버를 모집합니다. UX/UI에 관심 있는 경희대 학생이라면 지금 바로 지원하세요.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-background text-foreground rounded-md whitespace-nowrap text-sm font-medium">
                  지원하기 <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl mb-4 text-background">
            KHUX와 함께 성장하세요
          </h2>
          <p className="text-base mb-8 text-background/75 max-w-2xl mx-auto leading-relaxed">
            UX/UI 디자인에 관심있는 모든 분들을 환영합니다.
            <br />
            함께 배우고, 연구하고, 성장하는 커뮤니티에 참여하세요.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-background text-foreground rounded-md hover:bg-background/90 transition-colors text-sm font-medium"
          >
            자세히 알아보기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

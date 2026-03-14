import { useState, useEffect } from "react";
import type { NewsItem } from "../data/mock-data";
import { news as mockNews } from "../data/mock-data";
import { NewsCard } from "../components/news-card";
import { apiFetch } from "../../utils/supabase-client";

export function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch("/news");
        const data = await res.json();
        const fetched = data.news || [];
        setItems(fetched.length > 0 ? fetched : mockNews);
      } catch {
        setItems(mockNews);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = Array.from(new Set(items.map((item) => item.category)));

  const filteredNews = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl sm:text-5xl mb-4">News</h1>
          <p className="text-lg text-muted-foreground">
            KHUX의 최신 소식과 활동 내역을 확인하세요.
            학회의 다양한 이벤트와 공지사항을 전해드립니다.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Category:</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-sm px-4 py-2 rounded-md transition-colors ${
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent/80"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-sm px-4 py-2 rounded-md transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground hover:bg-accent/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
            {filteredNews.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">해당 카테고리의 소식이 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

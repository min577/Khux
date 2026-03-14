import { useState, useEffect } from "react";
import type { Activity } from "../data/mock-data";
import { activities as mockActivities } from "../data/mock-data";
import { Calendar, ChevronRight } from "lucide-react";
import { apiFetch } from "../../utils/supabase-client";

export function Activities() {
  const [items, setItems] = useState<Activity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch("/activities");
        const data = await res.json();
        const fetched = data.activities || [];
        setItems(fetched.length > 0 ? fetched : mockActivities);
      } catch {
        setItems(mockActivities);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = Array.from(new Set(items.map((a) => a.category)));

  const filteredActivities = selectedCategory
    ? items.filter((a) => a.category === selectedCategory)
    : items;

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl sm:text-5xl mb-4">Activities</h1>
          <p className="text-lg text-muted-foreground">
            KHUX에서 진행하는 다양한 활동들을 소개합니다.
            세미나, 프로젝트, 워크숍 등 UX/UI 역량을 키울 수 있는 프로그램을 운영합니다.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">카테고리:</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-sm px-4 py-2 rounded-md transition-colors ${
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent/80"
              }`}
            >
              전체
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
            {/* Activities List */}
            <div className="space-y-6">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    {activity.imageUrl && (
                      <div className="md:w-80 flex-shrink-0">
                        <img
                          src={activity.imageUrl}
                          alt={activity.title}
                          className="w-full h-48 md:h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                          {activity.category}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {activity.date}
                        </div>
                      </div>

                      <h2 className="text-xl md:text-2xl font-medium mb-3">{activity.title}</h2>
                      <p className="text-muted-foreground mb-4">{activity.description}</p>

                      {/* Expandable content */}
                      {expandedId === activity.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                            {activity.content}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          setExpandedId(expandedId === activity.id ? null : activity.id)
                        }
                        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors mt-2"
                      >
                        {expandedId === activity.id ? "접기" : "자세히 보기"}
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedId === activity.id ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredActivities.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">해당 카테고리의 활동이 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

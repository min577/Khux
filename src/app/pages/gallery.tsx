import { useState, useEffect } from "react";
import type { GalleryItem } from "../data/mock-data";
import { gallery as mockGallery } from "../data/mock-data";
import { X } from "lucide-react";
import { apiFetch } from "../../utils/supabase-client";

export function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch("/gallery");
        const data = await res.json();
        const fetched = data.gallery || [];
        setItems(fetched.length > 0 ? fetched : mockGallery);
      } catch {
        setItems(mockGallery);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = Array.from(new Set(items.map((item) => item.category)));

  const filteredGallery = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl sm:text-5xl mb-4">Gallery</h1>
          <p className="text-lg text-muted-foreground">
            KHUX의 다양한 활동 현장을 사진으로 만나보세요.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
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
            {/* Gallery Grid - Masonry style */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {filteredGallery.map((item) => (
                <div
                  key={item.id}
                  className="break-inside-avoid group cursor-pointer"
                  onClick={() => setSelectedImage(item)}
                >
                  <div className="relative overflow-hidden rounded-xl border border-border bg-card">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="inline-block text-xs px-2 py-1 bg-white/20 backdrop-blur-sm rounded-md text-white mb-2">
                        {item.category}
                      </span>
                      <h3 className="text-white font-medium">{item.title}</h3>
                      <p className="text-white/80 text-sm mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredGallery.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">해당 카테고리의 사진이 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.title}
              className="w-full max-h-[70vh] object-contain bg-black"
            />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md">
                  {selectedImage.category}
                </span>
                <span className="text-sm text-muted-foreground">{selectedImage.date}</span>
              </div>
              <h2 className="text-xl font-medium mb-2">{selectedImage.title}</h2>
              <p className="text-muted-foreground">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

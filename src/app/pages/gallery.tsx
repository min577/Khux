import { useState, useEffect, useCallback } from "react";
import type { GalleryItem } from "../data/mock-data";
import { gallery as mockGallery } from "../data/mock-data";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "../../utils/supabase-client";
import useEmblaCarousel from "embla-carousel-react";

export function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 메인 캐러셀 (자동 슬라이드)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });

  // 자동 슬라이드
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  // 현재 인덱스 추적
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // 데이터 fetch
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

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  // 라이트박스 내 이전/다음
  const lightboxPrev = () => {
    if (!selectedImage) return;
    const idx = filteredGallery.findIndex((item) => item.id === selectedImage.id);
    const prevIdx = (idx - 1 + filteredGallery.length) % filteredGallery.length;
    setSelectedImage(filteredGallery[prevIdx]);
  };

  const lightboxNext = () => {
    if (!selectedImage) return;
    const idx = filteredGallery.findIndex((item) => item.id === selectedImage.id);
    const nextIdx = (idx + 1) % filteredGallery.length;
    setSelectedImage(filteredGallery[nextIdx]);
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, filteredGallery]);

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
        ) : filteredGallery.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">해당 카테고리의 사진이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* ===== 캐러셀 영역 ===== */}
            <div className="relative group">
              {/* 이전 버튼 */}
              <button
                onClick={scrollPrev}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="이전 슬라이드"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* 다음 버튼 */}
              <button
                onClick={scrollNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="다음 슬라이드"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              {/* Embla 캐러셀 */}
              <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
                <div className="flex">
                  {filteredGallery.map((item) => (
                    <div
                      key={item.id}
                      className="flex-[0_0_100%] min-w-0 px-1"
                    >
                      <div
                        className="relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card"
                        onClick={() => setSelectedImage(item)}
                      >
                        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        {/* 오버레이 정보 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                          <span className="inline-block text-xs px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white mb-3">
                            {item.category}
                          </span>
                          <h3 className="text-white text-xl sm:text-2xl font-semibold">
                            {item.title}
                          </h3>
                          <p className="text-white/80 text-sm sm:text-base mt-2 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 인디케이터 (도트) */}
              <div className="flex justify-center gap-2 mt-6">
                {filteredGallery.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "w-8 h-2 bg-primary"
                        : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`슬라이드 ${index + 1}로 이동`}
                  />
                ))}
              </div>

              {/* 슬라이드 카운터 */}
              <div className="text-center mt-3">
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} / {filteredGallery.length}
                </span>
              </div>
            </div>

            {/* ===== 하단 썸네일 그리드 ===== */}
            <div className="mt-12">
              <h2 className="text-lg font-medium mb-4 text-muted-foreground">
                전체 보기
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                {filteredGallery.map((item, index) => (
                  <div
                    key={item.id}
                    className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200 aspect-square ${
                      index === currentIndex
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                    onClick={() => {
                      scrollTo(index);
                      setSelectedImage(item);
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== Lightbox Modal ===== */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          {/* 이전 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              lightboxPrev();
            }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="이전 이미지"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* 다음 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              lightboxNext();
            }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="다음 이미지"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

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

import React, { useState, useRef, useEffect } from "react";

interface MediaItem {
  media_url: string;
  media_type: "image" | "video";
}

interface ProductMediaProps {
  media: MediaItem[];
  alt: string;
}

export const ProductMedia: React.FC<ProductMediaProps> = ({ media, alt }) => {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback for missing media
  if (!media || media.length === 0) {
    return (
      <div className="h-full w-full bg-muted flex items-center justify-center">
        <img
          src="/placeholder.png"
          alt={alt}
          className="h-full w-full object-cover opacity-50 transition-colors"
        />
      </div>
    );
  }

  const total = media.length;
  const current = media[index];

  const nextSlide = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    setIndex((prev) => (prev - 1 + total) % total);
  };

  // Touch swipe (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;

    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();

    touchStartX.current = null;
  };

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        !containerRef.current ||
        document.activeElement !== containerRef.current
      )
        return;
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [total]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative h-full w-full overflow-hidden outline-none bg-muted group/media"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Media Rendering */}
      {current.media_type === "video" ? (
        <video
          key={current.media_url}
          src={current.media_url}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          key={current.media_url}
          src={current.media_url}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-700 group-hover/media:scale-105"
        />
      )}

      {/* Navigation Arrows - Styled for Light/Dark contrast */}
      {total > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-50 bg-background/60 hover:bg-background/90 text-foreground w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border border-border transition-all opacity-0 group-hover/media:opacity-100 scale-90 group-hover/media:scale-100"
          >
            ‹
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-50 bg-background/60 hover:bg-background/90 text-foreground w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border border-border transition-all opacity-0 group-hover/media:opacity-100 scale-90 group-hover/media:scale-100"
          >
            ›
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-40 bg-background/20 backdrop-blur-sm px-2 py-1 rounded-full">
          {media.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 transition-all duration-300 rounded-full ${
                i === index ? "w-4 bg-foreground" : "w-1.5 bg-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

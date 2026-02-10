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

  if (!media || media.length === 0) {
    return (
      <img
        src="/placeholder.png"
        alt={alt}
        className="h-full w-full object-cover"
      />
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

  // Keyboard arrows support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (document.activeElement !== containerRef.current) return;

      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative h-full w-full overflow-hidden outline-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Media */}
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
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      )}

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-black/60 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm pointer-events-auto"
          >
            ‹
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-black/60 hover:bg-black/80 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm pointer-events-auto"
          >
            ›
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-40">
          {media.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === index ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

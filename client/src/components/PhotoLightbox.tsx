import { useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  photos: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({ photos, currentIndex, onClose, onNavigate }: Props) {
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => {
    onNavigate(currentIndex > 0 ? currentIndex - 1 : photos.length - 1);
  }, [currentIndex, photos.length, onNavigate]);

  const next = useCallback(() => {
    onNavigate(currentIndex < photos.length - 1 ? currentIndex + 1 : 0);
  }, [currentIndex, photos.length, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-[13px] font-medium bg-black/40 px-3 py-1 rounded-full pointer-events-none">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Left arrow */}
      {photos.length > 1 && (
        <button
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white p-3 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image area */}
      <div
        className="w-full h-full flex items-center justify-center px-16 sm:px-24 py-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={currentIndex}
          src={photos[currentIndex]}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none rounded"
          draggable={false}
        />
      </div>

      {/* Right arrow */}
      {photos.length > 1 && (
        <button
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white p-3 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Next photo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Dot indicators for mobile (max 10) */}
      {photos.length > 1 && photos.length <= 12 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex ? "bg-white w-4" : "bg-white/40"
              }`}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

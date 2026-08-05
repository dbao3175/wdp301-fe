import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

export interface StoryboardImage {
  url: string;
  originalName?: string;
}

interface StoryboardGalleryProps {
  images: StoryboardImage[];
  title?: string;
}

/**
 * Reusable storyboard gallery with thumbnail grid + lightbox viewer.
 * Used in place of the old "Download Storyboard" button so board members and
 * editors can browse the submitted storyboard pages directly.
 */
const StoryboardGallery: React.FC<StoryboardGalleryProps> = ({ images, title }) => {
  const [active, setActive] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="border-2 border-dashed border-neutral-400 p-4 text-center">
        <p className="font-mono text-[9px] font-bold uppercase text-neutral-500">
          No storyboard images attached
        </p>
      </div>
    );
  }

  const close = () => setActive(null);
  const prev = () =>
    setActive((current) =>
      current === null ? current : (current - 1 + images.length) % images.length,
    );
  const next = () =>
    setActive((current) =>
      current === null ? current : (current + 1) % images.length,
    );

  return (
    <div>
      {title && (
        <p className="font-mono block text-[10px] uppercase font-extrabold text-[#E63946] mb-2">
          {title} ({images.length})
        </p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <button
            key={`${img.url}-${idx}`}
            type="button"
            onClick={() => setActive(idx)}
            className="group relative bg-manuscript-gray border-2 border-ink-black overflow-hidden cursor-pointer hover:border-[#E63946] transition-colors"
            aria-label={`View storyboard page ${idx + 1}`}
          >
            <img
              src={img.url}
              alt={img.originalName || `Storyboard ${idx + 1}`}
              className="w-full h-20 object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close storyboard viewer"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 md:left-6 p-2 text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Previous storyboard page"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 md:right-6 p-2 text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Next storyboard page"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
          <figure
            className="max-w-full max-h-full flex flex-col items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[active].url}
              alt={images[active].originalName || `Storyboard ${active + 1}`}
              className="max-w-full max-h-[85vh] object-contain border-2 border-white/20"
            />
            <figcaption className="font-mono text-[10px] text-white/70 uppercase font-bold">
              Page {active + 1} / {images.length}
              {images[active].originalName ? ` — ${images[active].originalName}` : ''}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
};

export default StoryboardGallery;

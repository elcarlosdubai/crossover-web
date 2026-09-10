"use client";
import React, { useState, useEffect } from "react";

export default function PhotoGallery({ images }: { images: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex]);

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length);
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div 
            key={index} 
            onClick={() => setSelectedIndex(index)}
            className="aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-pointer group relative"
          >
            <img src={url} alt={`Galería ${index + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-3xl drop-shadow-md">zoom_in</span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in">
          
          {/* Close Button */}
          <button 
            onClick={() => setSelectedIndex(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 flex items-center justify-center transition-all z-10"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>

          {/* Prev Button */}
          {images.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 md:left-10 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-14 h-14 flex items-center justify-center transition-all z-10"
            >
              <span className="material-symbols-outlined text-[32px]">chevron_left</span>
            </button>
          )}

          {/* Main Image */}
          <div className="relative w-full max-w-5xl h-[80vh] px-12 md:px-24 flex items-center justify-center" onClick={() => setSelectedIndex(null)}>
            <img 
              src={images[selectedIndex]} 
              alt={`Foto ${selectedIndex + 1}`} 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-zoom-in"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 md:right-10 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-14 h-14 flex items-center justify-center transition-all z-10"
            >
              <span className="material-symbols-outlined text-[32px]">chevron_right</span>
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 font-medium text-sm tracking-widest">
            {selectedIndex + 1} / {images.length}
          </div>
          
        </div>
      )}
    </>
  );
}

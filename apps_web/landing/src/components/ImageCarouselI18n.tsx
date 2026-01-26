import { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

interface ImageCarouselProps {
  images: string[];
}

type ViewMode = 'light' | 'dark';

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dark');
  
  // Set client-side flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Filter images based on view mode
  const filteredImages = images.filter(img => {
    const isDark = img.includes('dark') || img.includes('theme-dark');
    return viewMode === 'dark' ? isDark : !isDark;
  });

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (isPaused || !isClient || filteredImages.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPaused, isClient, filteredImages.length, currentIndex]);

  if (!isClient || filteredImages.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Carregant imatges...</div>
      </div>
    );
  }

  const currentImage = filteredImages[currentIndex];
  const filename = currentImage.split('/').pop() || '';
  let title = filename.replace(/\.[^/.]+$/, '');
  title = title.replace(/_/g, ' ');

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Controls del tema (Clar/Fosc) */}
      <div className="flex justify-center mb-8 gap-2">
        <button
          onClick={() => setViewMode('light')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            viewMode === 'light'
              ? 'bg-yellow-400 text-yellow-900 shadow-md focus:ring-yellow-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-yellow-300'
          }`}
          aria-label={t('carousel.light_mode')}
          aria-pressed={viewMode === 'light'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 18a6 6 0 100-12 6 6 0 000 12zM12 1v6m0 6v6m4.22-15.22l-4.24 4.24m-5.96 5.96l-4.24 4.24M1 12h6m6 0h6m-15.22 4.22l4.24-4.24m5.96-5.96l4.24-4.24" />
          </svg>
          Tema clar
        </button>
        <button
          onClick={() => setViewMode('dark')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            viewMode === 'dark'
              ? 'bg-slate-700 text-white shadow-md focus:ring-slate-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-slate-400'
          }`}
          aria-label={t('carousel.dark_mode')}
          aria-pressed={viewMode === 'dark'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.64 15.95a.75.75 0 00-1.08-.02A7.041 7.041 0 0112 20.25a7.04 7.04 0 01-8.36-10.635.75.75 0 00-1.088.088A8.461 8.461 0 1021.64 15.95z" />
          </svg>
          Tema fosc
        </button>
      </div>

      {/* Contenidor de la imatge principal - SIMPLE I GRAN */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden group">
        <div className="aspect-video flex items-center justify-center p-8">
          <img 
            src={currentImage} 
            alt={title}
            className="w-full h-full object-contain max-w-full max-h-full"
            loading="eager"
          />
        </div>
      </div>

      {/* Botons de navegació */}
      <button 
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-lg text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        aria-label={t('carousel.previous_image')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-lg text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        aria-label={t('carousel.next_image')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicadors de pàgina */}
      <div className="flex justify-center gap-2 flex-wrap">
        {filteredImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all rounded-full ${
              index === currentIndex 
                ? 'bg-blue-600 w-8 h-2' 
                : 'bg-gray-300 dark:bg-gray-600 w-2 h-2 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={t('carousel.go_to_image', { index: index + 1 })}
            aria-current={index === currentIndex}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;

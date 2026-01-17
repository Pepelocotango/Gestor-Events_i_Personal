import { useState, useEffect } from 'react';
import type { JSX } from 'react';

interface ImageCarouselProps {
  images: string[];
}

type ViewMode = 'light' | 'dark';

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dark');
  
  // Set client-side flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Filtrar imatges segons el mode (clar/fosc)
  const filteredImages = images.filter((image) => {
    if (viewMode === 'light') {
      return image.includes('_clar') || (!image.includes('_clar') && !image.includes('_fosc'));
    } else {
      return image.includes('_fosc') || (!image.includes('_clar') && !image.includes('_fosc'));
    }
  });
  
  // Funció per obtenir el títol de la imatge
  const getImageTitle = (filename: string): string => {
    if (!filename) return '';
    let title = filename.replace(/\.[^/.]+$/, '');
    title = title.replace(/_/g, ' ');
    return title
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Autoplay del carrusel
  useEffect(() => {
    if (isPaused || !isClient || !filteredImages.length) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPaused, isClient, currentIndex, filteredImages.length]);

  // Reset currentIndex quan canvia el viewMode
  useEffect(() => {
    setCurrentIndex(0);
  }, [viewMode]);

  // Funció per anar a la següent imatge
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredImages.length);
  };

  // Funció per anar a la imatge anterior
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + filteredImages.length) % filteredImages.length);
  };

  // Funció per anar a una imatge específica
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!isClient || !filteredImages.length) {
    return <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center">
      <p>Carregant imatges...</p>
    </div>;
  }

  const currentImage = filteredImages[currentIndex];

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Controls del tema (Clar/Fosc) */}
      <div className="flex justify-center mb-6 gap-2">
        <button
          onClick={() => setViewMode('light')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            viewMode === 'light'
              ? 'bg-yellow-400 text-yellow-900 shadow-md focus:ring-yellow-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-yellow-300'
          }`}
          aria-label="Canviar a mode clar"
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
          aria-label="Canviar a mode fosc"
          aria-pressed={viewMode === 'dark'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.64 15.95a.75.75 0 00-1.08-.02A7.041 7.041 0 0112 20.25a7.04 7.04 0 01-8.36-10.635.75.75 0 00-1.088.088A8.461 8.461 0 1021.64 15.95z" />
          </svg>
          Tema fosc
        </button>
      </div>
      {/* Contenidor de la imatge principal */}
      <div className="relative overflow-hidden rounded-xl bg-white shadow-lg">
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={`/images/${currentImage}`}
            alt={getImageTitle(currentImage)}
            className="w-full h-auto max-h-[70vh] object-contain"
            loading="eager"
            width={1200}
            height={675}
          />
        </div>
        
        {/* Informació de la imatge */}
        <div className="p-4 border-t border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 text-center">
            {getImageTitle(currentImage)}
          </h3>
          <p className="text-sm text-gray-500 text-center">
            {currentImage.includes('_clar') ? 'Tema clar' : 
             currentImage.includes('_fosc') ? 'Tema fosc' : 'Captura de pantalla'}
          </p>
        </div>
      </div>

      {/* Botons de navegació */}
      <button 
        onClick={prevSlide}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        aria-label="Imatge anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        aria-label="Següent imatge"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicadors de pàgina */}
      <div className="flex justify-center mt-6 space-x-2">
        {filteredImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Anar a la imatge ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;

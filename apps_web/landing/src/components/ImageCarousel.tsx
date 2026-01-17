import { useState, useEffect } from 'react';
import type { JSX } from 'react';

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Set client-side flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  
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
    if (isPaused || !isClient) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPaused, isClient, currentIndex]);

  // Funció per anar a la següent imatge
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Funció per anar a la imatge anterior
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  // Funció per anar a una imatge específica
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!isClient || !images.length) {
    return <div className="h-96 bg-gray-100 rounded-xl flex items-center justify-center">
      <p>Carregant imatges...</p>
    </div>;
  }

  const currentImage = images[currentIndex];

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
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
        {images.map((_, index) => (
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

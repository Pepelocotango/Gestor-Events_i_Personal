import { useEffect, useState } from 'react';

// Importem els fotogrames de l'animació
const frames = [
  '/splash/frame_1.png',
  '/splash/frame_2.png',
  '/splash/frame_3.png',
  '/splash/frame_4.png',
  '/splash/frame_5.png',
  '/splash/frame_6.png',
  '/splash/frame_7.png',
  '/splash/frame_8.png',
  '/splash/frame_9.png',
];

interface AnimatedSplashProps {
  altText?: string;
}

export default function AnimatedSplash({ altText = "Loading..." }: AnimatedSplashProps) {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    // Canvia el fotograma cada 200ms
    const animationInterval = setInterval(() => {
      setCurrentFrame((prevFrame) => (prevFrame + 1) % frames.length);
    }, 200);

    return () => {
      clearInterval(animationInterval);
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-visible" style={{
      transform: 'scale(1.5)',
      transformOrigin: 'center',
      width: '100%',
      height: '100%'
    }}>
      <img 
        src={frames[currentFrame]} 
        alt={altText}
        className="w-full h-full object-contain"
        style={{ 
          mixBlendMode: 'multiply',
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}

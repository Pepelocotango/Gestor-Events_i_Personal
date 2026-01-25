import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import frame1 from '../../assets/splash/frame_1.png';
import frame2 from '../../assets/splash/frame_2.png';
import frame3 from '../../assets/splash/frame_3.png';
import frame4 from '../../assets/splash/frame_4.png';
import frame5 from '../../assets/splash/frame_5.png';
import frame6 from '../../assets/splash/frame_6.png';
import frame7 from '../../assets/splash/frame_7.png';
import frame8 from '../../assets/splash/frame_8.png';
import frame9 from '../../assets/splash/frame_9.png';

const frames = [frame1, frame2, frame3, frame4, frame5, frame6, frame7, frame8, frame9];

const SplashScreen = () => {
  const { t } = useTranslation();
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const animationInterval = setInterval(() => {
      setCurrentFrame((prevFrame) => (prevFrame + 1) % 9);
    }, 200);

    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    return () => {
      clearInterval(animationInterval);
      clearTimeout(fadeOutTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-[2000ms] ${isFadingOut ? 'opacity-0' : 'opacity-100'
        }`}
    >
      <img src={frames[currentFrame]} alt={t('common.splash_alt')} className="w-full h-full object-contain" />
    </div>
  );
};

export default SplashScreen;

import { useState, useEffect } from 'react';

export const useFontLoaded = (fontFamily: string): boolean => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkFont = async () => {
      try {
        if ('fonts' in document) {
          await document.fonts.load(`700 24px "${fontFamily}"`);
          await document.fonts.load(`400 24px "${fontFamily}"`);
          await document.fonts.load(`900 24px "${fontFamily}"`);
          
          const fontFaces = Array.from(document.fonts);
          const orbitronLoaded = fontFaces.some(font => 
            font.family.includes('Orbitron') && font.status === 'loaded'
          );
          
          if (mounted && orbitronLoaded) {
            setIsLoaded(true);
          }
        } else {
          setTimeout(() => {
            if (mounted) {
              setIsLoaded(true);
            }
          }, 2000);
        }
      } catch {
        if (mounted) {
          setTimeout(() => setIsLoaded(true), 1000);
        }
      }
    };

    checkFont();
    
    if ('fonts' in document) {
      document.fonts.addEventListener('loadingdone', () => {
        if (mounted) {
          checkFont();
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [fontFamily]);

  return isLoaded;
};

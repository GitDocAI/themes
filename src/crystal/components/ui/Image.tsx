
import React, { useState, useEffect } from 'react';
import { ContentService } from '../../../services/contentService';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  onLoadSuccess?: () => void;
  onLoadError?: () => void;
}

export const Image: React.FC<ImageProps> = ({ src, onLoadSuccess, onLoadError, onLoad, onError, style, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    setIsLoaded(false);
    setHasError(false);

    const loadImage = async () => {
      if (src && !src.startsWith('http') && !src.startsWith('blob:')  && !src.startsWith('data:')) {
        try {
          objectUrl = await ContentService.downloadFile(src);
          if (objectUrl) {
            setImageSrc(objectUrl);
          } else {
            setHasError(true);
            onLoadError?.();
          }
        } catch (error) {
          console.error(`Failed to download image from ${src}`, error);
          setHasError(true);
          onLoadError?.();
        }
      } else if (src) {
        setImageSrc(src);
      } else {
        setHasError(true);
        onLoadError?.();
      }
    };

    loadImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoadSuccess?.();
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    onLoadError?.();
    onError?.(e);
  };

  // Don't render anything if there's an error
  if (hasError) {
    return null;
  }

  return (
    <img
      {...props}
      src={imageSrc}
      style={{ ...style, display: isLoaded ? (style?.display || 'block') : 'none' }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

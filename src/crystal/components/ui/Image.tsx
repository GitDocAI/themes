
import React, { useState, useEffect } from 'react';
import { ContentService } from '../../../services/contentService';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export const Image: React.FC<ImageProps> = ({ src, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadImage = async () => {
      if (src && !src.startsWith('http') && !src.startsWith('blob:')  && !src.startsWith('data:')) {
        try {
          objectUrl = await ContentService.downloadFile(src);
          if (objectUrl) {
            setImageSrc(objectUrl);
          }
        } catch (error) {
          console.error(`Failed to download image from ${src}`, error);
          setImageSrc(src);
        }
      } else {
        setImageSrc(src);
      }
    };

    loadImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return <img {...props} src={imageSrc} />;
};

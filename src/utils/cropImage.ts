export type ObjectPosition = {
  x: number;
  y: number;
};

export const generateCroppedImage = async (
  file: File,
  position: ObjectPosition
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const targetWidth = 1920;
      const targetHeight = 640; // 3:1 ratio

      const canvas =
        document.createElement('canvas');

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx =
        canvas.getContext('2d');

      if (!ctx) {
        reject(
          new Error(
            'Canvas context not found'
          )
        );
        return;
      }

      // Original image size
      const imgWidth = img.width;
      const imgHeight = img.height;

      // Desired crop ratio
      const cropRatio =
        targetWidth / targetHeight;

      let cropWidth = imgWidth;
      let cropHeight =
        cropWidth / cropRatio;

      // If crop exceeds image height
      if (cropHeight > imgHeight) {
        cropHeight = imgHeight;
        cropWidth =
          cropHeight * cropRatio;
      }

      // Convert objectPosition → crop origin
      const maxX =
        imgWidth - cropWidth;

      const maxY =
        imgHeight - cropHeight;

      const sx =
        (position.x / 100) * maxX;

      const sy =
        (position.y / 100) * maxY;

      ctx.drawImage(
        img,
        sx,
        sy,
        cropWidth,
        cropHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                'Failed to generate image'
              )
            );
            return;
          }

          const croppedFile =
            new File(
              [blob],
              file.name,
              {
                type: 'image/jpeg',
              }
            );

          resolve(croppedFile);
        },
        'image/jpeg',
        0.95
      );
    };

    img.onerror = reject;

    img.src =
      URL.createObjectURL(file);
  });
};
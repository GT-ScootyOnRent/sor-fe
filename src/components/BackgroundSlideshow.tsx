import { useEffect, useState } from 'react';

const backgroundImages = [
  'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1591204401862-ece0f1d9e611?w=1920&h=1080&fit=crop',
];

export default function BackgroundSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-white/80" />
        </div>
      ))}
    </div>
  );
}

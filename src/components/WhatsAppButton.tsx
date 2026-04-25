import React, { useState } from 'react';

const WhatsAppButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  const whatsappNumber =
    import.meta.env.VITE_WHATSAPP_NUMBER || '918233662031';

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      'Hi! I want to inquire about vehicle rental.'
    );

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Floating Wrapper */}
      <div className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-[99999] flex flex-col items-end gap-2 pointer-events-none">
        
        {/* Tooltip - Desktop Only */}
        <div
          className={`hidden md:block transform transition-all duration-300 ease-out ${
            showTooltip
              ? 'translate-x-0 opacity-100'
              : 'translate-x-3 opacity-0'
          }`}
        >
          <div className="relative bg-white px-4 py-2 rounded-xl shadow-xl border border-gray-200 whitespace-nowrap">
            <p className="text-sm font-medium text-gray-800">
              Need help? Chat with us!
            </p>

            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -translate-y-1/2" />
          </div>
        </div>

        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsAppClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label="Chat on WhatsApp"
          className="
            pointer-events-auto
            group relative
            flex items-center justify-center
            rounded-full
            bg-green-500 hover:bg-green-600
            text-white
            w-14 h-14
            md:w-20 md:h-20
            shadow-2xl
            transition-all duration-300
            hover:scale-110
            active:scale-95
            focus:outline-none
            focus:ring-4 focus:ring-green-300
          "
        >
          {/* Ping Ring */}
          <span className="absolute inset-0 rounded-full bg-green-400 opacity-70 animate-ping" />

          {/* Soft Pulse */}
          <span className="absolute inset-0 rounded-full bg-green-500 opacity-90 animate-pulse" />

          {/* Icon */}
          <svg
            className="relative z-10 w-7 h-7 md:w-10 md:h-10"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes ping {
          75%,100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.85; }
        }

        .animate-ping {
          animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;
        }

        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default WhatsAppButton;
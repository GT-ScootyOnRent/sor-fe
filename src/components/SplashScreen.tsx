import { motion } from "framer-motion";

interface SplashScreenProps {
  onSkip?: () => void;
}

const SplashScreen = ({ onSkip }: SplashScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-50 overflow-hidden bg-[#39658c] cursor-pointer"
      onClick={onSkip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSkip?.()}
    >
      {/* Skip hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 text-white/70 text-sm"
      >
        Tap anywhere to skip
      </motion.div>

      {/* CAMERA (Map + Pins zoom together) */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 10 }}
        transition={{
          delay: 2.0,
          duration: 1.8,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{
          transformOrigin: "49.6% 77.8%", // Udaipur
        }}
        className="absolute inset-0"
      >
        {/* Exact Background / Map Image */}
        <img
          src="/SOR_Splash_Screen_Rajasthan_Map.png"
          alt="Rajasthan"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Jodhpur */}
        <Pin top="52.5%" left="43.8%" delay={0.5} />

        {/* Jaipur */}
        <Pin top="46.2%" left="62.4%" delay={1.0} />

        {/* Udaipur - active with glow */}
        <Pin top="77.8%" left="49.6%" delay={1.5} active glowDelay={1.8} />
      </motion.div>

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute top-8 left-8 z-20"
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight whitespace-nowrap">
          <span className="text-white">Scooty</span>
          <span style={{ color: "#7FA8D0" }}>onrent</span>
        </h1>
      </motion.div>
    </motion.div>
  );
};

function Pin({
  top,
  left,
  delay,
  active = false,
  glowDelay = 0,
}: {
  top: string;
  left: string;
  delay: number;
  active?: boolean;
  glowDelay?: number;
}) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ top, left }}
      initial={{ opacity: 0, scale: 0, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 15
      }}
    >
      <div className="relative">
        {/* Pulse ring for active pin */}
        {active && (
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 2.5, 3.5],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              delay: glowDelay,
              repeat: Infinity,
              duration: 1.2,
              ease: "easeOut",
            }}
            className="absolute inset-0 rounded-full bg-cyan-300"
          />
        )}

        {/* Glow effect before zoom */}
        {active && (
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 0.8, 0.6], scale: [1, 1.3, 1.2] }}
            transition={{
              delay: glowDelay,
              duration: 0.4,
              ease: "easeOut",
            }}
            className="absolute inset-[-4px] rounded-full bg-cyan-400/50 blur-sm"
          />
        )}

        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
          }}
          className="relative w-8 h-8 rounded-full bg-white shadow-2xl border border-white/30 flex items-center justify-center"
        >
          <img
            src="/scooty.svg"
            alt="Scooty"
            className="w-5 h-5 object-contain"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default SplashScreen;
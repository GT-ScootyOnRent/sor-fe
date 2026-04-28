import { motion } from "framer-motion";

const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="fixed inset-0 z-50 overflow-hidden bg-[#39658c]"
    >
      {/* CAMERA (Map + Pins zoom together) */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale:  8.5 }}
        transition={{
          delay: 2.55,
          duration: 2.15,
          ease: [0.16, 1, 0.3 , 1],
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
<Pin top="52.5%" left="43.8%" delay={0.55} />

{/* Jaipur */}
<Pin top="46.2%" left="62.4%" delay={1.05} />

{/* Udaipur */}
<Pin top="77.8%" left="49.6%" delay={1.75} active />
      </motion.div>

      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.6 }}
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
}: {
  top: string;
  left: string;
  delay: number;
  active?: boolean;
}) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ top, left }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.45 }}
    >
      <div className="relative">
        {active && (
          <motion.div
            animate={{
              scale: [1, 3],
              opacity: [0.45, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
            }}
            className="absolute inset-0 rounded-full bg-cyan-300"
          />
        )}

        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{
            repeat: Infinity,
            duration: 1.7,
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
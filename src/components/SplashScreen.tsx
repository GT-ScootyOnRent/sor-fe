// import { motion } from "framer-motion";

// const SplashScreen = () => {
//   return (
//     <motion.div
//       initial={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.8 }}
//       className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
//       style={{
//         background:
//           "linear-gradient(90deg, #f4a67f 0%, #ec6cc3 45%, #69d8e7 100%)",
//       }}
//     >
//       {/* Grid Overlay */}
//       <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:60px_60px]" />

//       {/* Content */}
//       <div className="relative z-10 text-center px-4">
//         {/* Logo */}
//         <motion.div
//           initial={{ scale: 0.75, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           transition={{ duration: 0.7 }}
//           className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center p-4"
//         >
//           <motion.img
//             src="/scooty.svg"
//             alt="Scootyonrent"
//             animate={{
//               scale: [1, 1.05, 1],
//               opacity: [0.9, 1, 0.9],
//             }}
//             transition={{
//               repeat: Infinity,
//               duration: 2,
//               ease: "easeInOut",
//             }}
//             className="w-full h-full object-contain"
//           />
//         </motion.div>

//         {/* Brand */}
//        <motion.h1
//   initial={{ y: 12, opacity: 0 }}
//   animate={{ y: 0, opacity: 1 }}
//   transition={{ delay: 0.2, duration: 0.5 }}
//   className="mt-5 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight whitespace-nowrap"
// >
//   <span className="text-black drop-shadow-sm">Scooty</span>
//   <span style={{ color: "#4F7DA8" }} className="drop-shadow-sm">
//     onrent
//   </span>
// </motion.h1>

//         {/* Loader */}
//         <motion.div
//           animate={{
//             opacity: [0.3, 1, 0.3],
//             scaleX: [0.8, 1, 0.8],
//           }}
//           transition={{
//             repeat: Infinity,
//             duration: 1.3,
//           }}
//           className="mt-5 h-1.5 w-24 rounded-full bg-white mx-auto"
//         />

//         <p className="mt-3 text-white/90 text-sm sm:text-base">
//           Your ride is getting ready...
//         </p>
//       </div>
//     </motion.div>
//   );
// };

// export default SplashScreen;
// import React from "react";
// import { motion } from "framer-motion";

// const SplashScreen = () => {
//   return (
//     <motion.div
//       initial={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.7 }}
//       className="fixed inset-0 z-50 bg-[#0B4D84] overflow-hidden"
//     >
//       {/* CAMERA */}
//       <motion.div
//         initial={{
//           scale: 1,
//           x: 0,
//           y: 0,
//         }}
//         animate={{
//           scale: 5.2,
//           x: 470,
//           y: 365,
//         }}
//         transition={{
//           delay: 1.5,
//           duration: 1.8,
//           ease: [0.22, 1, 0.36, 1],
//         }}
//         className="absolute inset-0 flex items-center justify-center"
//       >
//         <div className="relative w-[900px] max-w-none">
//           {/* MAP */}
//           <img
//             src="/SOR_Splash_Screen_Rajasthan_Map.png"
//             alt="Rajasthan"
//             className="w-full object-contain select-none"
//           />

//           {/* JAIPUR */}
//           <Pin top="47%" left="78%" delay={0.3} />

//           {/* JODHPUR */}
//           <Pin top="44%" left="39%" delay={0.6} />

//           {/* UDAIPUR TARGET */}
//           <Pin top="72%" left="42%" delay={0.9} active />
//         </div>
//       </motion.div>

//       {/* BRAND */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 0.2, duration: 0.6 }}
//         className="absolute top-8 left-8"
//       >
//         <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
//           <span className="text-white">Scooty</span>
//           <span style={{ color: "#7FA8D0" }}>onrent</span>
//         </h1>
//       </motion.div>
//     </motion.div>
//   );
// };

// function Pin({
//   top,
//   left,
//   delay,
//   active = false,
// }: {
//   top: string;
//   left: string;
//   delay: number;
//   active?: boolean;
// }) {
//   return (
//     <motion.div
//       className="absolute -translate-x-1/2 -translate-y-1/2"
//       style={{ top, left }}
//       initial={{ opacity: 0, scale: 0 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ delay, duration: 0.4 }}
//     >
//       <div className="relative">
//         {active && (
//           <motion.div
//             animate={{
//               scale: [1, 3],
//               opacity: [0.6, 0],
//             }}
//             transition={{
//               repeat: Infinity,
//               duration: 1.4,
//             }}
//             className="absolute inset-0 rounded-full bg-cyan-300"
//           />
//         )}

//         <motion.div
//           animate={{ y: [0, -3, 0] }}
//           transition={{
//             repeat: Infinity,
//             duration: 1.6,
//           }}
//           className="relative w-11 h-11 rounded-full bg-white shadow-2xl flex items-center justify-center"
//         >
//           <img
//             src="/scooty.svg"
//             alt="Scooty"
//             className="w-6 h-6 object-contain"
//           />
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// }

// export default SplashScreen;
import React from "react";
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
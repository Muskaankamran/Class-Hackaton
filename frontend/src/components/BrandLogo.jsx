import React from "react";

export default function BrandLogo({ size = "md", showSubtitle = true, className = "" }) {
  const isLarge = size === "lg";
  const isSmall = size === "sm";

  const boxSize = isLarge ? "w-14 h-14 rounded-2xl" : isSmall ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl";
  const iconSize = isLarge ? "w-7 h-7" : isSmall ? "w-4 h-4" : "w-5 h-5";
  const titleSize = isLarge ? "text-3xl" : isSmall ? "text-lg" : "text-xl";
  const subSize = isLarge ? "text-xs tracking-widest" : "text-[10px] tracking-wider";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon Badge */}
      <div
        className={`${boxSize} bg-gradient-to-tr from-[#F5A281] via-[#E88C6F] to-[#E07A5F] flex items-center justify-center text-white shadow-md shadow-[#F5A281]/35 flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform`}
      >
        {/* Soft Ambient Inner Glow */}
        <div className="absolute inset-0 bg-white/15 backdrop-blur-[1px]"></div>

        {/* Custom Medical Aura Cross + Pulse SVG */}
        <svg
          className={`${iconSize} relative z-10 text-white drop-shadow-xs`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Rounded Cross */}
          <path d="M11 2a1 1 0 0 1 2 0v5.5a.5.5 0 0 0 .5.5H19a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-5.5a.5.5 0 0 0-.5.5V22a1 1 0 0 1-2 0v-5.5a.5.5 0 0 0-.5-.5H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h5.5a.5.5 0 0 0 .5-.5V2z" fill="currentColor" fillOpacity="0.18" />
          {/* Gentle Vital Heartbeat Line */}
          <path d="M7 12h2.5l1.5-3 2 6 1.5-3h2.5" stroke="white" strokeWidth="2.2" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div>
        <div className="flex items-center gap-0.5 leading-none">
          <span className={`${titleSize} font-extrabold bg-gradient-to-r from-[#DE7452] to-[#E07A5F] bg-clip-text text-transparent tracking-tight`}>
            Aura
          </span>
          <span className={`${titleSize} font-light text-stone-800 tracking-tight`}>
            Med
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E07A5F] ml-0.5 mb-1.5"></span>
        </div>
        {showSubtitle && (
          <span className={`${subSize} block text-stone-400 font-bold uppercase mt-0.5 leading-none`}>
            Modern Health & Clinic
          </span>
        )}
      </div>
    </div>
  );
}

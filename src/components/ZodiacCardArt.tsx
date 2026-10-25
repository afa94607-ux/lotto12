import React from 'react';
import { ZODIAC_ITEMS } from '../data/zodiac';

// 1. Mouse Deity (ជូត - 1)
export const MouseDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Mouse Body */}
    <ellipse cx="75" cy="110" rx="42" ry="24" fill="#57534e" />
    <ellipse cx="115" cy="105" rx="18" ry="14" fill="#78716c" />
    {/* Mouse Ears & Face */}
    <circle cx="120" cy="94" r="9" fill="#78716c" />
    <circle cx="120" cy="94" r="5" fill="#fda4af" />
    <circle cx="128" cy="104" r="2.5" fill="#0f172a" />
    <ellipse cx="132" cy="107" rx="3" ry="2" fill="#f43f5e" />
    {/* Mouse Tail */}
    <path d="M35 110 C15 105 10 120 18 130 C25 138 45 130 50 122" stroke="#e7e5e4" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Mouse Legs */}
    <ellipse cx="55" cy="126" rx="8" ry="5" fill="#44403c" />
    <ellipse cx="95" cy="126" rx="8" ry="5" fill="#44403c" />
    {/* Deity Rider on Top */}
    <ellipse cx="78" cy="78" rx="16" ry="22" fill="#b91c1c" />
    <path d="M70 70 L86 70 L88 88 L68 88 Z" fill="#eab308" stroke="#854d0e" strokeWidth="1" />
    {/* Head & Khmer Mokot Crown */}
    <circle cx="78" cy="52" r="10" fill="#fed7aa" />
    <path d="M72 48 L78 28 L84 48 Z" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />
    <circle cx="78" cy="36" r="2" fill="#ef4444" />
    {/* Raised Sword / Scepter */}
    <path d="M88 64 L108 44" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
    <path d="M88 64 L93 59" stroke="#eab308" strokeWidth="5" strokeLinecap="round" />
    {/* Gold Ornaments */}
    <circle cx="78" cy="62" r="3" fill="#eab308" />
  </svg>
);

// 2. Ox Deity (ឆ្លូវ - 2)
export const OxDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* White Sacred Bull Body */}
    <ellipse cx="85" cy="108" rx="46" ry="28" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Bull Neck & Head */}
    <ellipse cx="120" cy="98" rx="20" ry="18" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Horns */}
    <path d="M124 86 C130 68 142 70 144 76" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M116 84 C118 68 126 68 130 74" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Eye & Snout */}
    <circle cx="128" cy="96" r="2.5" fill="#0f172a" />
    <ellipse cx="138" cy="104" rx="5" ry="4" fill="#fda4af" />
    {/* Legs */}
    <path d="M60 125 L58 144 M75 128 L74 144 M105 125 L106 144 M120 120 L122 144" stroke="#e2e8f0" strokeWidth="4.5" strokeLinecap="round" />
    {/* Farmer Rider in Hat and Pink Shirt */}
    {/* Straw Hat */}
    <ellipse cx="58" cy="68" rx="16" ry="5" fill="#d97706" />
    <circle cx="58" cy="74" r="8" fill="#fed7aa" />
    {/* Pink Shirt & Dark Pants */}
    <ellipse cx="68" cy="90" rx="14" ry="16" fill="#f472b6" />
    <path d="M62 98 L52 118" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
    <path d="M74 98 L85 116" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

// 3. Tiger Warrior (ខាល - 3)
export const TigerDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Tiger Body */}
    <ellipse cx="80" cy="110" rx="42" ry="24" fill="#f97316" />
    {/* Tiger Stripes */}
    <path d="M60 96 L65 115 M75 92 L78 116 M90 94 L92 114 M102 98 L104 116" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    {/* Tiger Head */}
    <ellipse cx="118" cy="102" rx="18" ry="16" fill="#f97316" />
    <circle cx="114" cy="90" r="5" fill="#f97316" stroke="#0f172a" strokeWidth="1" />
    <circle cx="124" cy="98" r="2.5" fill="#0f172a" />
    <path d="M128 106 L134 104" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    {/* Tail */}
    <path d="M40 108 C20 95 18 120 28 135" stroke="#f97316" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Feet */}
    <ellipse cx="60" cy="132" rx="7" ry="5" fill="#ea580c" />
    <ellipse cx="102" cy="132" rx="7" ry="5" fill="#ea580c" />
    {/* Warrior Rider with Club */}
    <ellipse cx="80" cy="74" rx="14" ry="18" fill="#16a34a" />
    <circle cx="82" cy="52" r="9" fill="#fed7aa" />
    <path d="M78 46 L82 30 L86 46 Z" fill="#eab308" stroke="#854d0e" strokeWidth="1.5" />
    <path d="M92 65 L118 48" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
    <ellipse cx="80" cy="74" rx="10" ry="12" fill="#dc2626" />
  </svg>
);

// 4. Rabbit Maiden (ថោះ - 4)
export const RabbitDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* White Rabbit Body */}
    <ellipse cx="76" cy="116" rx="36" ry="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    <circle cx="106" cy="106" r="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Long Ears */}
    <ellipse cx="108" cy="75" rx="5" ry="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    <ellipse cx="108" cy="75" rx="2.5" ry="12" fill="#fbcfe8" />
    <ellipse cx="118" cy="78" rx="5" ry="17" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    <ellipse cx="118" cy="78" rx="2.5" ry="11" fill="#fbcfe8" />
    <circle cx="114" cy="104" r="2.5" fill="#f43f5e" />
    <circle cx="42" cy="118" r="7" fill="#ffffff" />
    {/* Maiden Rider */}
    <ellipse cx="78" cy="80" rx="12" ry="18" fill="#facc15" />
    <ellipse cx="78" cy="94" rx="14" ry="10" fill="#16a34a" />
    <circle cx="78" cy="56" r="8" fill="#fed7aa" />
    {/* Khmer Tiara Headdress */}
    <path d="M74 50 L78 35 L82 50 Z" fill="#eab308" stroke="#854d0e" strokeWidth="1" />
  </svg>
);

// 5. Naga Dragon King (រោង - 5)
export const DragonDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Coiled Golden Green Naga Serpent */}
    <path
      d="M45 130 C30 115 50 95 80 100 C110 105 130 90 120 70 C110 50 90 60 70 65"
      stroke="#15803d"
      strokeWidth="12"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M45 130 C30 115 50 95 80 100 C110 105 130 90 120 70 C110 50 90 60 70 65"
      stroke="#facc15"
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Naga Crest / Multi-hood */}
    <path d="M120 70 Q138 55 130 45 Q120 40 115 52 Z" fill="#eab308" stroke="#854d0e" strokeWidth="1" />
    {/* Naga Eyes */}
    <circle cx="124" cy="52" r="2" fill="#dc2626" />
    {/* Deity in Gold & Blue standing/riding */}
    <ellipse cx="75" cy="78" rx="12" ry="16" fill="#3b82f6" />
    <circle cx="75" cy="56" r="8" fill="#fed7aa" />
    <path d="M71 52 L75 32 L79 52 Z" fill="#facc15" stroke="#a16207" strokeWidth="1" />
  </svg>
);

// 6. Snake Ascetic (ម្សាញ់ - 6)
export const SnakeDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Great Green Cobra Hood */}
    <path
      d="M100 135 C115 125 125 110 120 85 C115 60 90 55 85 70 C80 85 75 105 55 125"
      stroke="#16a34a"
      strokeWidth="11"
      strokeLinecap="round"
      fill="none"
    />
    {/* Flaring Cobra Hood */}
    <ellipse cx="118" cy="80" rx="16" ry="20" fill="#15803d" />
    <ellipse cx="118" cy="80" rx="9" ry="14" fill="#fef08a" />
    <circle cx="116" cy="74" r="2" fill="#0f172a" />
    {/* Seated Ascetic Deity in Red & Dark Pants */}
    <ellipse cx="68" cy="94" rx="12" ry="14" fill="#dc2626" />
    <circle cx="68" cy="74" r="8" fill="#fed7aa" />
    <ellipse cx="68" cy="68" rx="6" ry="3" fill="#ef4444" />
    {/* Cross-legged base */}
    <ellipse cx="68" cy="116" rx="18" ry="7" fill="#1e293b" />
  </svg>
);

// 7. Horse Goddess (មមី - 7)
export const HorseDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Galloping White Steed Body */}
    <ellipse cx="78" cy="112" rx="42" ry="24" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    <path d="M105 105 L124 78 L136 82 L125 110 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Horse Mane & Ears */}
    <path d="M115 75 L124 64 L126 76" stroke="#94a3b8" strokeWidth="2.5" fill="none" />
    <circle cx="128" cy="84" r="2.5" fill="#0f172a" />
    {/* Tail */}
    <path d="M38 108 C20 115 25 135 15 145" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Legs */}
    <path d="M50 128 L40 148 M68 128 L62 148 M100 125 L112 146 M115 120 L128 142" stroke="#e2e8f0" strokeWidth="3.5" strokeLinecap="round" />
    {/* Goddess Rider in Royal Garb */}
    <ellipse cx="80" cy="82" rx="12" ry="16" fill="#a855f7" />
    <ellipse cx="80" cy="96" rx="14" ry="8" fill="#dc2626" />
    <circle cx="80" cy="60" r="7.5" fill="#fed7aa" />
    <path d="M76 54 L80 38 L84 54 Z" fill="#facc15" stroke="#a16207" strokeWidth="1" />
  </svg>
);

// 8. Goat Maiden (មមែ - 8)
export const GoatDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* White Goat Body */}
    <ellipse cx="76" cy="112" rx="38" ry="22" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    <ellipse cx="108" cy="98" rx="16" ry="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Curved Horns */}
    <path d="M110 88 C116 70 128 72 126 84" stroke="#78716c" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M104 88 C108 72 118 74 116 84" stroke="#78716c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* Beard */}
    <path d="M116 110 L120 118" stroke="#cbd5e1" strokeWidth="2" />
    {/* Legs */}
    <path d="M55 126 L52 144 M70 128 L68 144 M96 126 L95 144 M110 122 L112 144" stroke="#e2e8f0" strokeWidth="3" />
    {/* Maiden in Red & Green */}
    <ellipse cx="75" cy="80" rx="11" ry="15" fill="#dc2626" />
    <circle cx="75" cy="58" r="7.5" fill="#fed7aa" />
    <path d="M71 52 L75 38 L79 52 Z" fill="#eab308" stroke="#854d0e" strokeWidth="1" />
  </svg>
);

// 9. Monkey Hanuman (វក - 9)
export const MonkeyDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* White / Gray Monkey Mount */}
    <ellipse cx="78" cy="114" rx="36" ry="22" fill="#e2e8f0" />
    <circle cx="106" cy="106" r="14" fill="#e2e8f0" />
    <circle cx="112" cy="104" r="2.5" fill="#0f172a" />
    {/* Tail curling up */}
    <path d="M44 114 C20 100 25 70 42 65" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" fill="none" />
    {/* Hanuman Warrior on top with club */}
    <ellipse cx="78" cy="74" rx="14" ry="16" fill="#15803d" />
    <circle cx="80" cy="52" r="9" fill="#fed7aa" />
    {/* Golden Khmer Crown */}
    <path d="M75 46 L80 26 L85 46 Z" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />
    <path d="M90 62 L116 42" stroke="#b45309" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// 10. Rooster Deity (រកា - 10)
export const RoosterDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Rooster Body with Colorful Feathers */}
    <ellipse cx="90" cy="115" rx="32" ry="24" fill="#0f172a" />
    {/* Tail Plumes */}
    <path d="M60 115 C30 100 35 70 50 60 C40 85 55 100 62 108" fill="#16a34a" />
    <path d="M64 112 C40 90 50 65 65 55" fill="#2563eb" />
    {/* Rooster Head & Red Comb */}
    <circle cx="116" cy="98" r="12" fill="#f97316" />
    <path d="M114 86 C116 75 126 78 124 88 C128 80 134 84 130 92" fill="#dc2626" />
    {/* Beak & Wattle */}
    <path d="M128 98 L138 102 L128 106 Z" fill="#eab308" />
    <ellipse cx="126" cy="108" rx="4" ry="6" fill="#dc2626" />
    <circle cx="122" cy="96" r="2" fill="#0f172a" />
    {/* Deity Rider */}
    <ellipse cx="86" cy="78" rx="12" ry="16" fill="#dc2626" />
    <circle cx="86" cy="56" r="7.5" fill="#fed7aa" />
    <path d="M82 50 L86 32 L90 50 Z" fill="#facc15" stroke="#a16207" strokeWidth="1" />
  </svg>
);

// 11. Dog Deity (ច - 11)
export const DogDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Golden Brown Dog Body */}
    <ellipse cx="78" cy="115" rx="38" ry="22" fill="#92400e" />
    <ellipse cx="110" cy="104" rx="16" ry="14" fill="#92400e" />
    {/* Drooping Ears */}
    <path d="M106 94 C104 104 100 112 96 110" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
    <circle cx="116" cy="100" r="2.5" fill="#0f172a" />
    <ellipse cx="122" cy="106" rx="3" ry="2" fill="#0f172a" />
    {/* Tail up */}
    <path d="M42 112 C28 95 35 85 45 90" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    {/* Warrior Rider */}
    <ellipse cx="78" cy="78" rx="12" ry="16" fill="#d97706" />
    <circle cx="78" cy="56" r="8" fill="#fed7aa" />
    <path d="M74 50 L78 30 L82 50 Z" fill="#facc15" stroke="#a16207" strokeWidth="1" />
  </svg>
);

// 12. Golden Pig Deity (កុរ - 12)
export const PigDeityArt: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 160 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Golden White Pig Body */}
    <ellipse cx="80" cy="116" rx="42" ry="26" fill="#fff1f2" stroke="#fecdd3" strokeWidth="2" />
    <ellipse cx="116" cy="108" rx="18" ry="16" fill="#fff1f2" stroke="#fecdd3" strokeWidth="1.5" />
    {/* Pig Snout with 2 nostrils */}
    <ellipse cx="130" cy="110" rx="6" ry="5" fill="#fda4af" />
    <circle cx="129" cy="110" r="1.5" fill="#e11d48" />
    <circle cx="132" cy="110" r="1.5" fill="#e11d48" />
    {/* Ears & Eyes */}
    <path d="M112 94 L120 90 L118 98 Z" fill="#fda4af" />
    <circle cx="120" cy="102" r="2.5" fill="#0f172a" />
    {/* Curly Tail */}
    <path d="M40 114 Q28 110 32 104 Q38 100 36 112" stroke="#fda4af" strokeWidth="3" fill="none" />
    {/* Maiden Rider */}
    <ellipse cx="78" cy="80" rx="12" ry="16" fill="#059669" />
    <ellipse cx="78" cy="94" rx="14" ry="8" fill="#e11d48" />
    <circle cx="78" cy="58" r="8" fill="#fed7aa" />
    <path d="M74 52 L78 35 L82 52 Z" fill="#facc15" stroke="#a16207" strokeWidth="1" />
  </svg>
);

// Helper to render deity art by number
export const FolkDeityArtByNumber: React.FC<{ num: number; className?: string }> = ({ num, className = 'w-full h-full' }) => {
  switch (num) {
    case 1:
      return <MouseDeityArt className={className} />;
    case 2:
      return <OxDeityArt className={className} />;
    case 3:
      return <TigerDeityArt className={className} />;
    case 4:
      return <RabbitDeityArt className={className} />;
    case 5:
      return <DragonDeityArt className={className} />;
    case 6:
      return <SnakeDeityArt className={className} />;
    case 7:
      return <HorseDeityArt className={className} />;
    case 8:
      return <GoatDeityArt className={className} />;
    case 9:
      return <MonkeyDeityArt className={className} />;
    case 10:
      return <RoosterDeityArt className={className} />;
    case 11:
      return <DogDeityArt className={className} />;
    case 12:
      return <PigDeityArt className={className} />;
    default:
      return <MouseDeityArt className={className} />;
  }
};

// Backward-compatible aliases
export const RatWarriorIllustration = MouseDeityArt;
export const MouseZodiacIllustration = MouseDeityArt;
export const ZodiacFolkIllustration = FolkDeityArtByNumber;

interface ZodiacCardProps {
  num: number;
  isLarge?: boolean;
  isFinalResult?: boolean;
  className?: string;
  style?: React.CSSProperties;
  numberStyle?: React.CSSProperties;
}

export const ZodiacCard: React.FC<ZodiacCardProps> = ({
  num,
  isLarge = false,
  isFinalResult = false,
  className = '',
  style,
  numberStyle,
}) => {
  const item = ZODIAC_ITEMS.find((z) => z.number === num);
  if (!item) return null;

  const colorHex = item.color === 'red' ? '#dc2626' : item.color === 'green' ? '#16a34a' : '#1e40af';

  return (
    <div
      className={`rounded-lg border-2 flex flex-col justify-between p-1.5 shadow-xs select-none transition-all duration-300 relative overflow-hidden bg-[#fef8dc] ${
        isLarge ? 'w-32 h-32 sm:w-36 sm:h-36' : 'w-14 h-14 sm:w-16 sm:h-16'
      } ${
        isFinalResult
          ? 'border-yellow-400 ring-4 ring-yellow-400/50 shadow-xl shadow-yellow-500/40 animate-pulse'
          : 'border-[#ccbe9b]'
      } ${className}`}
      style={{ backgroundColor: '#fef8dc', ...style }}
    >
      {/* Top Left: Animal Name in Khmer */}
      <div className="flex items-start justify-between w-full">
        <span
          className="font-black font-moul leading-none tracking-wide"
          style={{
            color: colorHex,
            fontSize: isLarge ? '18px' : '11px',
          }}
        >
          {item.khmerName}
        </span>
      </div>

      {/* Bottom: Number & 11 Payout in the card's authentic color */}
      <div className="flex items-end justify-between w-full mt-auto">
        <span
          className="font-black font-sans leading-none tracking-tight inline-block"
          style={{
            color: colorHex,
            fontSize: isLarge ? '60px' : '28px',
            lineHeight: isLarge ? '56px' : '28px',
            height: isLarge ? '52px' : '26px',
            ...numberStyle,
          }}
        >
          {item.number}
        </span>
        <span
          className="font-black font-sans leading-none"
          style={{
            color: colorHex,
            fontSize: isLarge ? '22px' : '13px',
          }}
        >
          11
        </span>
      </div>
    </div>
  );
};

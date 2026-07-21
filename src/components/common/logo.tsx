import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({ size = 36, className, showText = true, textClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="سپیدنو"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="sepidno-grad-admin" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(173 75% 32%)" />
            <stop offset="1" stopColor="hsl(168 65% 38%)" />
          </linearGradient>
          <linearGradient id="sepidno-drop-admin" x1="60" y1="28" x2="60" y2="92" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.6" stopColor="#F0FDFA" />
            <stop offset="1" stopColor="#CCFBF1" />
          </linearGradient>
          <linearGradient id="sepidno-leaf-admin" x1="40" y1="50" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5EEAD4" />
            <stop offset="1" stopColor="#2DD4BF" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="30" fill="url(#sepidno-grad-admin)" />
        <path
          d="M60 26 C 60 26, 36 50, 36 70 C 36 84, 47 94, 60 94 C 73 94, 84 84, 84 70 C 84 50, 60 26, 60 26 Z"
          fill="url(#sepidno-drop-admin)"
        />
        <path
          d="M50 58 C 46 62, 45 70, 48 76 C 49 78, 51 79, 53 78 C 51 73, 51 66, 54 60 C 53 59, 51 58, 50 58 Z"
          fill="#A7F3D0"
          opacity="0.6"
        />
        <path
          d="M55 50 C 58 48, 65 50, 68 55 C 65 58, 60 60, 56 58 C 54 56, 53 52, 55 50 Z"
          fill="url(#sepidno-leaf-admin)"
        />
        <circle cx="70" cy="46" r="4" fill="#5EEAD4" opacity="0.8" />
        <circle cx="74" cy="42" r="2" fill="#5EEAD4" opacity="0.5" />
      </svg>
      {showText && (
        <span className={cn("text-lg font-bold tracking-tight", textClassName)}>سپیدنو</span>
      )}
    </div>
  );
}

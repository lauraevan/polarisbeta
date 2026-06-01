// Brand-styled tile icons used on the new Home screen.
// These are simplified SVG recreations using each brand's signature
// colors and letterform — close enough to be instantly recognizable while
// staying inside fair-use for a personal/school project.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Tile({
  children,
  bg,
  size = 56,
  rounded = 14,
  ...rest
}: {
  children: React.ReactNode;
  bg: string;
  size?: number;
  rounded?: number;
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <defs>
        <linearGradient id="tileShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="64" height="64" rx={rounded} fill={bg} />
      {children}
      <rect x="0" y="0" width="64" height="64" rx={rounded} fill="url(#tileShine)" />
    </svg>
  );
}

/* Polaris Flix → Netflix-styled red tile with the iconic "N" silhouette */
export function FlixLogo(props: IconProps) {
  return (
    <Tile bg="#000" {...props}>
      <g transform="translate(20 12)">
        <rect x="0" y="0" width="5" height="40" fill="#E50914" />
        <rect x="19" y="0" width="5" height="40" fill="#E50914" />
        <polygon points="0,0 5,0 24,40 19,40" fill="#B0060F" />
      </g>
    </Tile>
  );
}

/* Polaris Anime → Crunchyroll-styled orange tile with the C mark */
export function AnimeLogo(props: IconProps) {
  return (
    <Tile bg="#F47521" {...props}>
      <g transform="translate(32 32)">
        <circle r="18" fill="none" stroke="#fff" strokeWidth="6" />
        <circle cx="10" cy="-10" r="5" fill="#F47521" />
      </g>
    </Tile>
  );
}

/* Polaris Games → Steam-styled deep navy with white gear ring */
export function GamesLogo(props: IconProps) {
  return (
    <Tile bg="#1B2838" {...props}>
      <g transform="translate(32 32)">
        <circle r="20" fill="none" stroke="#66C0F4" strokeWidth="2.5" />
        <circle r="8" fill="none" stroke="#fff" strokeWidth="3" />
        <circle cx="12" cy="-8" r="6" fill="none" stroke="#fff" strokeWidth="3" />
        <line x1="0" y1="0" x2="-14" y2="10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </g>
    </Tile>
  );
}

/* Spotify-styled green tile with sound waves */
export function MusicLogo(props: IconProps) {
  return (
    <Tile bg="#1DB954" {...props}>
      <g transform="translate(32 32)" stroke="#000" strokeLinecap="round" fill="none">
        <path d="M-14 -6 Q0 -14 14 -6" strokeWidth="4" />
        <path d="M-11 1 Q0 -6 11 1" strokeWidth="3.5" />
        <path d="M-8 8 Q0 3 8 8" strokeWidth="3" />
      </g>
    </Tile>
  );
}

/* App Store-styled blue gradient tile with an A */
export function AppsLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={props.size ?? 56} height={props.size ?? 56} xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="appsBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22C3FF" />
          <stop offset="1" stopColor="#0A65FF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#appsBg)" />
      <g transform="translate(32 36)" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M-10 8 L0 -12 L10 8" />
        <line x1="-6" y1="2" x2="6" y2="2" />
      </g>
    </svg>
  );
}

/* Safari-styled compass tile for the Browser app */
export function BrowserLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={props.size ?? 56} height={props.size ?? 56} xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <radialGradient id="brBg" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#7CD7FF" />
          <stop offset="1" stopColor="#1873E8" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#brBg)" />
      <circle cx="32" cy="32" r="18" fill="#fff" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#0A4B9C" strokeWidth="1.5" />
      <polygon points="32,18 35,32 32,46 29,32" fill="#E53935" />
      <polygon points="32,18 32,32 29,32" fill="#B71C1C" />
      <polygon points="32,46 32,32 35,32" fill="#fff" />
      <circle cx="32" cy="32" r="2" fill="#0A4B9C" />
    </svg>
  );
}

/* Live TV-styled red broadcast tile */
export function LiveLogo(props: IconProps) {
  return (
    <Tile bg="#0E0E10" {...props}>
      <g transform="translate(32 32)" fill="none" stroke="#FF3D3D" strokeLinecap="round">
        <path d="M-18 -8 Q-12 0 -18 8" strokeWidth="3.5" />
        <path d="M-12 -4 Q-8 0 -12 4" strokeWidth="3" />
        <path d="M18 -8 Q12 0 18 8" strokeWidth="3.5" />
        <path d="M12 -4 Q8 0 12 4" strokeWidth="3" />
        <circle r="4.5" fill="#FF3D3D" stroke="none" />
      </g>
    </Tile>
  );
}

/* iOS-style settings gear tile */
export function SettingsLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={props.size ?? 56} height={props.size ?? 56} xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="setBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9AA0A6" />
          <stop offset="1" stopColor="#3C4043" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#setBg)" />
      <g transform="translate(32 32)" fill="#E8EAED">
        <circle r="8" fill="none" stroke="#E8EAED" strokeWidth="3" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="-2" y="-18" width="4" height="6" transform={`rotate(${i * 45})`} />
        ))}
      </g>
    </svg>
  );
}

/* Chat / messages tile */
export function ChatLogo(props: IconProps) {
  return (
    <Tile bg="#34C759" {...props}>
      <g transform="translate(32 30)" fill="#fff">
        <path d="M-18 -10 Q-18 -18 -10 -18 L10 -18 Q18 -18 18 -10 L18 2 Q18 10 10 10 L-4 10 L-12 16 L-12 10 Q-18 8 -18 2 Z" />
      </g>
    </Tile>
  );
}

/* AI sparkles tile */
export function AiLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" width={props.size ?? 56} height={props.size ?? 56} xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="aiBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#aiBg)" />
      <g transform="translate(32 32)" fill="#fff">
        <polygon points="0,-16 4,-4 16,0 4,4 0,16 -4,4 -16,0 -4,-4" />
      </g>
    </svg>
  );
}
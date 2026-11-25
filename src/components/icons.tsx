import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", "aria-hidden": true } as const;

export const IconCube = (p: P) => (
  <svg {...base} {...p}><path d="M12 2.8 20 7.3v9.4L12 21.2 4 16.7V7.3Z" /><path d="M4 7.3 12 12l8-4.7M12 12v9.2" /></svg>
);
export const IconAR = (p: P) => (
  <svg {...base} {...p}><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M12 7.5 16 9.8v4.4l-4 2.3-4-2.3V9.8Z" /><path d="M8 9.8 12 12l4-2.2M12 12v4.5" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const IconArrowLeft = (p: P) => (
  <svg {...base} {...p}><path d="M15 5 8 12l7 7" /></svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base} {...p}><path d="m9 5 7 7-7 7" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconInfo = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const IconPhoto = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-8 8" /></svg>
);
export const IconRotate = (p: P) => (
  <svg {...base} {...p}><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" /></svg>
);
export const IconPlate = (p: P) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden {...p}>
    <ellipse cx="32" cy="38" rx="27" ry="9" />
    <ellipse cx="32" cy="36.5" rx="17" ry="5.2" />
    <path d="M24 30c0-6 3.6-10 8-10s8 4 8 10" />
    <path d="M28 18.5c-1-1.6.6-3 0-4.6M32 17c-1-1.6.6-3 0-4.6M36 18.5c-1-1.6.6-3 0-4.6" opacity=".6" />
  </svg>
);

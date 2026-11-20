"use client";

import { useId } from "react";
import type { Cut } from "@/lib/products";

/**
 * Stylised abaya illustration, tinted with the selected colour.
 * Used as an elegant placeholder until real product photos are added
 * (set `images` on a product colour to use photos instead).
 */

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function isLightColor(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

function shade(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

const BODY = "M170 100 Q200 113 230 100 L270 120 L268 226 L298 498 Q200 514 102 498 L132 226 L130 120 Z";

const SLEEVE: Record<Cut, string> = {
  classique: "M130 120 C112 128 104 148 101 172 L82 332 Q96 341 113 337 L131 228 Z",
  brodee: "M130 120 C112 128 104 148 101 172 L78 336 Q96 346 116 341 L131 228 Z",
  papillon: "M131 120 C104 132 66 196 38 292 Q34 312 56 316 L135 300 Z",
  kimono: "M130 120 L76 158 L60 300 Q78 310 100 305 L110 205 L132 228 Z",
};

interface Props {
  color: string;
  cut: Cut;
  view?: "front" | "detail";
  className?: string;
}

export default function AbayaArt({ color, cut, view = "front", className }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const light = isLightColor(color);
  const bg = light ? "#E4DACC" : "#EEE7DD";
  const bg2 = light ? "#D8CCBB" : "#E3D9CC";
  const gold = "#C9A66B";
  const sleeve = SLEEVE[cut];
  const shadeId = `s${uid}`;
  const bgId = `b${uid}`;

  const zoom = view === "detail" ? "translate(200 170) scale(2.3) translate(-200 -170)" : undefined;

  return (
    <svg
      viewBox="0 0 400 533"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={shadeId} x1="40" x2="360" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0.38" />
          <stop offset="0.32" stopColor="#000" stopOpacity="0.02" />
          <stop offset="0.52" stopColor="#fff" stopOpacity="0.09" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.42" />
        </linearGradient>
        <radialGradient id={bgId} cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bg2} />
        </radialGradient>
      </defs>

      <rect width="400" height="533" fill={`url(#${bgId})`} />

      <g transform={zoom}>
        {/* shadow */}
        <ellipse cx="200" cy="512" rx="120" ry="7" fill="#000" opacity="0.1" />

        {/* hanger */}
        <path d="M200 66 C200 56 211 54 211 46 C211 37 196 35 193 43" fill="none" stroke="#8C6D3F" strokeWidth="2" strokeLinecap="round" />
        <path d="M200 66 L138 110 M200 66 L262 110" stroke="#8C6D3F" strokeWidth="2" strokeLinecap="round" />

        {/* sleeves (left + mirrored right) */}
        {[undefined, "translate(400 0) scale(-1 1)"].map((t, i) => (
          <g key={i} transform={t}>
            <path d={sleeve} fill={shade(color, -0.06)} />
            <path d={sleeve} fill={`url(#${shadeId})`} />
            {cut === "brodee" && (
              <path d="M79 337 Q96 347 116 342" fill="none" stroke={gold} strokeWidth="3" strokeDasharray="1 4" strokeLinecap="round" />
            )}
          </g>
        ))}

        {/* body */}
        <path d={BODY} fill={color} />
        <path d={BODY} fill={`url(#${shadeId})`} />

        {/* folds */}
        <g fill="none" strokeLinecap="round">
          <path d="M168 240 Q160 380 146 500" stroke="#000" strokeOpacity="0.14" strokeWidth="2.2" />
          <path d="M232 240 Q240 380 254 500" stroke="#000" strokeOpacity="0.14" strokeWidth="2.2" />
          <path d="M184 250 Q182 380 178 505" stroke="#fff" strokeOpacity="0.07" strokeWidth="3" />
          <path d="M218 250 Q221 380 226 505" stroke="#fff" strokeOpacity="0.06" strokeWidth="3" />
        </g>

        {/* neckline */}
        <path d="M170 100 Q200 113 230 100" fill="none" stroke={shade(color, -0.35)} strokeWidth="3" />

        {cut === "kimono" && (
          <>
            <path d="M193 108 L207 108 L214 507 L186 507 Z" fill={shade(color, light ? -0.18 : 0.12)} />
            <path d="M193 108 L186 507 M207 108 L214 507" stroke={shade(color, -0.4)} strokeOpacity="0.6" strokeWidth="1.2" />
            <path d="M134 262 L266 262" stroke={shade(color, -0.25)} strokeWidth="5" />
            <path d="M190 262 L178 330 M210 262 L224 326" stroke={shade(color, -0.25)} strokeWidth="4" strokeLinecap="round" />
          </>
        )}

        {cut === "classique" && (
          <g fill={shade(color, -0.45)}>
            {[130, 150, 170].map((y) => (
              <circle key={y} cx="200" cy={y} r="2.2" />
            ))}
          </g>
        )}

        {cut === "brodee" && (
          <g fill="none" stroke={gold} strokeLinecap="round">
            <path d="M170 100 Q200 113 230 100" strokeWidth="2.4" />
            <path d="M200 112 L200 300" strokeWidth="1.6" strokeDasharray="2 5" />
            {[140, 180, 220, 260].map((y) => (
              <path key={y} d={`M200 ${y - 8} L207 ${y} L200 ${y + 8} L193 ${y} Z`} strokeWidth="1.4" />
            ))}
            <path d="M104 488 Q200 503 296 488" strokeWidth="2.4" strokeDasharray="1 5" />
            <path d="M103 494 Q200 509 297 494" strokeWidth="1.2" />
          </g>
        )}

        {cut === "papillon" && (
          <path d="M136 300 Q200 314 264 300" fill="none" stroke={shade(color, -0.3)} strokeOpacity="0.7" strokeWidth="1.5" />
        )}
      </g>
    </svg>
  );
}

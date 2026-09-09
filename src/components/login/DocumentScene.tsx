"use client";

import React from "react";

interface DocumentSceneProps {
  phase: "idle" | "in" | "work";
}

export default function DocumentScene({ phase }: DocumentSceneProps) {
  const state = phase === "idle" ? "" : phase === "in" ? "is-in" : "is-in is-work";

  return (
    <div className={`login-scene ${state}`} aria-hidden="true">
      <svg viewBox="30 50 420 280" className="w-full h-auto" fill="none">
        <defs>
          <linearGradient id="deskWood" x1="0" y1="248" x2="0" y2="268" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--login-desk)" />
            <stop offset="1" stopColor="var(--login-desk)" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="shirtShade" x1="140" y1="170" x2="200" y2="250" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--login-shirt)" />
            <stop offset="1" stopColor="var(--login-accent)" stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="lidShade" x1="232" y1="92" x2="400" y2="210" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--login-ink)" stopOpacity="0.92" />
            <stop offset="1" stopColor="var(--login-ink)" stopOpacity="0.72" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="var(--login-ink)" floodOpacity="0.14" />
          </filter>
        </defs>

        <ellipse cx="240" cy="312" rx="170" ry="16" fill="var(--login-line)" opacity="0.4" />

        <g className="scene-glow">
          <ellipse cx="300" cy="150" rx="88" ry="48" fill="var(--login-accent)" opacity="0.2" />
        </g>

        <path d="M58 210c10-26 26-38 42-32 8 4 12 16 8 26l-10 10c-12 0-28 0-40-4z" fill="var(--login-accent)" />
        <rect x="64" y="236" width="16" height="18" rx="2" fill="var(--login-desk)" />

        <path d="M108 250c2-22 12-40 30-48 8-2 12 6 12 12v44H108z" fill="var(--login-ink)" opacity="0.2" />
        <rect x="104" y="248" width="50" height="9" rx="4" fill="var(--login-ink)" opacity="0.25" />

        <g filter="url(#softShadow)">
          <path d="M78 246h324c6 0 10 3 10 8v7H70v-7c0-5 3-8 8-8z" fill="url(#deskWood)" />
        </g>
        <rect x="116" y="261" width="13" height="38" rx="2" fill="var(--login-desk)" opacity="0.78" />
        <rect x="348" y="261" width="13" height="38" rx="2" fill="var(--login-desk)" opacity="0.78" />

        <g className="scene-laptop">
          <path d="M228 108l168 18-18 98-168-20z" fill="url(#lidShade)" />
          <path d="M236 118l148 16-14 80-148-18z" fill="var(--login-screen)" />
          <rect x="248" y="128" width="52" height="5" rx="1" fill="var(--login-accent)" />
          <rect className="scene-line scene-line-1" x="248" y="142" width="108" height="4" rx="1" fill="var(--login-muted)" />
          <rect className="scene-line scene-line-2" x="248" y="152" width="92" height="4" rx="1" fill="var(--login-muted)" />
          <rect className="scene-line scene-line-3" x="248" y="162" width="102" height="4" rx="1" fill="var(--login-muted)" />
          <rect className="scene-line scene-line-4" x="248" y="172" width="70" height="4" rx="1" fill="var(--login-muted)" />
          <rect className="scene-caret" x="322" y="170" width="2" height="8" fill="var(--login-accent)" />

          <path d="M214 214l196 8-8 28-204-6z" fill="var(--login-ink)" opacity="0.88" />
          <path d="M226 220l172 6-5 16-176-5z" fill="var(--login-ink)" opacity="0.35" />
          <g fill="var(--login-card)" opacity="0.28">
            <rect x="236" y="223" width="14" height="5" rx="1" />
            <rect x="254" y="223" width="14" height="5" rx="1" />
            <rect x="272" y="224" width="14" height="5" rx="1" />
            <rect x="290" y="224" width="14" height="5" rx="1" />
            <rect x="308" y="225" width="14" height="5" rx="1" />
            <rect x="326" y="225" width="14" height="5" rx="1" />
            <rect x="344" y="226" width="14" height="5" rx="1" />
            <rect x="244" y="231" width="148" height="5" rx="1" />
          </g>
        </g>

        <g className="scene-page">
          <path d="M176 168l52-8 8 62-52 8z" fill="var(--login-card)" stroke="var(--login-line)" />
          <path d="M188 176l30-5" stroke="var(--login-accent)" strokeWidth="3" strokeLinecap="round" />
          <path d="M186 188l38-6M185 196l34-5M184 204l36-6" stroke="var(--login-muted)" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g className="scene-person">
          <path d="M132 242c4-32 20-54 44-58 22 10 34 34 36 58v8H132z" fill="url(#shirtShade)" />
          <path d="M158 188c12-5 28-4 38 4" stroke="var(--login-card)" strokeOpacity="0.22" strokeWidth="4" />
          <path d="M168 150c-1 8 3 16 12 19 8 2 16-3 19-11 2-8-3-17-12-20-10-2-19 4-19 12z" fill="var(--login-skin)" />
          <path d="M166 146c6-15 32-16 40 0 2 6-2 11-10 12h-20c-8 0-12-4-10-12z" fill="var(--login-hair)" />
          <path d="M170 158c4 9 12 13 18 13 7 0 13-4 15-11" stroke="var(--login-hair)" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="198" cy="160" rx="3" ry="3.6" fill="var(--login-skin)" />

          <path d="M198 198c14 10 34 16 58 14" stroke="url(#shirtShade)" strokeWidth="11" strokeLinecap="round" />
          <path d="M148 200c10 16 32 26 58 24" stroke="url(#shirtShade)" strokeWidth="12" strokeLinecap="round" />
        </g>

        <g className="scene-hand-left">
          <ellipse cx="248" cy="226" rx="13" ry="8" fill="var(--login-skin)" />
          <g className="scene-finger-a">
            <rect x="238" y="216" width="3.4" height="11" rx="1.7" fill="var(--login-skin)" />
          </g>
          <g className="scene-finger-b">
            <rect x="244" y="214" width="3.4" height="12" rx="1.7" fill="var(--login-skin)" />
          </g>
          <g className="scene-finger-c">
            <rect x="250" y="215" width="3.4" height="11" rx="1.7" fill="var(--login-skin)" />
          </g>
          <rect x="256" y="218" width="3.2" height="9" rx="1.6" fill="var(--login-skin)" />
        </g>

        <g className="scene-hand-right">
          <ellipse cx="318" cy="228" rx="13" ry="8" fill="var(--login-skin)" />
          <g className="scene-finger-b">
            <rect x="308" y="217" width="3.4" height="12" rx="1.7" fill="var(--login-skin)" />
          </g>
          <g className="scene-finger-a">
            <rect x="314" y="215" width="3.4" height="13" rx="1.7" fill="var(--login-skin)" />
          </g>
          <g className="scene-finger-c">
            <rect x="320" y="216" width="3.4" height="12" rx="1.7" fill="var(--login-skin)" />
          </g>
          <rect x="326" y="219" width="3.2" height="9" rx="1.6" fill="var(--login-skin)" />
        </g>

        <rect x="392" y="214" width="14" height="20" rx="6" fill="var(--login-accent)" opacity="0.55" />
        <ellipse cx="399" cy="236" rx="10" ry="6" fill="var(--login-card)" />
      </svg>
    </div>
  );
}

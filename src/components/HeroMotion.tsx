"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

type HeroMotionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Entrance timeline for the hero and a slow scroll parallax on its picture.
 */
export function HeroMotion({ children, className }: HeroMotionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline
        .from("[data-hero-title]", { y: 38, autoAlpha: 0, duration: 1 })
        .from("[data-hero-copy]", { y: 18, autoAlpha: 0, duration: 0.7 }, "-=0.65")
        .from("[data-hero-actions]", { y: 14, autoAlpha: 0, duration: 0.6 }, "-=0.5")
        .from("[data-hero-note]", { y: 10, autoAlpha: 0, duration: 0.5 }, "-=0.4")
        .from("[data-hero-media]", { autoAlpha: 0, duration: 0.9 }, "-=0.85")
        .from("[data-hero-caption]", { y: 14, autoAlpha: 0, duration: 0.5 }, "-=0.45");

      const picture = ref.current.querySelector<HTMLElement>("[data-hero-image]");
      if (picture) {
        gsap.fromTo(
          picture,
          { yPercent: 0, scale: 1.06 },
          {
            yPercent: 6,
            scale: 1.06,
            ease: "none",
            scrollTrigger: {
              trigger: "[data-hero-media]",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

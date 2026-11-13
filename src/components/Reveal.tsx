"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "figure";
};

/**
 * Reveals content when it enters the viewport. Content stays visible when
 * JavaScript is unavailable: the hiding rule only applies once JS marks the
 * document with `reveal-ready`.
 */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // The rendered element is one of the tag names above; the cast keeps the ref
  // type simple without giving up the semantic wrapper.
  const Tag = as as "div";

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const root = document.documentElement;
    root.classList.add("reveal-ready");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.dataset.reveal = "shown";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.dataset.reveal = "shown";
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement>}
      className={className}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      data-reveal=""
    >
      {children}
    </Tag>
  );
}

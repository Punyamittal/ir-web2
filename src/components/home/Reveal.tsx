"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  stagger = false,
}: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  if (stagger) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1, delayChildren: delay } },
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, rotate: -1.5 },
        show: {
          opacity: 1,
          rotate: 0,
          transition: { type: "spring", stiffness: 120, damping: 16 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Stamp thunk: scale 1.2 → 1 with slight rotation */
export function StampIn({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 1.25, rotate: -8 }}
      whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}

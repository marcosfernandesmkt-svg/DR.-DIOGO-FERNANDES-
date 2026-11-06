"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
ScrollTrigger.config({ ignoreMobileResize: true });

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const EASE = [0.16, 1, 0.3, 1] as const;
export { gsap, ScrollTrigger, useGSAP };

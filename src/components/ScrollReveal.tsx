import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'auto';
  index?: number;
  className?: string;
  distance?: number; // Distance in px (default: 60)
  duration?: number; // Duration in ms (default: 700)
  delay?: number; // Optional delay in ms (default: 0)
  threshold?: number; // Intersection threshold (default: 0.12)
  rootMargin?: string; // Intersection root margin (default: '0px 0px -40px 0px')
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'auto',
  index = 0,
  className = '',
  distance = 60,
  duration = 700,
  delay = 0,
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  style,
  ...rest
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  // Determine actual direction: even indices slide from left (-60px), odd indices from right (+60px)
  const effectiveDirection: 'left' | 'right' =
    direction === 'left' || direction === 'right'
      ? direction
      : index % 2 === 0
      ? 'left'
      : 'right';

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      setIsSettled(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    // Fallback if IntersectionObserver is not available in environment
    if (typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      setIsSettled(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer.unobserve(entry.target);

            // Once animation completes, clean up transform to allow standard hover & layout behavior
            const timer = setTimeout(() => {
              setIsSettled(true);
            }, duration + delay + 50);

            return () => clearTimeout(timer);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, duration, delay]);

  // Initial translation value based on direction
  const initialTranslateX = effectiveDirection === 'left' ? -distance : distance;

  // Compute active transition style
  const getAnimationStyles = (): React.CSSProperties => {
    if (isSettled) {
      return { ...style };
    }

    const baseTransition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

    if (!isRevealed) {
      return {
        ...style,
        opacity: 0,
        transform: `translate3d(${initialTranslateX}px, 0, 0)`,
        willChange: 'transform, opacity',
        transition: baseTransition,
      };
    }

    // Currently animating to natural position
    return {
      ...style,
      opacity: 1,
      transform: 'translate3d(0, 0, 0)',
      willChange: 'transform, opacity',
      transition: baseTransition,
    };
  };

  return (
    <div
      ref={elementRef}
      className={`scroll-reveal-container ${isRevealed ? 'is-revealed' : 'is-hidden'} ${isSettled ? 'is-settled' : ''} ${className}`}
      style={getAnimationStyles()}
      {...rest}
    >
      {children}
    </div>
  );
};

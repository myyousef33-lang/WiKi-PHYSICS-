import React, { useMemo } from 'react';
import { motion, type Variants, type HTMLMotionProps } from 'motion/react';

export interface AnimatedListItemProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  index?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function AnimatedListItem({
  children,
  className = '',
  index = 0,
  delay = 100,
  direction = 'up',
  ...props
}: AnimatedListItemProps) {
  const normalizedDelay = delay > 10 ? delay / 1000 : delay;

  const getInitialOffset = () => {
    switch (direction) {
      case 'up':
        return { y: 18, x: 0 };
      case 'down':
        return { y: -18, x: 0 };
      case 'left':
        return { x: 18, y: 0 };
      case 'right':
        return { x: -18, y: 0 };
      case 'none':
        return { x: 0, y: 0 };
      default:
        return { y: 18, x: 0 };
    }
  };

  const offset = getInitialOffset();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, ...offset }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, ...offset }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 26,
        mass: 0.8,
        delay: index * normalizedDelay,
      }}
      className={`w-full h-full ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface AnimatedListProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  className?: string;
  delay?: number; // Delay between consecutive items in ms (e.g. 100, 150)
  initialDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  viewportOnce?: boolean;
  immediate?: boolean; // If true, animates immediately on mount (ideal for modals/dialogs)
}

export const AnimatedList = React.memo(function AnimatedList({
  children,
  className = '',
  delay = 100,
  initialDelay = 0,
  direction = 'up',
  viewportOnce = true,
  immediate = false,
  ...props
}: AnimatedListProps) {
  const childrenArray = useMemo(
    () => React.Children.toArray(children).filter(Boolean),
    [children]
  );

  const staggerSeconds = delay > 10 ? delay / 1000 : delay;
  const initialDelaySeconds = initialDelay > 10 ? initialDelay / 1000 : initialDelay;

  const getInitialOffset = () => {
    switch (direction) {
      case 'up':
        return { y: 20, x: 0 };
      case 'down':
        return { y: -20, x: 0 };
      case 'left':
        return { x: 20, y: 0 };
      case 'right':
        return { x: -20, y: 0 };
      case 'none':
        return { x: 0, y: 0 };
      default:
        return { y: 20, x: 0 };
    }
  };

  const offset = getInitialOffset();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerSeconds,
        delayChildren: initialDelaySeconds,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.97,
      ...offset,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 290,
        damping: 25,
        mass: 0.75,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      {...(immediate
        ? { animate: 'visible' }
        : {
            whileInView: 'visible',
            viewport: { once: viewportOnce, margin: '-20px' },
          })}
      variants={containerVariants}
      className={className}
      {...props}
    >
      {childrenArray.map((child, index) => {
        const key =
          React.isValidElement(child) && child.key != null
            ? child.key
            : `animated-list-item-${index}`;

        return (
          <motion.div
            key={key}
            variants={itemVariants}
            className="w-full h-full"
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
});

AnimatedList.displayName = 'AnimatedList';

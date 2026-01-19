'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export default function MainContent({ children }: MainContentProps) {
  const pathname = usePathname();

  return (
    <motion.main
      key={pathname}
      className="flex-1"
      initial="initial"
      animate="enter"
      variants={pageVariants}
    >
      {children}
    </motion.main>
  );
}

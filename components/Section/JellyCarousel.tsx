
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useId, useState, useEffect } from 'react';
import { motion, useMotionValue, useVelocity, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '../../Theme.tsx';
import JellyItem from '../Core/JellyItem.tsx';

const JellyCarousel = () => {
  const { theme } = useTheme();
  const uniqueId = useId();

  // --- Dimensions Configuration ---
  const ITEM_HEIGHT = 400;
  // Container height is now fitted to the item height, with no extra padding.
  const CONTAINER_HEIGHT = ITEM_HEIGHT; 
  // A fixed bend amount is used since padding has been removed.
  const MAX_CONTAINER_BEND = 80; 

  // 1. Motion Logic
  const x = useMotionValue(0);
  const rawVelocity = useVelocity(x);
  
  // 2. The "Master Spring"
  const skewVelocity = useSpring(rawVelocity, {
    stiffness: 400,
    damping: 40,
    mass: 1
  });
  
  // 3. Container Bending Logic
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clipPathD = useTransform(skewVelocity, (latestVelocity) => {
    const w = windowWidth;
    const h = CONTAINER_HEIGHT;
    
    const maxAbsVelocity = 3000;
    const intensity = Math.min(1, Math.abs(latestVelocity) / maxAbsVelocity);
    
    const bendAmount = intensity * MAX_CONTAINER_BEND;

    // Hourglass shape calculation based on container dimensions
    return `
      M 0 0
      Q ${w / 2} ${bendAmount}, ${w} 0
      L ${w} ${h}
      Q ${w / 2} ${h - bendAmount}, 0 ${h}
      Z
    `;
  });

  // 4. Track Skew Logic
  const trackSkewX = useTransform(skewVelocity, [-3000, 3000], [10, -10]);

  // 9 Items as per spec
  const items = Array.from({ length: 9 });

  return (
    <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent', // Let the body background show through
        overflow: 'hidden'
    }}>
      {/* The Carousel Strip Wrapper */}
      <div style={{
          position: 'relative',
          width: '100%',
          height: CONTAINER_HEIGHT,
      }}>

        {/* The "void" background layer has been removed. */}

        {/* SVG Definition for Clip Path */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <clipPath id={`clip-${uniqueId}`}>
              {/* Fix: Corrected variable name from `pathD` to `clipPathD` to resolve reference error. */}
              <motion.path d={clipPathD} />
            </clipPath>
          </defs>
        </svg>

        {/* 
           The Clipped Carousel Container 
           This is the actual "strip" that holds content.
           When clipped, it reveals the page background set in index.tsx.
        */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center', // Vertically center the items within the strip
          justifyContent: 'flex-start',
          backgroundColor: 'transparent',
          zIndex: 1,
          // Apply the dynamic clip path
          clipPath: `url(#clip-${uniqueId})`,
          willChange: 'clip-path', 
        }}>
            <motion.div
                style={{
                    display: 'flex',
                    gap: '24px',
                    padding: '0 10vw',
                    x,
                    skewX: trackSkewX, 
                    cursor: 'grab',
                    height: '100%',
                    alignItems: 'center', // Ensure items stay centered vertically
                }}
                whileTap={{ cursor: 'grabbing' }}
                drag="x"
                dragConstraints={{ 
                    left: -((400 + 24) * 9) + windowWidth, 
                    right: 0 
                }}
                dragElastic={0.2}
                dragTransition={{ power: 0.3, timeConstant: 300 }}
            >
                {items.map((_, i) => (
                    <JellyItem 
                        key={i} 
                        index={i} 
                        velocity={skewVelocity} 
                    />
                ))}
            </motion.div>
        </div>
        
      </div>
    </div>
  );
};

export default JellyCarousel;

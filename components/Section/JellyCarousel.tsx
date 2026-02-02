
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useId } from 'react';
import { motion, useMotionValue, useVelocity, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '../../Theme.tsx';
import JellyItem from '../Core/JellyItem.tsx';

const JellyCarousel = () => {
  const { theme } = useTheme();
  const uniqueId = useId();

  // 1. Motion Logic
  const x = useMotionValue(0);
  const rawVelocity = useVelocity(x);
  
  // 2. The "Master Spring"
  // This drives the entire simulation.
  const skewVelocity = useSpring(rawVelocity, {
    stiffness: 400,
    damping: 40,
    mass: 1
  });
  
  // 3. Container Bending Logic (The "Squeeze")
  // We use useTransform to create a reactive path string. 
  // This ensures Framer updates the DOM attribute in a way that triggers repaints.
  const clipPathD = useTransform(skewVelocity, (latestVelocity) => {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // Increased sensitivity: Max effect reached at 3000px/s instead of 4000
    const maxAbsVelocity = 3000;
    const intensity = Math.min(1, Math.abs(latestVelocity) / maxAbsVelocity);
    
    // Increased Max Bend for visibility
    const MAX_CONTAINER_BEND = 80; 
    const bendAmount = intensity * MAX_CONTAINER_BEND;

    // Create an hourglass shape (squeezes top and bottom inwards)
    return `
      M 0 0
      Q ${containerWidth / 2} ${bendAmount}, ${containerWidth} 0
      L ${containerWidth} ${containerHeight}
      Q ${containerWidth / 2} ${containerHeight - bendAmount}, 0 ${containerHeight}
      Z
    `;
  });

  // 9 Items as per spec
  const items = Array.from({ length: 9 });

  return (
    <>
      {/* SVG for clipping the container */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id={`clip-${uniqueId}`}>
            <motion.path d={clipPathD} />
          </clipPath>
        </defs>
      </svg>

      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        backgroundColor: theme.Color.Base.Surface[1],
        position: 'relative',
        // Apply the dynamic clip path
        clipPath: `url(#clip-${uniqueId})`,
        // Force hardware acceleration to help with repaint
        willChange: 'clip-path', 
      }}>
          {/* Instruction Label */}
          <div style={{
              position: 'absolute',
              top: theme.spacing['Space.L'],
              left: '50%',
              transform: 'translateX(-50%)',
              ...theme.Type.Readable.Label.M,
              color: theme.Color.Base.Content[2],
              zIndex: 10,
              pointerEvents: 'none',
              opacity: 0.7,
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
          }}>
              Drag to Interact
          </div>

          <motion.div
              style={{
                  display: 'flex',
                  gap: '24px',
                  padding: '0 10vw',
                  x,
                  cursor: 'grab',
              }}
              whileTap={{ cursor: 'grabbing' }}
              drag="x"
              dragConstraints={{ 
                  left: -((400 + 24) * 9) + window.innerWidth, 
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
    </>
  );
};

export default JellyCarousel;

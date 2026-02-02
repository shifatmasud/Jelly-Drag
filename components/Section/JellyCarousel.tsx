
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef } from 'react';
import { motion, useMotionValue, useVelocity, useSpring } from 'framer-motion';
import { useTheme } from '../../Theme.tsx';
import JellyItem from '../Core/JellyItem.tsx';

const JellyCarousel = () => {
  const { theme } = useTheme();
  const carouselRef = useRef<HTMLDivElement>(null);

  // 1. Motion Logic
  const x = useMotionValue(0);
  const velocity = useVelocity(x);
  
  // Smooth the velocity to create a more organic, viscous liquid feel
  // Damping: Higher = less oscillation. Stiffness: Higher = faster return.
  const smoothVelocity = useSpring(velocity, { 
    damping: 50, 
    stiffness: 300, 
    mass: 1 
  });

  // 9 Items as per spec
  const items = Array.from({ length: 9 });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start', // Align start to allow initial drag from left
      overflow: 'hidden',
      backgroundColor: theme.Color.Base.Surface[1],
      position: 'relative',
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
            ref={carouselRef}
            style={{
                display: 'flex',
                gap: '24px', // 16-24px gap
                padding: '0 10vw', // Horizontal padding for better initial placement
                x,
                cursor: 'grab',
            }}
            whileTap={{ cursor: 'grabbing' }}
            drag="x"
            // dragConstraints needs a ref to a container usually, 
            // but for infinite-feeling or long lists, we can just let it slide.
            // Let's add approximate constraints so we don't lose the items.
            dragConstraints={{ 
                left: -((400 + 24) * 9) + window.innerWidth, 
                right: 0 
            }}
            dragElastic={0.2} // Elastic edges
            dragTransition={{ power: 0.3, timeConstant: 300 }} // Physics feel
        >
            {items.map((_, i) => (
                <JellyItem 
                    key={i} 
                    index={i} 
                    velocity={smoothVelocity} 
                />
            ))}
        </motion.div>
    </div>
  );
};

export default JellyCarousel;

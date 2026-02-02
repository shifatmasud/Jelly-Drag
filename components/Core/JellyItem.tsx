
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useId } from 'react';
import { useTransform, MotionValue, motion } from 'framer-motion';
import { useTheme } from '../../Theme.tsx';

interface JellyItemProps {
  velocity: MotionValue<number>;
  index: number;
}

const JellyItem: React.FC<JellyItemProps> = ({ velocity, index }) => {
  const { theme } = useTheme();
  const uniqueId = useId();
  
  // Dimensions
  const WIDTH = 400;
  const HEIGHT = 400;
  // Increase bend max for visibility
  const MAX_BEND = 120;
  // Overscan allows the image to "bulge out" without revealing empty space
  const OVERSCAN = 100; 

  // Images from Picsum
  const imageUrl = `https://picsum.photos/seed/${index + 123}/800/800`;

  // Reactive Path Calculation
  const pathD = useTransform(velocity, (latestVelocity) => {
    const maxVelocity = 2500;
    const rawIntensity = latestVelocity / maxVelocity;
    const intensity = Math.max(-1, Math.min(1, rawIntensity));

    // Stability at rest
    if (Math.abs(intensity) < 0.01) {
        return `M 0 0 L ${WIDTH} 0 L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;
    }

    const bend = intensity * MAX_BEND;
    
    // We adjust control points to create a "belly" skew.
    // Drag Right (Pos): Left edge bumps Right (Inward), Right edge bumps Right (Outward)
    const leftControlX = bend;
    const rightControlX = WIDTH + bend;
    
    return `
      M 0 0
      L ${WIDTH} 0
      Q ${rightControlX} ${HEIGHT / 2}, ${WIDTH} ${HEIGHT}
      L 0 ${HEIGHT}
      Q ${leftControlX} ${HEIGHT / 2}, 0 0
      Z
    `;
  });

  // Dynamic Shadow for Trailing Edge
  // When dragging right, left edge curves in. We add shadow there to define volume.
  const shadowGradient = useTransform(velocity, (v) => {
      const opacity = Math.min(0.4, Math.abs(v) / 5000); // Max opacity 0.4
      if (v > 0) {
          // Moving Right -> Shadow on Left (Trailing)
          return `linear-gradient(to right, rgba(0,0,0,${opacity}) 0%, transparent 20%)`;
      } else {
          // Moving Left -> Shadow on Right (Trailing)
          return `linear-gradient(to left, rgba(0,0,0,${opacity}) 0%, transparent 20%)`;
      }
  });

  return (
    <div style={{ 
        width: WIDTH, 
        height: HEIGHT, 
        flexShrink: 0,
        position: 'relative',
        cursor: 'grab',
        transform: 'translateZ(0)',
    }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`} 
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id={`clip-${uniqueId}`}>
            <motion.path d={pathD} />
          </clipPath>
        </defs>
        
        {/* 
            Oversized Image Layer 
            x starts at -OVERSCAN/2 to center it. 
            Width includes OVERSCAN to ensure we have pixels when bulging out.
        */}
        <image 
            href={imageUrl} 
            x={-OVERSCAN / 2} 
            y="0" 
            width={WIDTH + OVERSCAN} 
            height={HEIGHT} 
            clipPath={`url(#clip-${uniqueId})`}
            preserveAspectRatio="xMidYMid slice" 
        />
        
        {/* Inner Shadow / Lighting to emphasize the bend */}
        <motion.rect 
            width={WIDTH + OVERSCAN} 
            height={HEIGHT} 
            x={-OVERSCAN / 2}
            fill="transparent"
            style={{ backgroundImage: shadowGradient }}
            clipPath={`url(#clip-${uniqueId})`}
            pointerEvents="none"
        />
        
        {/* Shine/Reflection Overlay */}
        <rect 
            width={WIDTH + OVERSCAN} 
            height={HEIGHT} 
            x={-OVERSCAN / 2}
            fill="white" 
            opacity={0.15} 
            clipPath={`url(#clip-${uniqueId})`} 
            style={{ pointerEvents: 'none', mixBlendMode: 'soft-light' }}
        />
        
        {/* Border Outline */}
        <motion.path 
             d={pathD}
             fill="none" 
             stroke={theme.Color.Base.Surface[1]} 
             strokeWidth="3"
             opacity={0.5}
             style={{ pointerEvents: 'none' }}
        />
      </svg>
    </div>
  );
};

export default JellyItem;


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useId } from 'react';
import { useTransform, useMotionValueEvent, MotionValue } from 'framer-motion';
import { useTheme } from '../../Theme.tsx';

interface JellyItemProps {
  velocity: MotionValue<number>;
  index: number;
}

const JellyItem: React.FC<JellyItemProps> = ({ velocity, index }) => {
  const { theme } = useTheme();
  const pathRef = useRef<SVGPathElement>(null);
  const uniqueId = useId();
  
  // Dimensions from spec
  const WIDTH = 400;
  const HEIGHT = 400;
  const MAX_BEND = 60; // Max pixels of deformation

  // Images from Picsum with consistent seeds based on index
  const imageUrl = `https://picsum.photos/seed/${index + 42}/800/800`;

  useMotionValueEvent(velocity, "change", (latestVelocity) => {
    if (!pathRef.current) return;

    // 1. Calculate Intensity (-1 to 1)
    // We clamp velocity to a reasonable max (e.g., 2000px/s) to avoid breaking the shape
    const maxVelocity = 2500;
    const rawIntensity = latestVelocity / maxVelocity;
    const intensity = Math.max(-1, Math.min(1, rawIntensity));

    // 2. Calculate Bend
    // Drag Right (intensity > 0) -> Left edge bends inward (positive x shift)
    // Drag Left (intensity < 0) -> Right edge bends inward (negative x shift relative to width)
    
    // We dampen the bend slightly for top/bottom to keep it subtle
    const currentBend = intensity * MAX_BEND;
    
    // 3. Path Construction
    // Default Rect: (0,0) -> (W,0) -> (W,H) -> (0,H)
    
    let d = "";
    
    if (intensity > 0) {
       // --- MOVING RIGHT (Left Edge trails/bends IN) ---
       const bend = Math.abs(currentBend);
       
       d = `
         M 0 0
         C ${WIDTH * 0.4} 0, ${WIDTH * 0.6} 0, ${WIDTH} 0  
         L ${WIDTH} ${HEIGHT}
         C ${WIDTH * 0.6} ${HEIGHT}, ${WIDTH * 0.4} ${HEIGHT}, 0 ${HEIGHT}
         C ${bend} ${HEIGHT * 0.66}, ${bend} ${HEIGHT * 0.33}, 0 0
         Z
       `;
       // Note: Top/Bottom curves are flattened here, 
       // but left edge (last C command) curves from (0,H) back to (0,0) via (bend, ...)
    } else {
       // --- MOVING LEFT (Right Edge trails/bends IN) ---
       const bend = Math.abs(currentBend);
       const rightEdgeX = WIDTH - bend;
       
       d = `
         M 0 0
         C ${WIDTH * 0.4} 0, ${WIDTH * 0.6} 0, ${WIDTH} 0
         C ${rightEdgeX} ${HEIGHT * 0.33}, ${rightEdgeX} ${HEIGHT * 0.66}, ${WIDTH} ${HEIGHT}
         C ${WIDTH * 0.6} ${HEIGHT}, ${WIDTH * 0.4} ${HEIGHT}, 0 ${HEIGHT}
         L 0 0
         Z
       `;
    }
    
    // Fallback to straight rectangle if near zero to avoid artifacts
    if (Math.abs(intensity) < 0.01) {
        d = `M 0 0 L ${WIDTH} 0 L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;
    }

    pathRef.current.setAttribute("d", d);
  });

  return (
    <div style={{ 
        width: WIDTH, 
        height: HEIGHT, 
        flexShrink: 0,
        position: 'relative',
        cursor: 'grab'
    }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`} 
        style={{ overflow: 'visible' }}
      >
        <defs>
          <clipPath id={`clip-${uniqueId}`}>
            <path ref={pathRef} d={`M 0 0 L ${WIDTH} 0 L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`} />
          </clipPath>
        </defs>
        
        {/* Render Image masked by the path */}
        <image 
            href={imageUrl} 
            x="0" 
            y="0" 
            width={WIDTH} 
            height={HEIGHT} 
            clipPath={`url(#clip-${uniqueId})`}
            preserveAspectRatio="xMidYMid slice" 
        />
        
        {/* Optional Overlay to make it pop against the dark theme */}
        <rect 
            width={WIDTH} 
            height={HEIGHT} 
            fill={theme.Color.Accent.Surface[1]} 
            opacity={0.1} 
            clipPath={`url(#clip-${uniqueId})`} 
            style={{ pointerEvents: 'none', mixBlendMode: 'overlay' }}
        />
      </svg>
    </div>
  );
};

export default JellyItem;


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useId } from 'react';
import { useMotionValueEvent, MotionValue } from 'framer-motion';
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

    // 1. Calculate Intensity (-1 to 1) from velocity
    // We clamp velocity to a reasonable max (e.g., 2500px/s) to avoid breaking the shape
    const maxVelocity = 2500;
    const rawIntensity = latestVelocity / maxVelocity;
    const intensity = Math.max(-1, Math.min(1, rawIntensity));

    // 2. Calculate Bend amount directly from intensity.
    // This value will be positive when moving right, and negative when moving left.
    const bend = intensity * MAX_BEND;
    
    // 3. Path Construction for a shear-like effect.
    // Use 1/3 and 2/3 for the control point Y positions to ensure the
    // curve is perfectly symmetrical, making the bends feel "equal".
    let d = "";
    d = `
      M 0 0
      L ${WIDTH} 0
      C ${WIDTH + bend} ${HEIGHT / 3}, ${WIDTH + bend} ${HEIGHT * 2 / 3}, ${WIDTH} ${HEIGHT}
      L 0 ${HEIGHT}
      C ${bend} ${HEIGHT * 2 / 3}, ${bend} ${HEIGHT / 3}, 0 0
      Z
    `;
    
    // Fallback to a simple rectangle if velocity is near zero to prevent visual artifacts.
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

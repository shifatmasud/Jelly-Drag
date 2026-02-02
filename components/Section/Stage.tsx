/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef } from 'react';
import { motion, MotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../Theme.tsx';
import Button from '../Core/Button.tsx';
import { MetaButtonProps } from '../../types/index.tsx';
import { useElementAnatomy, ElementAnatomy, NormalizedRect } from '../../hooks/useElementAnatomy.tsx';

// --- HELPER TYPES & COMPONENTS ---

type StageButtonProps = Omit<MetaButtonProps, 'customRadius'> & {
  customRadius: any; // Allow MotionValue
}

interface StageProps {
  btnProps: StageButtonProps;
  onButtonClick: () => void;
  showMeasurements: boolean;
  showTokens: boolean;
  view3D: boolean;
  viewRotateX: MotionValue<number>;
  viewRotateZ: MotionValue<number>;
  layerSpacing: MotionValue<number>;
}

/**
 * 📐 Technical Dimension Line
 */
const DimensionLine = ({ 
    x1, y1, x2, y2, label, offset = 0, color, position = 'top' 
}: { 
    x1: number; y1: number; x2: number; y2: number; label: string; offset?: number; color: string; position?: 'top' | 'bottom' | 'left' | 'right' 
}) => {
    const { theme } = useTheme();
    
    // Calculate perpendicular offset
    let dx = 0, dy = 0;
    if (position === 'top') dy = -offset;
    if (position === 'bottom') dy = offset;
    if (position === 'left') dx = -offset;
    if (position === 'right') dx = offset;

    const ox1 = x1 + dx, oy1 = y1 + dy;
    const ox2 = x2 + dx, oy2 = y2 + dy;
    
    // Label Position
    const lx = (ox1 + ox2) / 2;
    const ly = (oy1 + oy2) / 2;
    
    // Tick Marks (Perpendicular small lines at ends)
    const TICK_SIZE = 4;
    let tx = 0, ty = 0;
    if (position === 'top' || position === 'bottom') ty = TICK_SIZE;
    if (position === 'left' || position === 'right') tx = TICK_SIZE;

    const style: React.CSSProperties = {
        ...theme.Type.Expressive.Data,
        fontSize: '10px',
        fill: color,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fontWeight: 500,
        letterSpacing: '0.05em',
        pointerEvents: 'none',
    };
    
    const bgStyle: React.CSSProperties = {
        fill: theme.Color.Base.Surface[1],
        opacity: 0.9,
    };

    const textWidth = label.length * 6 + 8; // Approx width

    return (
        <g>
            <line x1={x1} y1={y1} x2={ox1} y2={oy1} stroke={color} strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="2 2" />
            <line x1={x2} y1={y2} x2={ox2} y2={oy2} stroke={color} strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="2 2" />
            <line x1={ox1} y1={oy1} x2={ox2} y2={oy2} stroke={color} strokeWidth="1" />
            <line x1={ox1 - tx} y1={oy1 - ty} x2={ox1 + tx} y2={oy1 + ty} stroke={color} strokeWidth="1" />
            <line x1={ox2 - tx} y1={oy2 - ty} x2={ox2 + tx} y2={oy2 + ty} stroke={color} strokeWidth="1" />
            <rect x={lx - textWidth/2} y={ly - 6} width={textWidth} height={12} style={bgStyle} />
            <text x={lx} y={ly} style={style}>{label}</text>
        </g>
    );
};

/**
 * 🧱 Blueprint Overlay
 */
const BlueprintOverlay: React.FC<{ anatomy: ElementAnatomy }> = ({ anatomy }) => {
    const { theme } = useTheme();
    const { width, height, padding, children, gap } = anatomy;
    
    const LINE_OFFSET = 24;
    const colorDim = theme.Color.Warning.Content['1'];
    const colorLayout = theme.Color.Signal.Content['1'];
    const CANVAS_PAD = 100;
    
    return (
      <div style={{ 
          position: 'absolute', 
          top: -CANVAS_PAD, 
          left: -CANVAS_PAD, 
          width: width + CANVAS_PAD * 2, 
          height: height + CANVAS_PAD * 2, 
          pointerEvents: 'none',
          zIndex: 10,
          transform: 'translateZ(0px)'
      }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
                <pattern id="hatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="4" style={{ stroke: colorLayout, strokeWidth: 1, opacity: 0.2 }} />
                </pattern>
            </defs>
            <g transform={`translate(${CANVAS_PAD}, ${CANVAS_PAD})`}>
                <rect x="0" y="0" width={padding.left} height={height} fill="url(#hatch)" />
                <rect x={width - padding.right} y="0" width={padding.right} height={height} fill="url(#hatch)" />
                {Object.entries(children).map(([key, rect]) => {
                    const r = rect as NormalizedRect | null;
                    return r ? (
                        <rect 
                            key={key}
                            x={r.x} y={r.y} width={r.width} height={r.height}
                            fill="none" stroke={colorLayout} strokeWidth="1" strokeDasharray="2 2" opacity="0.5"
                        />
                    ) : null;
                })}
                <DimensionLine x1={0} y1={0} x2={width} y2={0} label={`${Math.round(width)}`} offset={LINE_OFFSET} color={colorDim} position="top" />
                <DimensionLine x1={0} y1={0} x2={0} y2={height} label={`${Math.round(height)}`} offset={LINE_OFFSET} color={colorDim} position="left" />
                {padding.left > 0 && <DimensionLine x1={0} y1={height} x2={padding.left} y2={height} label={`${Math.round(padding.left)}`} offset={LINE_OFFSET} color={colorLayout} position="bottom" />}
                {gap > 1 && children.icon && children.text && <DimensionLine x1={children.icon.x + children.icon.width} y1={height} x2={children.text.x} y2={height} label={`${Math.round(gap)}`} offset={LINE_OFFSET} color={colorLayout} position="bottom" />}
                {padding.right > 0 && <DimensionLine x1={width - padding.right} y1={height} x2={width} y2={height} label={`${Math.round(padding.right)}`} offset={LINE_OFFSET} color={colorLayout} position="bottom" />}
            </g>
        </svg>
      </div>
    );
};

/**
 * 🏷️ Token Overlay
 */
type FeedbackVariant = 'Success' | 'Warning' | 'Error' | 'Focus' | 'Signal';

interface TokenBadgeProps {
  label: string;
  variant: FeedbackVariant;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  delay: number;
}

const TokenBadge: React.FC<TokenBadgeProps> = ({ label, variant, x, y, targetX, targetY, delay }) => {
  const { theme } = useTheme();
  const colors = theme.Color[variant];
  const strokeColor = colors.Content[1];
  const fillColor = colors.Surface[1];
  const cp1x = x;
  const cp1y = targetY;
  
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.4 }}>
      <motion.path
        d={`M ${x} ${y} C ${cp1x} ${cp1y}, ${targetX} ${y}, ${targetX} ${targetY}`}
        fill="none" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="4 2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: delay + 0.2, duration: 0.4 }}
      />
      <motion.circle
        cx={targetX} cy={targetY} r="3" fill={fillColor} stroke={strokeColor} strokeWidth="1.5"
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: delay + 0.5, type: 'spring' }}
      />
      <motion.g initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay, type: 'spring' }}>
        <rect x={x - (label.length * 3.5 + 8)} y={y - 10} width={label.length * 7 + 16} height="20" rx="10" fill={fillColor} stroke={strokeColor} strokeWidth="1" />
        <text x={x} y={y} fill={strokeColor} fontSize="10" fontFamily={theme.Type.Expressive.Data.fontFamily} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{label}</text>
      </motion.g>
    </motion.g>
  );
};

const TokenOverlay: React.FC<{ anatomy: ElementAnatomy; btnProps: StageButtonProps }> = ({ anatomy, btnProps }) => {
  const { width, height, children, gap, padding } = anatomy;
  const PAD = 100;
  
  const getPaddingToken = (s: string) => (s === 'S' ? 'Space.M' : s === 'L' ? 'Space.XL' : 'Space.L');
  const getTypographyToken = (s: string) => (s === 'S' ? 'Label.S' : s === 'L' ? 'Label.L' : 'Label.M');
  const getFillToken = (v: string) => (v === 'secondary' ? 'Base.Surface.2' : v === 'ghost' || v === 'outline' ? 'Transparent' : 'Accent.Surface.1');
  const getTextToken = (v: string) => (v === 'secondary' || v === 'ghost' || v === 'outline' ? 'Base.Content.1' : 'Accent.Content.1');
  const getTokenVariant = (label: string): FeedbackVariant => {
    if (label.includes('Space') || label.includes('Gap')) return 'Warning';
    if (label.includes('Radius')) return 'Focus';
    if (label.includes('Color') || label.includes('Fill') || label.includes('Accent') || label.includes('Base') || label.includes('Transparent')) return 'Signal';
    if (label.includes('Type') || label.includes('Label')) return 'Success';
    return 'Error';
  };

  const tokens = [
    { label: 'Radius.Full', x: -40, y: -40, targetX: 8, targetY: 8, delay: 0.1 },
    { label: getPaddingToken(btnProps.size), x: -60, y: height / 2, targetX: padding.left / 2, targetY: height / 2, delay: 0.2 },
    { label: getFillToken(btnProps.variant), x: width + 50, y: height + 40, targetX: width - 20, targetY: height - 10, delay: 0.3 },
  ];

  if (children.text) {
     const textCenter = children.text.x + children.text.width / 2;
     tokens.push({ label: `Type.${getTypographyToken(btnProps.size)}`, x: textCenter, y: -50, targetX: textCenter, targetY: children.text.y + 4, delay: 0.4 });
     tokens.push({ label: getTextToken(btnProps.variant), x: width + 60, y: height / 2 - 10, targetX: children.text.x + children.text.width - 2, targetY: children.text.y + children.text.height / 2, delay: 0.5 });
  }
  if (gap > 0 && children.icon) {
     const gapCenter = children.icon.x + children.icon.width + gap / 2;
     tokens.push({ label: 'Space.S', x: gapCenter, y: height + 50, targetX: gapCenter, targetY: height / 2, delay: 0.6 });
  }

  return (
    <div style={{ position: 'absolute', top: -PAD, left: -PAD, width: width + PAD * 2, height: height + PAD * 2, pointerEvents: 'none', zIndex: 11, transform: 'translateZ(10px)' }}>
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        <g transform={`translate(${PAD}, ${PAD})`}>
          {tokens.map((t, i) => <TokenBadge key={i} {...t} variant={getTokenVariant(t.label)} />)}
        </g>
      </svg>
    </div>
  );
};

interface HUDItemProps {
    layer: { label: string; stroke: string; fill: string };
    gap: MotionValue<number>;
    isLast: boolean;
}

const HUDItem: React.FC<HUDItemProps> = ({ layer, gap, isLast }) => {
    const { theme } = useTheme();
    
    return (
        <motion.div style={{
            marginBottom: isLast ? 0 : gap,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '12px'
        }}>
           {/* Connector Dot - Matches TokenBadge Circle */}
           <div style={{ 
               width: 6, 
               height: 6, 
               borderRadius: '50%', 
               backgroundColor: layer.fill,
               border: `1.5px solid ${layer.stroke}`,
               boxShadow: theme.effects['Effect.Shadow.Drop.1'],
               flexShrink: 0
           }} />
           
           {/* Label Badge - Matches TokenBadge Rect/Text */}
           <span style={{ 
               fontFamily: theme.Type.Expressive.Data.fontFamily,
               fontSize: '10px',
               fontWeight: 'bold',
               color: layer.stroke,
               backgroundColor: layer.fill,
               padding: '0 8px',
               height: '20px',
               borderRadius: '10px', // Pill shape
               border: `1px solid ${layer.stroke}`,
               whiteSpace: 'nowrap',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               lineHeight: 1
           }}>
               {layer.label}
           </span>
        </motion.div>
    );
}

/**
 * 🥞 Layer Stack HUD (2D Overlay)
 * A visual legend that expands vertically to mirror the 3D layer separation.
 */
const LayerStackHUD = ({ layerSpacing }: { layerSpacing: MotionValue<number> }) => {
    const { theme } = useTheme();
    
    // Map 3D spacing (0-150) to 2D UI spacing (4-32)
    const gap = useTransform(layerSpacing, [0, 150], [4, 32]);
    
    // Layers ordered from Top (Index 0) to Bottom (Index 3)
    // Updated to use semantic feedback colors
    const layers = [
        { label: 'Content Layer', stroke: theme.Color.Success.Content[1], fill: theme.Color.Success.Surface[1] },
        { label: 'Ripple Layer', stroke: theme.Color.Focus.Content[1], fill: theme.Color.Focus.Surface[1] },
        { label: 'State Layer', stroke: theme.Color.Signal.Content[1], fill: theme.Color.Signal.Surface[1] },
        { label: 'Surface Layer', stroke: theme.Color.Error.Content[1], fill: theme.Color.Error.Surface[1] }, 
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 200 }} 
            animate={{ opacity: 1, x: 180 }}
            exit={{ opacity: 0, x: 200 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                y: '-50%', // Centered vertically
                display: 'flex',
                flexDirection: 'column', 
                pointerEvents: 'none',
                zIndex: 100,
            }}
        >
            <span style={{ 
                ...theme.Type.Readable.Label.S, 
                color: theme.Color.Base.Content[3], 
                marginBottom: theme.spacing['Space.S'], 
                textAlign: 'left', // Align with the badges
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                paddingLeft: '20px' 
            }}>
                Layer Stack
            </span>
            {layers.map((layer, i) => (
                <HUDItem 
                    key={layer.label} 
                    layer={layer} 
                    gap={gap} 
                    isLast={i === layers.length - 1} 
                />
            ))}
        </motion.div>
    );
};

// --- MAIN COMPONENT ---

const Stage: React.FC<StageProps> = ({ 
    btnProps, 
    onButtonClick, 
    showMeasurements, 
    showTokens,
    view3D,
    viewRotateX,
    viewRotateZ,
    layerSpacing 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Invert the Horizontal Rotation logic (Pass negative to rotateZ)
  const containerRotateZ = useTransform(viewRotateZ, v => -v);

  const anatomy = useElementAnatomy(buttonRef, { icon: 'i', text: 'span' }, [btnProps, showMeasurements, showTokens, view3D]);

  return (
    <div style={{ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '80px',
        perspective: '1000px',
        width: '100%',
        height: '100%',
    }}>
        <motion.div 
            style={{ 
                position: 'relative', 
                display: 'inline-block',
                transformStyle: 'preserve-3d',
                rotateX: view3D ? viewRotateX : 0,
                rotateZ: view3D ? containerRotateZ : 0,
                scale: 1.5,
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
            <Button 
                ref={buttonRef} 
                {...btnProps} 
                onClick={onButtonClick} 
                layerSpacing={layerSpacing}
                view3D={view3D}
            />
            {showMeasurements && anatomy && <BlueprintOverlay anatomy={anatomy} />}
            {showTokens && anatomy && <TokenOverlay anatomy={anatomy} btnProps={btnProps} />}
        </motion.div>

        {/* 2D Layer HUD Overlay */}
        <AnimatePresence>
            {view3D && <LayerStackHUD layerSpacing={layerSpacing} />}
        </AnimatePresence>
    </div>
  );
};

export default Stage;
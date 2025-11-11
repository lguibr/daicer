/**
 * Icosahedron Loading Animation
 * 20-sided die spinning in 3D space
 */

import { useMemo } from 'react';

interface IcosahedronLoaderProps {
  size?: 'small' | 'medium' | 'large';
}

const SIZE_MAP = {
  small: 50,
  medium: 100,
  large: 150,
};

export function IcosahedronLoader({ size = 'medium' }: IcosahedronLoaderProps) {
  const triWidth = SIZE_MAP[size];
  const sqrt3 = 1.732;
  const tilt = 52.62; // asin(tan(54deg)/sqrt(3))
  const capHeight = -1.051 * triWidth; // sqrt(3-tan(54deg)^2)
  const triHeight = triWidth * sqrt3;
  const vshift = capHeight + triHeight / 2;

  const outerRadius = 1.701 * triWidth; // 1/cos(54deg)
  const sideTilt = 10.81; // asin((sec(54deg)-tan(54deg))/sqrt(3))
  const sideHeight = outerRadius;
  const vshift2 = sideHeight + triHeight - vshift;

  // Generate random colors for each face
  const colors = useMemo(
    () =>
      Array.from({ length: 20 }, () => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r}, ${g}, ${b}, 0.4)`;
      }),
    []
  );

  const getFaceStyle = (index: number): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: 0,
      bottom: '50%',
      borderBottom: `${triHeight}px solid ${colors[index]}`,
      borderLeft: `${triWidth}px solid transparent`,
      borderRight: `${triWidth}px solid transparent`,
      transformOrigin: '50% 0%',
    };

    // Top cap (faces 0-4)
    if (index < 5) {
      return {
        ...baseStyle,
        transform: `translateY(${vshift}px) rotateY(${index * 72}deg) rotateX(${tilt}deg)`,
      };
    }

    // Bottom cap (faces 5-9)
    if (index < 10) {
      return {
        ...baseStyle,
        transform: `translateY(${vshift2}px) rotateY(${index * 72 + 36}deg) rotateX(${180 - tilt}deg)`,
      };
    }

    // Bottom sides (faces 10-14)
    if (index < 15) {
      return {
        ...baseStyle,
        transform: `translateY(${triHeight / 2}px) rotateY(${index * 72 + 36}deg) translateZ(${outerRadius}px) rotateX(-${sideTilt}deg)`,
      };
    }

    // Top sides (faces 15-19)
    return {
      ...baseStyle,
      transform: `translateY(${triHeight / 2 + sideHeight}px) rotateY(${index * 72}deg) rotateZ(180deg) translateZ(${outerRadius}px) rotateX(-${sideTilt}deg)`,
    };
  };

  return (
    <div
      style={{
        position: 'relative',
        width: triWidth * 2,
        height: triWidth * 2,
        transformStyle: 'preserve-3d',
        animation: 'icosahedronSpin 16s infinite linear',
      }}
    >
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={getFaceStyle(i)} />
      ))}

      <style>{`
        @keyframes icosahedronSpin {
          0% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(360deg) rotateY(720deg) rotateZ(1080deg);
          }
        }
      `}</style>
    </div>
  );
}

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { designTokens } from './theme';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
}

const { colors } = designTokens;

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = colors.brand[500],
  fill = true,
  strokeWidth = 1.5,
}: SparklineProps) {
  const { line, area } = useMemo(() => {
    if (!data || data.length === 0) return { line: '', area: '' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = data.length > 1 ? width / (data.length - 1) : 0;
    const padY = strokeWidth + 1;
    const usableH = height - padY * 2;

    const points = data.map((v, i) => {
      const x = i * stepX;
      const y = padY + (1 - (v - min) / range) * usableH;
      return [x, y] as const;
    });

    const linePath = points
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(' ');

    const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${height} L 0 ${height} Z`;

    return { line: linePath, area: areaPath };
  }, [data, width, height, strokeWidth]);

  if (!data || data.length === 0) {
    return <View style={{ width, height }} />;
  }

  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {fill ? (
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.25} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
        ) : null}
        {fill ? <Path d={area} fill={`url(#${gradId})`} /> : null}
        <Path
          d={line}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

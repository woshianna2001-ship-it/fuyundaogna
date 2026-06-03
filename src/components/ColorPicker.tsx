import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  width?: number;
  height?: number;
}

// 辅助函数：HSV 转 RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i) {
    case 0:
      return [v * 255, t * 255, p * 255];
    case 1:
      return [q * 255, v * 255, p * 255];
    case 2:
      return [p * 255, v * 255, t * 255];
    case 3:
      return [p * 255, q * 255, v * 255];
    case 4:
      return [t * 255, p * 255, v * 255];
    case 5:
      return [v * 255, p * 255, q * 255];
    default:
      return [0, 0, 0];
  }
}

// 辅助函数：RGB 转十六进制
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

// 辅助函数：解析颜色到 HSV
function parseColorToHsv(color: string): [number, number, number] {
  if (!color) return [0, 0, 1];

  // 十六进制
  if (color.startsWith('#')) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;

      let h = 0;
      if (diff !== 0) {
        if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
        else if (max === g) h = ((b - r) / diff + 2) * 60;
        else h = ((r - g) / diff + 4) * 60;
      }

      const s = max === 0 ? 0 : diff / max;
      const v = max;

      return [h, s, v];
    }
  }

  // RGB/RGBA
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1]) / 255;
    const g = parseInt(match[2]) / 255;
    const b = parseInt(match[3]) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / diff + 2) * 60;
      else h = ((r - g) / diff + 4) * 60;
    }

    const s = max === 0 ? 0 : diff / max;
    const v = max;

    return [h, s, v];
  }

  return [0, 0, 1];
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  width = 250,
  height = 200,
}) => {
  const saturationCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hsv, setHsv] = useState<[number, number, number]>([0, 0, 1]);
  const [isDragging, setIsDragging] = useState<'saturation' | 'hue' | null>(null);

  const saturationWidth = width - 30;
  const saturationHeight = height;
  const hueWidth = 20;

  // 绘制饱和度/明度画布
  const drawSaturationCanvas = useCallback(() => {
    const canvas = saturationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [h] = hsv;
    const [baseR, baseG, baseB] = hsvToRgb(h, 1, 1);

    // 白色渐变（从左到右）
    const gradientH = ctx.createLinearGradient(0, 0, saturationWidth, 0);
    gradientH.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradientH.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradientH;
    ctx.fillRect(0, 0, saturationWidth, saturationHeight);

    // 黑色渐变（从上到下）
    const gradientV = ctx.createLinearGradient(0, 0, 0, saturationHeight);
    gradientV.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradientV.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = gradientV;
    ctx.fillRect(0, 0, saturationWidth, saturationHeight);

    // 底色
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = `rgb(${Math.round(baseR)}, ${Math.round(baseG)}, ${Math.round(baseB)})`;
    ctx.fillRect(0, 0, saturationWidth, saturationHeight);
    ctx.globalCompositeOperation = 'source-over';
  }, [hsv, saturationWidth, saturationHeight]);

  // 绘制色相条
  const drawHueBar = useCallback(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, saturationHeight);
    for (let i = 0; i <= 360; i += 30) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, hueWidth, saturationHeight);
  }, [saturationHeight]);

  useEffect(() => {
    drawSaturationCanvas();
    drawHueBar();
  }, [drawSaturationCanvas, drawHueBar]);

  // 初始化 HSV 值
  useEffect(() => {
    setHsv(parseColorToHsv(value));
  }, [value]);

  // 获取鼠标在画布上的位置
  const getCanvasPosition = (
    e: React.MouseEvent | MouseEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  };

  // 处理饱和度画布点击/拖动
  const handleSaturationChange = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const canvas = saturationCanvasRef.current;
      if (!canvas) return;

      const pos = getCanvasPosition(e, canvas);
      const s = pos.x / saturationWidth;
      const v = 1 - pos.y / saturationHeight;

      const newHsv: [number, number, number] = [hsv[0], s, v];
      setHsv(newHsv);

      const [r, g, b] = hsvToRgb(newHsv[0], newHsv[1], newHsv[2]);
      onChange(rgbToHex(r, g, b));
    },
    [hsv, saturationWidth, saturationHeight, onChange]
  );

  // 处理色相条点击/拖动
  const handleHueChange = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const canvas = hueCanvasRef.current;
      if (!canvas) return;

      const pos = getCanvasPosition(e, canvas);
      const h = (pos.y / saturationHeight) * 360;

      const newHsv: [number, number, number] = [h, hsv[1], hsv[2]];
      setHsv(newHsv);

      const [r, g, b] = hsvToRgb(newHsv[0], newHsv[1], newHsv[2]);
      onChange(rgbToHex(r, g, b));
    },
    [hsv, saturationHeight, onChange]
  );

  // 鼠标事件
  const handleSaturationMouseDown = (e: React.MouseEvent) => {
    setIsDragging('saturation');
    handleSaturationChange(e);
  };

  const handleHueMouseDown = (e: React.MouseEvent) => {
    setIsDragging('hue');
    handleHueChange(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging === 'saturation') {
        handleSaturationChange(e);
      } else if (isDragging === 'hue') {
        handleHueChange(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleSaturationChange, handleHueChange]);

  // 计算指示器位置
  const saturationIndicatorX = hsv[1] * saturationWidth;
  const saturationIndicatorY = (1 - hsv[2]) * saturationHeight;
  const hueIndicatorY = (hsv[0] / 360) * saturationHeight;

  // 当前颜色
  const [currentR, currentG, currentB] = hsvToRgb(hsv[0], hsv[1], hsv[2]);
  const currentColor = rgbToHex(currentR, currentG, currentB);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* 饱和度/明度选择区域 */}
        <Box sx={{ position: 'relative' }}>
          <canvas
            ref={saturationCanvasRef}
            width={saturationWidth}
            height={saturationHeight}
            style={{
              borderRadius: 4,
              cursor: 'crosshair',
            }}
            onMouseDown={handleSaturationMouseDown}
          />
          {/* 饱和度指示器 */}
          <Box
            sx={{
              position: 'absolute',
              left: saturationIndicatorX - 6,
              top: saturationIndicatorY - 6,
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 0 2px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              backgroundColor: currentColor,
            }}
          />
        </Box>

        {/* 色相选择条 */}
        <Box sx={{ position: 'relative' }}>
          <canvas
            ref={hueCanvasRef}
            width={hueWidth}
            height={saturationHeight}
            style={{
              borderRadius: 4,
              cursor: 'pointer',
            }}
            onMouseDown={handleHueMouseDown}
          />
          {/* 色相指示器 */}
          <Box
            sx={{
              position: 'absolute',
              left: -2,
              top: hueIndicatorY - 4,
              width: hueWidth + 4,
              height: 8,
              borderRadius: 2,
              border: '2px solid white',
              boxShadow: '0 0 2px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
              backgroundColor: currentColor,
            }}
          />
        </Box>
      </Box>

      {/* 当前颜色预览 */}
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            backgroundColor: currentColor,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
        <Typography variant="body2" fontFamily="monospace">
          {currentColor}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ColorPicker;

import { useState, useEffect, memo } from 'react';
import { Typography, Box, useTheme } from '@mui/material';

export type ClockSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type DateDisplay = 'none' | 'weekday' | 'short' | 'full';

export interface DigitalClockProps {
  /** 预设尺寸 (优先使用 customFontSize) */
  size?: ClockSize;
  /** 自定义字体大小 (支持 '2.5rem', '40px' 等 CSS 值) */
  customFontSize?: string;
  /** 日期显示模式: none | weekday | short | full */
  dateDisplay?: DateDisplay;
  /** 是否显示秒 */
  showSeconds?: boolean;
  /** 时间格式: 12h | 24h */
  format?: '12h' | '24h';
  /** 自定义颜色 (默认跟随主题) */
  color?: string;
  /** 字体粗细 */
  fontWeight?: number | string;
  /** 日期部分是否加粗 */
  dateBold?: boolean;
  /** 自定义 className */
  className?: string;
  /** 点击事件 */
  onClick?: () => void;
}

// 尺寸映射配置
const SIZE_MAP: Record<ClockSize, { fontSize: string; lineHeight: string; dateScale: number }> = {
  xs: { fontSize: '0.7rem', lineHeight: '1', dateScale: 0.9 },
  sm: { fontSize: '0.8rem', lineHeight: '1', dateScale: 0.9 },
  md: { fontSize: '0.95rem', lineHeight: '1.1', dateScale: 0.95 },
  lg: { fontSize: '1.15rem', lineHeight: '1.1', dateScale: 0.95 },
  xl: { fontSize: '1.4rem', lineHeight: '1', dateScale: 0.9 },
};

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const DigitalClock = memo(function DigitalClock({
  size = 'md',
  customFontSize,
  dateDisplay = 'weekday',
  showSeconds = true,
  format = '24h',
  color,
  fontWeight = 500,
  dateBold = false,
  className = '',
  onClick,
}: DigitalClockProps) {
  const theme = useTheme();
  const [time, setTime] = useState(new Date());

  // 每秒更新时间
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 时间格式化
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    let period = '';

    if (format === '12h') {
      period = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}${showSeconds ? `:${seconds}` : ''}${period}`;
  };

  // 日期格式化
  const formatDate = (date: Date, mode: DateDisplay) => {
    if (mode === 'none') return '';
    
    const weekday = WEEK_DAYS[date.getDay()];
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    switch (mode) {
      case 'weekday': return weekday;
      case 'short': return `${month}-${day} ${weekday}`;
      case 'full': return `${year}-${month}-${day} ${weekday}`;
      default: return '';
    }
  };

  // 解析最终尺寸
  const resolvedSize = customFontSize 
    ? { fontSize: customFontSize, lineHeight: '1', dateScale: 0.8 } 
    : SIZE_MAP[size || 'md'];

  const { fontSize, lineHeight, dateScale } = resolvedSize;
  const timeString = formatTime(time);
  const dateString = formatDate(time, dateDisplay);

  return (
    <Box
      component="span"
      className={`digital-clock ${className}`}
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.3em',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        // ✨ 核心样式：无边框、透明背景
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      {/* 📅 日期部分 */}
      {dateDisplay !== 'none' && dateString && (
        <Typography
          className="date-part"
          component="span"
          sx={{
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
            fontSize: `calc(${fontSize} * ${dateScale})`,
            lineHeight,
            fontWeight: dateBold ? (typeof fontWeight === 'number' ? fontWeight + 200 : 'bold') : fontWeight,
            color: color || 'text.secondary',
            // 暗色模式自适应
            '.dark &': color === undefined ? { color: 'rgba(255, 255, 255, 0.65)' } : {},
            whiteSpace: 'nowrap',
          }}
        >
          {dateString}
        </Typography>
      )}

      {/* ⏰ 时间部分 */}
      <Typography
        component="span"
        sx={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize,
          lineHeight,
          fontWeight,
          color: color || theme.palette.primary.main,
          // 暗色模式自适应
          '.dark &': color === undefined ? { color: 'rgba(255, 255, 255, 0.95)' } : {},
          whiteSpace: 'nowrap',
          // 🔢 等宽数字：防止秒数变化时布局抖动
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {timeString}
      </Typography>
    </Box>
  );
});

export default DigitalClock;
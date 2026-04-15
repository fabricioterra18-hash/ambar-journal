'use client'

import clsx from 'clsx'

interface Props {
  percentage: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  color?: string
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  color = 'stroke-coral-500'
}: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-sand-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={clsx(color, 'animate-progress')}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-charcoal-900 font-heading">{Math.round(percentage)}%</span>
          {sublabel && <span className="text-[10px] text-charcoal-400 font-medium mt-0.5">{sublabel}</span>}
        </div>
      </div>
      {label && <span className="text-sm text-charcoal-600 font-medium mt-2">{label}</span>}
    </div>
  )
}

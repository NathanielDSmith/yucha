import * as featherIcons from 'feather-icons'

interface IconProps {
  name: keyof typeof featherIcons.icons
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2, className }: IconProps) {
  const iconHtml = featherIcons.icons[name]?.toSvg({
    width: size,
    height: size,
    color,
    'stroke-width': strokeWidth,
  })

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: iconHtml || '' }}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    />
  )
}

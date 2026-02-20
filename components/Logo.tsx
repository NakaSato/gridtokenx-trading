import Image from 'next/image'
import logo from '@/public/svgs/logo.svg'

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export function Logo({ width = 32, height = 32, className }: LogoProps) {
  return (
    <Image
      src={logo}
      alt="GridTokenX"
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}

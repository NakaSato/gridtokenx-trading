import { cn } from '@/lib/utils'

/**
 * Text half of the brand lockup, sitting next to <Logo />. The trailing "X"
 * carries the accent colour, a space, an italic and 1.25x the size so the mark
 * reads as "GRIDTOKEN X" rather than one flat word.
 *
 * Type is set to 24px to match the rendered height of the icon it pairs with
 * (a square viewBox letterboxed into the 24x28 box). Merged through `cn`, so a
 * caller passing its own `text-*` wins over the default rather than fighting it
 * on stylesheet order.
 */
export const LogoWordmark = ({ className = '' }) => {
  return (
    <span
      className={cn(
        'select-none text-2xl font-bold leading-none tracking-tight text-foreground',
        className
      )}
    >
      {/* Explicit {' '} rather than a literal space: JSX would strip it if the
          markup ever wraps onto its own line. */}
      {/* em, not a fixed px: the X tracks whatever size the caller sets on the
          wrapper. leading-none keeps the taller glyph from growing the line box
          and nudging the lockup off the icon's centre. */}
      GRIDTOKEN{' '}
      <span className="text-[1.25em] italic leading-none text-primary">X</span>
    </span>
  )
}

export const Logo = ({ width = 110, height = 50, className = '' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`css-ze2te4 css-qd6ojx ${className}`}
      viewBox="0 0 70 70"
      width={width}
      height={height}
    >
      <g
        xmlns="http://www.w3.org/2000/svg"
        transform="matrix(.86207 0 0 .86207 -8.103 -8.103)"
        className="css-6dhg35"
        fill="#35D0BA"
      >
        <circle cx="50" cy="50" r="17.8" />
        <path d="M50 78.9c16 0 28.9-13 28.9-28.9 0-8.9-4-17.1-10.9-22.6l-5.3 6.7c4.9 3.9 7.7 9.7 7.7 15.9 0 11.2-9.1 20.4-20.4 20.4-11.2 0-20.4-9.1-20.4-20.4S38.8 29.6 50 29.6c.9 0 1.8.1 2.7.2l1.1-8.5c-1.3-.2-2.6-.3-3.9-.3C33.9 21 21 34 21 49.9c.1 16.1 13 29 29 29z" />
        <path d="M50 82.1c-7.3 0-14.1-2.4-19.8-6.9l-5.3 6.7c7.2 5.7 15.9 8.7 25.1 8.7 15.2 0 29-8.4 36-21.8l-7.5-3.9C72.9 75.5 62 82.1 50 82.1zM46.4 18.1c1.2-.1 2.4-.2 3.6-.2 17.7 0 32.1 14.4 32.1 32.1h8.5C90.6 27.6 72.4 9.4 50 9.4c-1.5 0-3 .1-4.5.2C24.9 11.9 9.4 29.3 9.4 50c0 4.4.7 8.7 2.1 12.8l8.1-2.7c-1.1-3.3-1.6-6.7-1.6-10.2-.1-16.3 12.2-30 28.4-31.8z" />
      </g>
    </svg>
  )
}

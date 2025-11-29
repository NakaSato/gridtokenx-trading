import {
  DeltaIcon,
  GammaIcon,
  RhoIcon,
  ThetaIcon,
  VegaIcon,
} from '@/public/svgs/icons'
import { formatGreek } from '@/utils/formatter'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface GreekPopupProps {
  value: string
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
}

export default function GreekPopup({
  value,
  delta,
  gamma,
  theta,
  vega,
  rho,
}: GreekPopupProps) {
  const [dropDownActive, setDropDownActive] = useState<boolean>(true)
  return (
    <div
      className={
        value === '' || parseFloat(value) <= 0
          ? 'hidden'
          : 'flex w-full flex-col rounded-sm border'
      }
    >
      <div
        className="flex w-full items-center justify-between px-6 py-4"
        onClick={() => setDropDownActive(!dropDownActive)}
      >
        <span className="h-fit text-sm font-medium text-secondary-foreground">
          Greeks
        </span>
        {dropDownActive ? (
          <ChevronUp className="h-4 w-4 text-sm text-secondary-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-sm text-secondary-foreground" />
        )}
      </div>
      {dropDownActive && (
        <div className="space-y-4 border-t px-6 py-5">
          <div className="flex flex-col gap-1 text-sm text-secondary-foreground">
            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <DeltaIcon />
                <span>Delta</span>
              </div>
              <span>{formatGreek(delta)}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <GammaIcon />
                <span>Gamma</span>
              </div>
              <span>{formatGreek(gamma)}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <ThetaIcon />
                <span>Theta</span>
              </div>
              <span>{formatGreek(theta)}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <VegaIcon />
                <span>Vega</span>
              </div>
              <span>{formatGreek(vega)}</span>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <RhoIcon />
                <span>Rho</span>
              </div>
              <span>{formatGreek(rho)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

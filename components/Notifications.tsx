import { InfoIcon, NotificationIcon, RedCircle } from '@/public/svgs/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { XIcon } from 'lucide-react'
import { Separator } from './ui/separator'

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="hidden focus:outline-none sm:flex">
          <div className="rounded-sm bg-secondary p-[9px] text-foreground hover:text-primary">
            <NotificationIcon />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="flex w-[392px] flex-col rounded-sm bg-accent p-0"
        >
          <div className="w-full px-5 py-3 shadow-lg">
            <span className="text-xs font-semibold text-foreground">
              Notifications (2)
            </span>
          </div>
          <div className="w-full p-5">
            <div className="flex w-full space-x-3">
              <div className="h-fit rounded-sm bg-secondary p-[9px] text-primary">
                <InfoIcon />
              </div>
              <span className="text-xs font-normal text-foreground">
                Lorem ipsum dolor sit amet conse. Urna dui enim turpis gravida.
                Elementum fermentum tin posuere.
              </span>
              <div className="flex flex-col justify-between">
                <div className="flex justify-end">
                  <RedCircle />
                </div>
                <span className="flex whitespace-nowrap text-xs text-secondary-foreground">
                  6 min ago
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="focus:outline-none sm:hidden">
          <div className="rounded-[12px] bg-secondary p-[9px] text-foreground hover:text-primary">
            <NotificationIcon />
          </div>
        </DialogTrigger>
        <DialogContent className="flex h-full w-full flex-col gap-0 space-y-3 border-none bg-accent p-0 outline outline-accent">
          <div className="flex w-full items-center justify-between px-3 py-2">
            <DialogTitle className="text-base font-medium text-foreground">
              Notifications
            </DialogTitle>
            <Button
              className="w-9 rounded-[12px] border bg-secondary p-[9px] shadow-none [&_svg]:size-[18px]"
              onClick={() => setIsOpen(false)}
            >
              <XIcon size={18} className="text-secondary-foreground" />
            </Button>
          </div>
          <div className="w-full px-3">
            <div className="w-full">
              <div className="flex w-full space-x-3">
                <div className="h-fit rounded-[8px] bg-secondary p-[9px] text-primary">
                  <InfoIcon />
                </div>
                <span className="text-xs font-normal text-foreground">
                  Lorem ipsum dolor sit amet conse. Urna dui enim turpis
                  gravida. Elementum fermentum tin posuere.
                </span>
                <div className="flex flex-col justify-between">
                  <div className="flex justify-end rounded-full">
                    <RedCircle />
                  </div>
                  <span className="flex whitespace-nowrap text-xs text-secondary-foreground">
                    6 min ago
                  </span>
                </div>
              </div>
              <Separator className="my-4" />
            </div>
            <div className="w-full">
              <div className="flex w-full space-x-3">
                <div className="h-fit rounded-[8px] bg-secondary p-[9px] text-primary">
                  <InfoIcon />
                </div>
                <span className="text-xs font-normal text-foreground">
                  Lorem ipsum dolor sit amet conse. Urna dui enim turpis
                  gravida. Elementum fermentum tin posuere.
                </span>
                <div className="flex flex-col justify-between">
                  <div className="flex justify-end rounded-full"></div>
                  <span className="flex whitespace-nowrap text-xs text-secondary-foreground">
                    10 min ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

import { ToastCheck, ToastCircle } from '@/public/svgs/icons'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

interface TransactionToastProps {
  transaction: string
  isOpen: boolean
  setIsOpen: (state: boolean) => void
}

export default function TransactionToast({
  transaction,
  isOpen,
  setIsOpen,
}: TransactionToastProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="flex h-[380px] w-[420px] flex-col justify-center gap-0 space-y-20 p-5 md:rounded-[20px]">
        <DialogTitle className="flex w-full flex-col items-center justify-center space-y-6">
          <div className="relative flex h-fit w-fit justify-center">
            <ToastCircle />
            <div className="absolute top-2.5">
              <ToastCheck />
            </div>
          </div>
          <span className="text-center text-2xl font-medium">
            {transaction} has been <br />{' '}
            <span className="text-[#53C08D]">completed!</span>
          </span>
        </DialogTitle>
        <div className="flex w-full items-end justify-center">
          <Button
            className="border bg-inherit px-4 py-2 font-medium text-foreground shadow-none"
            onClick={() => setIsOpen(false)}
          >
            Back to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

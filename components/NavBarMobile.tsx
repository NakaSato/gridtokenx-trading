import {
  BookOpenText,
  ChartLine,
  ChevronDown,
  FileChartColumn,
  MenuIcon,
  MessagesSquare,
  TableColumnsSplit,
  XIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import Image from "next/image";
import { Button, buttonVariants } from "./ui/button";
import { AuthButton } from "./auth";
import { useState } from "react";
import { EarnIcon, MoreIcon } from "@/public/svgs/icons";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";
import SettingsMobile from "./SettingsMobile";
import WalletSideBar from "./WalletSidebar";
import { useWallet } from "@solana/wallet-adapter-react";
import x from "@/public/svgs/x.svg";
import discord from "@/public/svgs/discord.svg";
import telegram from "@/public/svgs/telegram.svg";
import { Logo } from "./Logo";

export default function NavBarMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState<string>("Trade");
  const [isDropped, setIsDropped] = useState(false);
  const { connected } = useWallet();
  const router = useRouter();
  const handleClick = (state: string) => {
    if (active !== state) {
      setActive(state);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="focus:outline-none lg:hidden">
        <div className="bg-secondary rounded-sm p-[9px] text-foreground hover:text-primary">
          <MenuIcon size={18} />
        </div>
      </DialogTrigger>
      <DialogContent className="w-full h-full md:h-fit bg-background flex flex-col p-0 justify-between">
        <DialogTitle className="hidden">Navigation Menu</DialogTitle>
        <div className="w-full flex flex-col p-0 space-y-4">
          <div className="px-3 py-2 w-full flex justify-between items-center">
            <div className="w-[78px] h-[28px] flex items-center px-[6px] py-1">
              <Logo width={65} height={21} />
            </div>
            <Button
              className="bg-secondary p-[9px] shadow-none [&_svg]:size-[18px] rounded-sm"
              onClick={() => setIsOpen(false)}
            >
              <XIcon size={18} className="text-secondary-foreground" />
            </Button>
          </div>
          <div className="flex flex-col w-full px-3 space-y-3">
            <Button
              className={cn(
                buttonVariants({
                  variant: active === "Trade" ? "active" : "inactive",
                }),
                "bg-accent justify-start px-5 py-3 md:hidden lg:flex rounded-sm"
              )}
              onClick={() => {
                handleClick("Trade");
                router.push("/");
                setIsOpen(false);
              }}
            >
              <ChartLine size={16} />
              <h1 className="text-sm font-medium group-hover:text-primary">
                Trade
              </h1>
              <Badge
                className={cn(
                  active === "Trade"
                    ? "border-primary text-gradient-primary"
                    : "border-secondary-foreground text-secondary-foreground",
                  "border text-[8px] px-1 py-[3px] rounded-[3px] h-4 bg-transparent text-center flex group-hover:border-primary group-hover:text-primary"
                )}
              >
                NEW
              </Badge>
            </Button>
            <Button
              className={cn(
                buttonVariants({
                  variant: active === "Futures" ? "active" : "inactive",
                }),
                "bg-accent justify-start px-5 py-3 md:hidden lg:flex rounded-sm"
              )}
              onClick={() => {
                handleClick("Futures");
                router.push("/futures");
                setIsOpen(false);
              }}
            >
              <ChartLine size={16} />
              <h1 className="text-sm font-medium group-hover:text-primary">
                Futures
              </h1>
              <Badge
                className={cn(
                  active === "Futures"
                    ? "border-primary text-gradient-primary"
                    : "border-secondary-foreground text-secondary-foreground",
                  "border text-[8px] px-1 py-[3px] rounded-[3px] h-4 bg-transparent text-center flex group-hover:border-primary group-hover:text-primary"
                )}
              >
                BETA
              </Badge>
            </Button>
            <Button
              className={cn(
                buttonVariants({
                  variant: active === "Earn" ? "active" : "inactive",
                }),
                "bg-accent justify-start px-5 py-3 flex rounded-sm"
              )}
              onClick={() => {
                handleClick("Earn");
                router.push("/earn");
                setIsOpen(false);
              }}
            >
              <EarnIcon />
              <h1 className="text-sm font-medium">Earn</h1>
              <Badge className="rounded-sm bg-gradient-primary px-1 py-[3px] text-background h-4 text-[8px] border-none">
                48% APY
              </Badge>
            </Button>
            <div className="w-full bg-accent rounded-sm p-0">
              <Button
                className="w-full bg-accent px-5 py-3 flex justify-between text-secondary-foreground rounded-sm shadow-none"
                onClick={() => setIsDropped(!isDropped)}
              >
                <div className="flex space-x-2 items-center">
                  <MoreIcon />
                  <h1 className="text-sm font-medium">More</h1>
                </div>
                <ChevronDown size={12} />
              </Button>
              {isDropped && (
                <>
                  {[
                    {
                      name: "Options Chain",
                      icon: <TableColumnsSplit />,
                      link: "/options-chain",
                    },
                    {
                      name: "Analytics",
                      icon: <FileChartColumn />,
                      link: "/analytics",
                    },
                    {
                      name: "Docs",
                      icon: <BookOpenText />,
                      link: "https://docs.olive.finance",
                    },
                    {
                      name: "Feedback",
                      icon: <MessagesSquare />,
                      link: "/feedback",
                    },
                    {
                      name: "Medium",
                      icon: <TableColumnsSplit />,
                      link: "https://medium.com",
                    },
                    {
                      name: "X",
                      icon: <Image src={x} alt="x link" />,
                      link: "https://x.com/_olivefinance",
                    },
                    {
                      name: "Telegram",
                      icon: <Image src={telegram} alt="telegram link" />,
                      link: "https://t.me/olive_financee",
                    },
                    {
                      name: "Discord",
                      icon: <Image src={discord} alt="discord link" />,
                      link: "https://discord.gg/u6pq5yNj",
                    },
                  ].map((item, idx) => (
                    <div
                      className="w-full px-5 py-3 pt-0 text-sm text-secondary-foreground flex flex-col"
                      key={idx}
                    >
                      <Separator className="mb-3" />
                      <Button
                        variant={"ghost"}
                        className="p-0 justify-start w-fit h-fit gap-2"
                        onClick={() => {
                          router.push(item.link);
                          setIsOpen(false);
                        }}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
            <SettingsMobile />
          </div>
        </div>
        <div className="w-full pb-10 px-3">
          {connected ? (
            <WalletSideBar></WalletSideBar>
          ) : (
            <AuthButton
              signInVariant="default"
              className="w-full h-fit border border-transparent py-[7px] px-4 rounded-sm text-background bg-primary hover:bg-gradient-primary"
              signInText="Connect Wallet"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNavigation, isActivePath } from "@/config/navigation";
import { signOut } from "@/lib/auth/actions";
import { useNavLabels } from "@/lib/navigation/labels-context";
import { useTenant } from "@/lib/tenant/tenant-context";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const tenant = useTenant();
  const pathname = usePathname();
  const { labels } = useNavLabels();
  const current = getNavigation(tenant.businessType, labels).find((item) =>
    isActivePath(pathname, item.href),
  );

  return (
    <header className="sticky top-0 z-30 bg-background/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Same width as the page content, so the title lines up with it. */}
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-3">
        <MobileNav />
        <h1 className="min-w-0 flex-1 truncate text-3xl font-semibold tracking-tight">
          {current?.label}
        </h1>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Հաշվի մենյու"
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Avatar size="lg" className="shadow-soft after:hidden">
              <AvatarFallback className="bg-card font-medium text-foreground">
                {tenant.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">
                {tenant.name}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut />
              Դուրս գալ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

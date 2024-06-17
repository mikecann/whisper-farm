import * as React from "react";
import { Link, LinkProps } from "@/components/Link.tsx";
import { routes } from "@/router.ts";
import { Package } from "lucide-react";

interface Props extends LinkProps {
  children?: React.ReactNode;
  isActive?: boolean;
}

export const MainNavLink: React.FC<Props> = ({ children, isActive, ...rest }) => {
  return (
    <Link
      className={
        isActive
          ? "flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
          : "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
      }
      {...rest}
    >
      {children}
    </Link>
  );
};

import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SCREEN_BUTTON_CLASS = "h-12 w-full gap-2 text-base";

type ScanScreenProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  actions: ReactNode;
  alert?: boolean;
};

/** The card every step after the scan uses: title, body, and stacked buttons. */
export function ScanScreen({ title, description, icon, children, actions, alert }: ScanScreenProps) {
  return (
    <Card role={alert ? "alert" : undefined}>
      <CardHeader>
        {icon}
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription className="text-base">{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent className="flex flex-col gap-4">{children}</CardContent>}
      <CardFooter className="flex flex-col gap-3">{actions}</CardFooter>
    </Card>
  );
}

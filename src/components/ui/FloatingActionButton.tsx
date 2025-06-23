import React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FloatingActionButton({
  onClick,
  children,
  className,
  disabled = false,
}: FloatingActionButtonProps) {
  return (
    <Button
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg",
        className
      )}
    >
      {children}
    </Button>
  );
}
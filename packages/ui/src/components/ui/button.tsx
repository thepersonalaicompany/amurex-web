import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@amurex/ui/lib";

const buttonVariants = cva(
  "font-bold rounded-lg focus:outline-none transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        ghost: "bg-transparent hover:bg-gray-100",
        navbar:
          "border border-transparent bg-transparent hover:border hover:bg-[#3c1671] hover:border-[#6D28D9]",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
      },
      size: {
        small: "px-2 py-1 text-sm",
        medium: "px-4 py-2",
        large: "px-6 py-3 text-lg",
        icon: "p-2",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  },
);
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as React from "react";
import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    View,
} from "react-native";

interface ButtonProps extends PressableProps {
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    isLoading?: boolean;
    children?: React.ReactNode;
}

const buttonVariants = {
    default: "bg-primary active:opacity-80",
    destructive: "bg-destructive active:opacity-90",
    outline: "border border-input bg-background active:bg-primary/10",
    secondary: "bg-secondary active:opacity-80",
    ghost: "active:bg-primary/10",
    link: "underline-offset-4",
};

const buttonTextVariants = {
    default: "text-primary-foreground",
    destructive: "text-destructive-foreground",
    outline: "text-foreground",
    secondary: "text-secondary-foreground",
    ghost: "text-foreground",
    link: "text-primary underline",
};

const buttonSizeVariants = {
    default: "h-12 px-5 py-3",
    sm: "h-9 px-3",
    lg: "h-14 px-8",
    icon: "h-10 w-10",
};

const buttonTextSizeVariants = {
    default: "text-base",
    sm: "text-sm",
    lg: "text-lg",
    icon: "text-base",
};

const Button = React.forwardRef<View, ButtonProps>(
    (
        {
            className,
            variant = "default",
            size = "default",
            isLoading = false,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        return (
            <TextClassContext.Provider
                value={cn(
                    "text-center font-semibold",
                    buttonTextVariants[variant],
                    buttonTextSizeVariants[size],
                    (disabled || isLoading) && "opacity-50"
                )}
            >
                <Pressable
                    ref={ref}
                    disabled={disabled || isLoading}
                    className={cn(
                        "flex-row items-center justify-center rounded-lg",
                        buttonVariants[variant],
                        buttonSizeVariants[size],
                        (disabled || isLoading) && "opacity-50",
                        className
                    )}
                    {...props}
                >
                    {isLoading ? (
                        <ActivityIndicator
                            size="small"
                            color={variant === "outline" ? "#1e293b" : "#ffffff"}
                        />
                    ) : (
                        children
                    )}
                </Pressable>
            </TextClassContext.Provider>
        );
    }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };


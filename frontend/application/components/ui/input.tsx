import { cn } from "@/lib/utils";
import * as React from "react";
import { TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
    className?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
    ({ className, placeholderTextColor, ...props }, ref) => {
        return (
            <TextInput
                ref={ref}
                placeholderTextColor={placeholderTextColor ?? "#9ca3af"}
                className={cn(
                    "h-12 rounded-lg border border-input bg-background px-4 text-base text-foreground",
                    "placeholder:text-muted-foreground",
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };


import { cn } from "@/lib/utils";
import * as React from "react";
import { Platform, TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
    className?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
    ({ className, placeholderTextColor, style, ...props }, ref) => {
        return (
            <TextInput
                ref={ref}
                placeholderTextColor={placeholderTextColor ?? "#9ca3af"}
                selectionColor="#3153A1"
                cursorColor="#3153A1"
                underlineColorAndroid="transparent"
                style={[
                    { fontFamily: "Montserrat_400Regular" },
                    Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined,
                    style,
                ]}
                className={cn(
                    "h-12 rounded-lg border border-input bg-background px-4 text-base text-foreground font-[Montserrat_400Regular]",
                    "placeholder:text-muted-foreground",
                    "focus:border-primary",
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


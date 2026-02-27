import { cn } from "@/lib/utils";
import * as React from "react";
import { Text as RNText, TextProps } from "react-native";

const TextClassContext = React.createContext<string | undefined>(undefined);

interface CustomTextProps extends TextProps {
    className?: string;
}

const Text = React.forwardRef<RNText, CustomTextProps>(
    ({ className, style, ...props }, ref) => {
        const textClass = React.useContext(TextClassContext);
        return (
            <RNText
                ref={ref}
                className={cn(
                    "text-base text-foreground web:select-text font-[Montserrat_400Regular]",
                    textClass,
                    className
                )}
                style={[{ fontFamily: "Montserrat_400Regular" }, style]}
                {...props}
            />
        );
    }
);

Text.displayName = "Text";

export { Text, TextClassContext };

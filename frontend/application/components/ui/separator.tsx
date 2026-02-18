import { cn } from "@/lib/utils";
import * as React from "react";
import { View, ViewProps } from "react-native";

interface SeparatorProps extends ViewProps {
    className?: string;
    orientation?: "horizontal" | "vertical";
}

const Separator = React.forwardRef<View, SeparatorProps>(
    ({ className, orientation = "horizontal", ...props }, ref) => {
        return (
            <View
                ref={ref}
                className={cn(
                    "bg-border",
                    orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
                    className
                )}
                {...props}
            />
        );
    }
);

Separator.displayName = "Separator";

export { Separator };
export type { SeparatorProps };


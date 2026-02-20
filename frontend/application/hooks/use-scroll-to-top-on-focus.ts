import { useFocusEffect } from "@react-navigation/native";
import { RefObject, useCallback } from "react";

type ScrollableRef = {
    scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
};

export function useScrollToTopOnFocus(ref: RefObject<ScrollableRef | null>) {
    useFocusEffect(
        useCallback(() => {
            const frame = requestAnimationFrame(() => {
                ref.current?.scrollTo({ y: 0, animated: false });
            });

            return () => cancelAnimationFrame(frame);
        }, [ref])
    );
}

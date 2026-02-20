import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

type AnimatedTabIconProps = {
    name: keyof typeof Ionicons.glyphMap;
    color: string;
    size: number;
    focused: boolean;
    pulseKey: number;
};

export default function AnimatedTabIcon({
    name,
    color,
    size,
    focused,
    pulseKey,
}: AnimatedTabIconProps) {
    const restingScale = focused ? 1.1 : 1;
    const scale = useRef(new Animated.Value(restingScale)).current;
    const hasMounted = useRef(false);

    useEffect(() => {
        Animated.spring(scale, {
            toValue: focused ? 1.1 : 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    }, [focused, scale]);

    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            return;
        }
        Animated.sequence([
            Animated.timing(scale, {
                toValue: 1.18,
                duration: 120,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: focused ? 1.1 : 1,
                useNativeDriver: true,
                speed: 22,
                bounciness: 9,
            }),
        ]).start();
    }, [pulseKey, focused, scale]);

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name={name} size={size} color={color} />
        </Animated.View>
    );
}

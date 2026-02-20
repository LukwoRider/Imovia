import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Animated, Easing, Pressable } from "react-native";
import { useNotificationBell } from "@/components/ui/notification-bell-context";

export default function NotificationBellButton() {
    const { active, toggle } = useNotificationBell();
    const scale = useRef(new Animated.Value(1)).current;
    const tilt = useRef(new Animated.Value(0)).current;

    const runAnimation = () => {
        scale.setValue(1);
        tilt.setValue(0);

        Animated.parallel([
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.12,
                    duration: 120,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 140,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            Animated.sequence([
                Animated.timing(tilt, {
                    toValue: 1,
                    duration: 80,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(tilt, {
                    toValue: -1,
                    duration: 80,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(tilt, {
                    toValue: 0,
                    duration: 80,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    };

    const handlePress = () => {
        toggle();
        runAnimation();
    };

    const rotate = tilt.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ["-12deg", "0deg", "12deg"],
    });

    return (
        <Pressable
            onPress={handlePress}
            style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
            }}
            hitSlop={6}
        >
            <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
                <Ionicons
                    name={active ? "notifications" : "notifications-outline"}
                    size={17}
                    color="#fff"
                />
            </Animated.View>
        </Pressable>
    );
}

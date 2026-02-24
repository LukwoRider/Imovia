import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable } from "react-native";

export default function ProfileHeaderButton() {
    const router = useRouter();
    const pathname = usePathname();
    const focused = pathname.endsWith("/profile");
    const scale = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: focused ? 1.1 : 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    }, [focused, scale]);

    const runPressAnimation = () => {
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
    };

    return (
        <Pressable
            onPress={() => {
                runPressAnimation();
                if (!focused) {
                    setTimeout(() => {
                        const baseGroup = pathname.startsWith("/proprietaire") ? "/proprietaire" : "/(locataire)";
                        router.push(`${baseGroup}/profile` as any);
                    }, 120);
                }
            }}
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
            <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons name="person" size={17} color="#fff" />
            </Animated.View>
        </Pressable>
    );
}

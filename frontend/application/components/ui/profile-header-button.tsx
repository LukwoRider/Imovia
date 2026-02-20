import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

export default function ProfileHeaderButton() {
    const router = useRouter();

    return (
        <Pressable
            onPress={() => router.push("/(locataire)/profile")}
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
            <Ionicons name="person" size={17} color="#fff" />
        </Pressable>
    );
}

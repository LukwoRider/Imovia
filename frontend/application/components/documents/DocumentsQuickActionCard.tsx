import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

type DocumentsQuickActionCardProps = {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export default function DocumentsQuickActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: DocumentsQuickActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        flex: 1,
        backgroundColor: "#f9fafb",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        alignItems: "center",
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: "#eef2ff",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon as any} size={18} color="#3153A1" />
      </View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "center",
          marginBottom: 4,
          fontFamily: "Montserrat_700Bold",
        }}
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: "#9ca3af",
          textAlign: "center",
          fontFamily: "Montserrat_400Regular",
        }}
        numberOfLines={2}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import type { Property } from "./types";

type PropertyCardProps = {
  item: Property;
  onPress: () => void;
};

export default function PropertyCard({ item, onPress }: PropertyCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        marginBottom: 14,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <View
        style={{
          width: "100%",
          height: 160,
          backgroundColor: "#c7cdd6",
          justifyContent: "flex-end",
        }}
      >
        {item.thumbnail && (
          <Image
            source={{ uri: item.thumbnail }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
          />
        )}

        {item.imagesCount > 0 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              paddingBottom: 10,
              gap: 5,
            }}
          >
            {Array.from({ length: Math.min(item.imagesCount, 5) }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === 0 ? "#3153A1" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#1e293b",
            marginBottom: 2,
            fontFamily: "Montserrat_600SemiBold",
          }}
          numberOfLines={1}
        >
          {item.adresse}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#9ca3af",
            marginBottom: 6,
            fontFamily: "Montserrat_400Regular",
          }}
        >
          {item.ville}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#3153A1",
                fontFamily: "Montserrat_700Bold",
              }}
            >
              {item.prix}€
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#9ca3af",
                fontFamily: "Montserrat_400Regular",
              }}
            >
              {" "}
              /mois
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="resize-outline" size={12} color="#9ca3af" />
              <Text style={{ fontSize: 11, color: "#6b7280", marginLeft: 3 }}>
                {item.surface}m²
              </Text>
            </View>
            {item.type ? (
              <View
                style={{
                  backgroundColor: "#eef2ff",
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: "#3153A1",
                    fontWeight: "600",
                    fontFamily: "Montserrat_600SemiBold",
                  }}
                >
                  {item.type}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

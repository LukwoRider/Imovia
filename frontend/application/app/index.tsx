import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <LinearGradient
        colors={["#1e3a6d", "#3153A1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 80,
          paddingBottom: 40,
          paddingHorizontal: 20,
          alignItems: "center",
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Image
          source={require("@/assets/images/logo-white.svg")}
          style={{ width: 120, height: 32, marginBottom: 8 }}
          contentFit="contain"
        />
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "700",
            fontFamily: "Montserrat_700Bold",
            marginTop: 4,
          }}
        >
          Bienvenue sur Imovia
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            marginTop: 6,
            fontFamily: "Montserrat_400Regular",
            textAlign: "center",
          }}
        >
          Choisissez votre espace pour commencer
        </Text>
      </LinearGradient>

      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 16, marginTop: -20 }}>
        <Pressable
          onPress={() => router.push("/(locataire)")}
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: "#eef2ff",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Ionicons name="person-outline" size={24} color="#3153A1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#1e293b",
                fontFamily: "Montserrat_700Bold",
              }}
            >
              Espace Locataire
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 2,
                fontFamily: "Montserrat_400Regular",
              }}
            >
              Accéder au tableau de bord locataire
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>

        <Pressable
          onPress={() => router.push("/(proprietaire)")}
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: "#eef2ff",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Ionicons name="key-outline" size={24} color="#3153A1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#1e293b",
                fontFamily: "Montserrat_700Bold",
              }}
            >
              Espace Propriétaire
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 2,
                fontFamily: "Montserrat_400Regular",
              }}
            >
              Accéder au tableau de bord propriétaire
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </Pressable>
      </View>
    </View>
  );
}

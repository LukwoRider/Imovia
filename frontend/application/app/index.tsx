import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { View } from "react-native";

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
          Connectez-vous pour commencer
        </Text>
      </LinearGradient>

      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 16, marginTop: -20 }}>
        <Button
          onPress={() => router.push("/login")}
          size="lg"
          className="rounded-2xl h-16 shadow-lg shadow-primary/20"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="log-in-outline" size={24} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', fontFamily: 'Montserrat_700Bold' }}>
              Se connecter
            </Text>
          </View>
        </Button>
      </View>
    </View>
  );
}

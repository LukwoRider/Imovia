import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, View } from "react-native";

type ProfileHeroProps = {
  onSignOut: () => void;
  isSigningOut: boolean;
};

export default function ProfileHero({
  onSignOut,
  isSigningOut,
}: ProfileHeroProps) {
  return (
    <LinearGradient
      colors={["#1e3a6d", "#3153A1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: 56,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Image
            source={require("@/assets/images/logo-white.svg")}
            style={{ width: 90, height: 24 }}
            contentFit="contain"
          />
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "700",
              marginTop: 4,
              fontFamily: "Montserrat_700Bold",
            }}
          >
            Mon profil
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              marginTop: 3,
              fontFamily: "Montserrat_400Regular",
            }}
          >
            Gerez vos informations personnelles
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <NotificationBellButton />
          <Pressable
            onPress={onSignOut}
            disabled={isSigningOut}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              opacity: isSigningOut ? 0.6 : 1,
            }}
            hitSlop={6}
          >
            <Feather name="log-out" size={17} color="#fff" />
          </Pressable>
          <ProfileHeaderButton />
        </View>
      </View>
    </LinearGradient>
  );
}

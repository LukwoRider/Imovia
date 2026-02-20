import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";

const AVATAR_SOURCE = require("@/assets/images/profile-man.png");

function InfoField({
  icon,
  value,
  onChangeText,
  placeholder,
  split,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  split?: boolean;
}) {
  return (
    <View
      className={`h-12 rounded-xl border border-[#D7D9DE] bg-[#F7F7F8] px-3 flex-row items-center ${
        split ? "flex-1 min-w-0" : ""
      }`}
    >
      <Feather name={icon} size={18} color="#3158B8" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7A7D85"
        className="flex-1 ml-2 text-[15px] text-[#1C2233]"
        style={{ minWidth: 0, flexShrink: 1 }}
      />
    </View>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [firstName, setFirstName] = useState("David");
  const [lastName, setLastName] = useState("Martin");
  const [email, setEmail] = useState("David.martin@imovia.com");
  const [phone, setPhone] = useState("+33 6 24 87 12 97");
  const [address, setAddress] = useState("Rue des Marais; 73000 Paris");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  useScrollToTopOnFocus(scrollViewRef);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Erreur", "Impossible de se deconnecter pour le moment.");
      setIsSigningOut(false);
      return;
    }

    router.replace("/login");
    setIsSigningOut(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
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
                onPress={handleSignOut}
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

        <View className="px-4 mt-5 gap-4">
          <View className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
            <View className="px-4 py-4 flex-row items-center border-b border-[#f3f4f6]">
              <View className="h-10 w-10 rounded-xl border border-[#e5e7eb] items-center justify-center bg-[#eef2ff]">
                <Feather name="user" size={18} color="#3158B8" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[#1C2233] text-[18px] leading-[22px] font-bold">
                  Informations personnelles
                </Text>
                <Text className="text-[#6b7280] text-[12px] mt-1">
                  Informations de contacts
                </Text>
              </View>
            </View>

            <View className="px-4 py-4 gap-3">
              <View className="items-center mb-3">
                <Image
                  source={AVATAR_SOURCE}
                  style={{ width: 104, height: 104, borderRadius: 52 }}
                  contentFit="cover"
                />
              </View>

              <View className="flex-row gap-3">
                <InfoField
                  icon="user"
                  split
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Prenom"
                />
                <InfoField
                  icon="user"
                  split
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Nom"
                />
              </View>

              <InfoField
                icon="mail"
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
              />
              <InfoField
                icon="phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="Telephone"
              />
              <InfoField
                icon="map-pin"
                value={address}
                onChangeText={setAddress}
                placeholder="Adresse"
              />

              <Button className="h-12 mt-2 rounded-xl">
                <View className="flex-row items-center gap-2">
                  <Feather name="save" size={16} color="#FFFFFF" />
                  <Text className="text-white text-[14px] font-semibold">
                    Enregistrer
                  </Text>
                </View>
              </Button>

              <Text className="text-center text-[#7A7D85] text-[14px]">
                Ces informations resteront strictement confidentielles
              </Text>
            </View>
          </View>

          <View className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
            <View className="px-4 py-4 flex-row items-center border-b border-[#f3f4f6]">
              <View className="h-10 w-10 rounded-xl border border-[#e5e7eb] items-center justify-center bg-[#eef2ff]">
                <Feather name="lock" size={18} color="#3158B8" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[#1C2233] text-[18px] leading-[22px] font-bold">
                  Securite du compte
                </Text>
                <Text className="text-[#6b7280] text-[12px] mt-1">
                  Modifier votre mot de passe
                </Text>
              </View>
            </View>

            <View className="px-4 py-4 gap-3">
              <Input
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Votre mot de passe actuel"
                secureTextEntry
                className="h-12 rounded-xl border-[#D7D9DE] bg-[#F7F7F8] text-[15px]"
              />
              <Input
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nouveau mot de passe"
                secureTextEntry
                className="h-12 rounded-xl border-[#D7D9DE] bg-[#F7F7F8] text-[15px]"
              />
              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmer votre mot de passe"
                secureTextEntry
                className="h-12 rounded-xl border-[#D7D9DE] bg-[#F7F7F8] text-[15px]"
              />

              <Button className="h-12 mt-2 rounded-xl">
                <View className="flex-row items-center gap-2">
                  <Feather name="save" size={16} color="#FFFFFF" />
                  <Text className="text-white text-[14px] font-semibold">
                    Enregistrer
                  </Text>
                </View>
              </Button>

              <Text className="text-center text-[#7A7D85] text-[14px]">
                Ces informations resteront strictement confidentielles
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

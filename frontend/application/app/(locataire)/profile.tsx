import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

const AVATAR_URI =
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80";

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
      className={`h-14 rounded-2xl border border-[#D7D9DE] bg-[#F7F7F8] px-4 flex-row items-center ${
        split ? "flex-1 min-w-0" : ""
      }`}
    >
      <Feather name={icon} size={20} color="#3158B8" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7A7D85"
        className="flex-1 ml-3 text-[17px] text-[#1C2233]"
        style={{ minWidth: 0, flexShrink: 1 }}
      />
    </View>
  );
}

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("David");
  const [lastName, setLastName] = useState("Martin");
  const [email, setEmail] = useState("David.martin@imovia.com");
  const [phone, setPhone] = useState("+33 6 24 87 12 97");
  const [address, setAddress] = useState("Rue des Marais; 73000 Paris");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView
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
              <ProfileHeaderButton />
            </View>
          </View>
        </LinearGradient>

        <View className="px-5 mt-4 gap-6">
          <View className="mx-1 rounded-3xl border border-[#D0D2D8] bg-[#F1F1F3] shadow-sm overflow-hidden">
            <View className="px-5 py-6 flex-row items-center border-b border-[#D0D2D8]">
              <View className="h-16 w-16 rounded-2xl border border-[#C8CAD1] items-center justify-center bg-[#F4F4F6]">
                <Feather name="user" size={25} color="#3158B8" />
              </View>
              <View className="ml-4">
                <Text className="text-[#1C2233] text-[36px] leading-[40px] font-bold">
                  Informations personnelles
                </Text>
                <Text className="text-[#434C63] text-[18px] mt-1">
                  Informations de contacts
                </Text>
              </View>
            </View>

            <View className="px-5 py-8 gap-4">
              <View className="items-center mb-4">
                <Image
                  source={{ uri: AVATAR_URI }}
                  style={{ width: 140, height: 140, borderRadius: 70 }}
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

              <Button className="h-16 mt-4 rounded-2xl">
                <View className="flex-row items-center gap-2">
                  <Feather name="save" size={22} color="#FFFFFF" />
                  <Text className="text-white text-[38px] leading-[42px] font-semibold">
                    Enregistrer
                  </Text>
                </View>
              </Button>

              <Text className="text-center text-[#7A7D85] text-[14px]">
                Ces informations resteront strictement confidentielles
              </Text>
            </View>
          </View>

          <View className="mx-1 rounded-3xl border border-[#D0D2D8] bg-[#F1F1F3] shadow-sm overflow-hidden">
            <View className="px-5 py-6 flex-row items-center border-b border-[#D0D2D8]">
              <View className="h-16 w-16 rounded-2xl border border-[#C8CAD1] items-center justify-center bg-[#F4F4F6]">
                <Feather name="lock" size={25} color="#3158B8" />
              </View>
              <View className="ml-4">
                <Text className="text-[#1C2233] text-[36px] leading-[40px] font-bold">
                  Informations personnelles
                </Text>
                <Text className="text-[#434C63] text-[18px] mt-1">
                  Modifier votre mot de passe
                </Text>
              </View>
            </View>

            <View className="px-5 py-8 gap-4">
              <Input
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Votre mot de passe actuel"
                secureTextEntry
                className="h-14 rounded-2xl border-[#D7D9DE] bg-[#F7F7F8] text-[17px]"
              />
              <Input
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nouveau mot de passe"
                secureTextEntry
                className="h-14 rounded-2xl border-[#D7D9DE] bg-[#F7F7F8] text-[17px]"
              />
              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirmer votre mot de passe"
                secureTextEntry
                className="h-14 rounded-2xl border-[#D7D9DE] bg-[#F7F7F8] text-[17px]"
              />

              <Button className="h-16 mt-4 rounded-2xl">
                <View className="flex-row items-center gap-2">
                  <Feather name="save" size={22} color="#FFFFFF" />
                  <Text className="text-white text-[38px] leading-[42px] font-semibold">
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

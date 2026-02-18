import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const AVATAR_URI =
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80";

function CabinetIcon({ color = "#727682" }: { color?: string }) {
  return (
    <View style={styles.cabinetWrap}>
      <View style={[styles.cabinetSide, styles.cabinetSideLeft, { borderColor: color }]} />
      <View style={[styles.cabinetSide, styles.cabinetSideRight, { borderColor: color }]} />
      <View style={[styles.cabinetMain, { borderColor: color }]}>
        <View style={[styles.cabinetLine, { backgroundColor: color }]} />
        <View style={[styles.cabinetLine, { backgroundColor: color }]} />
        <View style={[styles.cabinetLine, { backgroundColor: color }]} />
        <View style={[styles.cabinetLine, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

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
    <SafeAreaView className="flex-1 bg-[#ECECF2]">
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View style={styles.header}>
            <View style={styles.shapeTop} />
            <View style={styles.shapeBottom} />

            <View className="px-6 pb-4 pt-2">
              <View className="items-end">
                <View className="relative">
                  <Image
                    source={{ uri: AVATAR_URI }}
                    style={{ width: 78, height: 78, borderRadius: 39 }}
                    contentFit="cover"
                  />
                  <View className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-red-600 items-center justify-center">
                    <Text className="text-white text-xs font-semibold">2</Text>
                  </View>
                </View>
              </View>

              <Image
                source={require("@/assets/images/logo-white.svg")}
                style={{ width: 156, height: 48 }}
                contentFit="contain"
                className="-mt-2"
              />
              <Text className="text-white text-[48px] leading-[52px] font-bold mt-1">
                Profile
              </Text>
              <Text className="text-white text-[18px] leading-7 mt-1 max-w-[300px]">
                Suivez et gérez tous les incidents signalés dans votre logement.
              </Text>
            </View>
          </View>

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
                    placeholder="Prénom"
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
                  placeholder="Téléphone"
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

        <View className="absolute bottom-0 left-0 right-0 bg-[#F4F4F6] border-t border-[#DADCE2] px-2 pt-3 pb-5 flex-row justify-around">
          <View className="items-center gap-1">
            <Feather name="pie-chart" size={23} color="#727682" />
            <Text className="text-[#727682] text-[12px]">Accueil</Text>
          </View>
          <View className="items-center gap-1">
            <CabinetIcon color="#727682" />
            <Text className="text-[#727682] text-[12px]">Biens</Text>
          </View>
          <View className="items-center gap-1">
            <Feather name="home" size={23} color="#727682" />
            <Text className="text-[#727682] text-[12px]">Mon logement</Text>
          </View>
          <View className="items-center gap-1">
            <Feather name="file-text" size={23} color="#727682" />
            <Text className="text-[#727682] text-[12px]">Documents</Text>
          </View>
          <View className="items-center gap-1">
            <Feather name="alert-circle" size={23} color="#727682" />
            <Text className="text-[#727682] text-[12px]">Incidents</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "relative",
    backgroundColor: "#0F3593",
    overflow: "hidden",
  },
  shapeTop: {
    position: "absolute",
    top: -160,
    left: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "#17A4DD",
    opacity: 0.55,
  },
  shapeBottom: {
    position: "absolute",
    right: -120,
    top: 10,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#071E7A",
    opacity: 0.7,
  },
  cabinetWrap: {
    width: 24,
    height: 24,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  cabinetMain: {
    width: 12,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 3,
  },
  cabinetSide: {
    position: "absolute",
    width: 5,
    height: 12,
    borderWidth: 2,
    borderRadius: 3,
    top: 8,
  },
  cabinetSideLeft: {
    left: 0,
  },
  cabinetSideRight: {
    right: 0,
  },
  cabinetLine: {
    width: 6,
    height: 2,
    borderRadius: 1,
  },
});


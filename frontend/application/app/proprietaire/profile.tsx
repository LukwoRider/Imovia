import ProfileInfoField from "@/components/profile/ProfileInfoField";
import ProfileSectionCard from "@/components/profile/ProfileSectionCard";
import { Button } from "@/components/ui/button";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";

const AVATAR_SOURCE = require("@/assets/images/profile-man.png");

export default function ProprietaireProfilePage() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    useScrollToTopOnFocus(scrollViewRef);

    const [agencyName, setAgencyName] = useState("");
    const [email, setEmail] = useState("");
    const [siret, setSiret] = useState("");
    const [phone, setPhone] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            setEmail(user.email || "");

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            if (error) throw error;
            if (!profile) return;

            setAgencyName(profile.full_name || "");
            setPhone(profile.phone || "");
            setSiret(String((profile as any).siret || ""));
        } catch (error) {
            console.error("[OwnerProfile] Fetch error:", error);
        }
    }

    async function handleSignOut() {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.replace("/login");
        } catch (error: any) {
            console.error("[OwnerProfile] SignOut error:", error);
            Alert.alert("Erreur", "Impossible de se deconnecter : " + (error.message || "Erreur inconnue"));
        } finally {
            setIsSigningOut(false);
        }
    }

    async function handleUpdateProfile() {
        setIsUpdatingProfile(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("Utilisateur non trouve");

            const payload: any = {
                full_name: agencyName.trim(),
                phone,
            };

            if (siret.trim()) {
                payload.siret = siret.trim();
            } else {
                payload.siret = null;
            }

            let { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

            // Fallback if the database does not have the `siret` column yet.
            if (error && String(error.message || "").toLowerCase().includes("siret")) {
                const retry = await supabase
                    .from("profiles")
                    .update({
                        full_name: agencyName.trim(),
                        phone,
                    })
                    .eq("id", user.id);
                error = retry.error;
            }

            if (error) throw error;
            Alert.alert("Succes", "Votre profil a ete mis a jour.");
        } catch (error: any) {
            console.error("[OwnerProfile] Update profile error:", error);
            Alert.alert("Erreur", "Impossible de mettre a jour le profil : " + (error.message || "Erreur inconnue"));
        } finally {
            setIsUpdatingProfile(false);
        }
    }

    async function handleUpdatePassword() {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            Alert.alert("Succes", "Votre mot de passe a ete mis a jour.");
        } catch (error: any) {
            console.error("[OwnerProfile] Update password error:", error);
            Alert.alert("Erreur", "Impossible de mettre a jour le mot de passe : " + (error.message || "Erreur inconnue"));
        } finally {
            setIsUpdatingPassword(false);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f3f4f8" }}>
            <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <LinearGradient
                    colors={["#18A6E3", "#0D51C5", "#0A2B97"]}
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
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                            <Image source={require("@/assets/images/logo-white.svg")} style={{ width: 90, height: 24 }} contentFit="contain" />
                            <Text style={{ color: "#fff", fontSize: 20, marginTop: 4, fontFamily: "Montserrat_700Bold" }}>
                                Profile
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 3, fontFamily: "Montserrat_400Regular" }}>
                                Gerez vos informations personnelles et vos parametres
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
                    <ProfileSectionCard
                        icon="user"
                        title="Informations personnelles"
                        subtitle="Informations de contacts"
                    >
                        <View className="items-center mb-3">
                            <Image source={AVATAR_SOURCE} style={{ width: 104, height: 104, borderRadius: 52 }} contentFit="cover" />
                        </View>

                        <ProfileInfoField
                            icon="user"
                            value={agencyName}
                            onChangeText={setAgencyName}
                            placeholder="Nom agence"
                        />
                        <ProfileInfoField
                            icon="mail"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                        />
                        <ProfileInfoField
                            icon="settings"
                            value={siret}
                            onChangeText={setSiret}
                            placeholder="SIRET"
                        />
                        <ProfileInfoField
                            icon="phone"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Telephone"
                        />

                        <Button className="h-12 mt-2 rounded-xl" onPress={handleUpdateProfile} disabled={isUpdatingProfile}>
                            <View className="flex-row items-center gap-2">
                                <Feather name="save" size={16} color="#FFFFFF" />
                                <Text className="text-white text-[14px] font-semibold">
                                    {isUpdatingProfile ? "Enregistrement..." : "Enregistrer"}
                                </Text>
                            </View>
                        </Button>

                        <Text className="text-center text-[#7A7D85] text-[14px]">
                            Ces informations resteront strictement confidentielles
                        </Text>
                    </ProfileSectionCard>

                    <ProfileSectionCard
                        icon="lock"
                        title="Informations personnelles"
                        subtitle="Modifier votre mot de passe"
                    >
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

                        <Button className="h-12 mt-2 rounded-xl" onPress={handleUpdatePassword} disabled={isUpdatingPassword}>
                            <View className="flex-row items-center gap-2">
                                <Feather name="save" size={16} color="#FFFFFF" />
                                <Text className="text-white text-[14px] font-semibold">
                                    {isUpdatingPassword ? "Mise a jour..." : "Enregistrer"}
                                </Text>
                            </View>
                        </Button>

                        <Text className="text-center text-[#7A7D85] text-[14px]">
                            Ces informations resteront strictement confidentielles
                        </Text>
                    </ProfileSectionCard>
                </View>
            </ScrollView>
        </View>
    );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    View,
} from "react-native";

export default function RegisterAgencyPage() {
    const router = useRouter();
    const [agencyName, setAgencyName] = useState("");
    const [siret, setSiret] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("+33");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
        >
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 32,
                    paddingVertical: 48,
                }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="items-center mb-8">
                    <Image
                        source={require("@/assets/images/logo.svg")}
                        style={{ width: 220, height: 58 }}
                        contentFit="contain"
                    />

                    <Text className="text-2xl font-bold text-foreground mt-4">
                        Créer un compte
                    </Text>

                    <Text className="text-sm text-muted-foreground text-center mt-2 px-4">
                        Entrez vos informations ci-dessous pour créer votre compte
                    </Text>
                </View>

                <View className="gap-6 mb-4">
                    <View style={{ marginBottom: 10 }}>
                        <Text className="text-sm font-semibold text-foreground mb-1.5">
                            Nom de l'agence
                        </Text>
                        <Input
                            placeholder="Nom de l'agence"
                            value={agencyName}
                            onChangeText={setAgencyName}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={{ marginBottom: 10 }}>
                        <Text className="text-sm font-semibold text-foreground mb-1.5">
                            Siret
                        </Text>
                        <Input
                            placeholder="Votre siret"
                            value={siret}
                            onChangeText={setSiret}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={{ marginBottom: 10 }}>
                        <Text className="text-sm font-semibold text-foreground mb-1.5">
                            Email
                        </Text>
                        <Input
                            placeholder="nom@exemple.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    <View style={{ marginBottom: 10 }}>
                        <Text className="text-sm font-semibold text-foreground mb-1.5">
                            Numéro de téléphone
                        </Text>
                        <Input
                            placeholder="+33"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            autoComplete="tel"
                        />
                    </View>

                    <View style={{ marginBottom: 10 }}>
                        <Text className="text-sm font-semibold text-foreground mb-1.5">
                            Mot de passe
                        </Text>
                        <Input
                            placeholder="Votre mot de passe"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="new-password"
                        />
                    </View>

                    <View style={{ marginBottom: 10 }}>
                        <Text className="text-sm font-semibold text-foreground mb-1.5">
                            Confirmer le mot de passe
                        </Text>
                        <Input
                            placeholder="Confirmez votre mot de passe"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="new-password"
                        />
                    </View>

                    <Button
                        onPress={() => {
                            // TODO: implement agency registration logic
                        }}
                    >
                        <Text>Créer votre compte</Text>
                    </Button>
                </View>

                <View className="flex-row items-center my-4">
                    <Separator className="flex-1" />
                    <Text className="mx-4 text-xs text-muted-foreground tracking-widest uppercase">
                        ou continuer avec
                    </Text>
                    <Separator className="flex-1" />
                </View>

                <Button
                    variant="outline"
                    onPress={() => router.replace("/login")}
                    className="mb-6"
                >
                    <Text>Se connecter</Text>
                </Button>

                <View className="items-center mt-2">
                    <Text className="text-xs text-muted-foreground text-center leading-5">
                        En cliquant sur continuer, vous acceptez nos{" "}
                        <Text className="text-xs text-foreground underline">
                            Conditions d'utilisation
                        </Text>{" "}
                        et{" "}
                        <Text className="text-xs text-foreground underline">
                            Politique de confidentialité
                        </Text>
                        .
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

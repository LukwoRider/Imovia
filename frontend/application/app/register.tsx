import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

interface RoleCardProps {
    title: string;
    description: string;
    onPress: () => void;
}

function RoleCard({ title, description, onPress }: RoleCardProps) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center border border-input rounded-lg px-4 py-5 bg-background active:bg-primary/5"
        >
            <View className="w-10 h-10 rounded-lg border border-input items-center justify-center mr-4">
                <Text className="text-muted-foreground text-lg">⌂</Text>
            </View>
            <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                    {title}
                </Text>
                <Text className="text-sm text-muted-foreground mt-0.5">
                    {description}
                </Text>
            </View>
        </Pressable>
    );
}

export default function RegisterPage() {
    const router = useRouter();

    return (
        <ScrollView
            contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                paddingHorizontal: 32,
                paddingVertical: 48,
            }}
            className="flex-1 bg-background"
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
                    Sélectionnez votre profil pour créer votre compte
                </Text>
            </View>

            <View className="gap-3 mb-4">
                <RoleCard
                    title="Locataire"
                    description="Je cherche un logement ou je suis déjà locataire"
                    onPress={() => router.push({ pathname: "/register-form", params: { role: "tenant" } })}
                />

                <RoleCard
                    title="Propriétaire"
                    description="Je possède un ou plusieurs biens à louer"
                    onPress={() => router.push({ pathname: "/register-form", params: { role: "owner" } })}
                />

                <RoleCard
                    title="Agence"
                    description="Je gère des biens pour des propriétaires"
                    onPress={() => router.push("/register-agency" as any)}
                />
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
    );
}

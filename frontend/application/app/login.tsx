import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-8">
          <Image
            source={require("@/assets/images/logo.svg")}
            style={{ width: 220, height: 58 }}
            contentFit="contain"
          />

          {/* Title */}
          <Text className="text-2xl font-bold text-foreground mt-4">
            Connectez-vous à un compte
          </Text>

          {/* Subtitle */}
          <Text className="text-sm text-muted-foreground text-center mt-2 px-4">
            Entrez votre email ci-dessous pour vous connecter à votre compte
          </Text>
        </View>

        {/* Form */}
        <View className="gap-3 mb-4">
          <Input
            placeholder="Votre email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            placeholder="Votre mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />

          <Button
            onPress={() => {
              // TODO: implement login logic
            }}
          >
            <Text>Se connecter</Text>
          </Button>
        </View>

        {/* Separator with text */}
        <View className="flex-row items-center my-4">
          <Separator className="flex-1" />
          <Text className="mx-4 text-xs text-muted-foreground tracking-widest uppercase">
            ou continuer avec
          </Text>
          <Separator className="flex-1" />
        </View>

        {/* Registration button */}
        <Button
          variant="outline"
          onPress={() => {
            // TODO: navigate to registration
          }}
          className="mb-6"
        >
          <Text>S'inscrire</Text>
        </Button>

        {/* Legal text */}
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

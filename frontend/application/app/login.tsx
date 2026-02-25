import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import {
  isValidSignupEmail,
  sanitizeSignupEmailInput,
  SIGNUP_EMAIL_ERROR_MESSAGE,
} from "@/lib/phone-validation";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

export default function LoginPage() {
  const { signupSuccess } = useLocalSearchParams<{ signupSuccess?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function showError(title: string, message: string) {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(message);
      return;
    }
    Alert.alert(title, message);
  }

  useEffect(() => {
    if (signupSuccess !== "1") return;

    const message =
      "Compte créé avec succès. Vous pouvez maintenant vous connecter.";

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(message);
    } else {
      Alert.alert("Compte créé", message);
    }

    router.replace("/login");
  }, [signupSuccess, router]);

  async function handleLogin() {
    if (!email || !password) {
      if (!email) setEmailError("Veuillez renseigner votre email.");
      if (!password) setPasswordError("Veuillez renseigner votre mot de passe.");
      showError("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    if (!isValidSignupEmail(email)) {
      setEmailError(SIGNUP_EMAIL_ERROR_MESSAGE);
      showError("Erreur", SIGNUP_EMAIL_ERROR_MESSAGE);
      return;
    }

    setEmailError("");
    setPasswordError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const isInvalidCredentials =
        error.message?.toLowerCase().includes("invalid login credentials") ||
        error.message?.toLowerCase().includes("invalid credentials");

      const message = isInvalidCredentials
        ? "Email ou mot de passe incorrect."
        : error.message;

      setPasswordError(isInvalidCredentials ? "Email ou mot de passe incorrect." : "");
      showError("Erreur de connexion", message);
      setLoading(false);
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Image
            source={require("@/assets/images/logo.svg")}
            style={{ width: 220, height: 58 }}
            contentFit="contain"
          />

          <Text className="text-2xl font-bold text-foreground mt-4">
            Connectez-vous à un compte
          </Text>

          <Text className="text-sm text-muted-foreground text-center mt-2 px-4">
            Entrez votre email ci-dessous pour vous connecter à votre compte
          </Text>
        </View>

        <View className="gap-3 mb-4">
          <Input
            placeholder="Votre email"
            value={email}
            onChangeText={(value) => {
              setEmail(sanitizeSignupEmailInput(value));
              if (emailError) setEmailError("");
            }}
            onBlur={() => {
              if (email && !isValidSignupEmail(email)) {
                setEmailError(SIGNUP_EMAIL_ERROR_MESSAGE);
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {emailError ? (
            <Text className="text-xs text-red-500">{emailError}</Text>
          ) : null}

          <Input
            placeholder="Votre mot de passe"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (passwordError) setPasswordError("");
            }}
            onBlur={() => {
              if (!password) {
                setPasswordError("Veuillez renseigner votre mot de passe.");
              }
            }}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />
          {passwordError ? (
            <Text className="text-xs text-red-500">{passwordError}</Text>
          ) : null}

          <Button
            onPress={handleLogin}
            disabled={loading}
          >
            <Text>{loading ? "Connexion..." : "Se connecter"}</Text>
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
          onPress={() => router.push("/register")}
          className="mb-6"
        >
          <Text>S'inscrire</Text>
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

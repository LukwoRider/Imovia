import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Dimensions, Pressable, ScrollView, View } from "react-native";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} bounces={false} showsVerticalScrollIndicator={false}>
      <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <View className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden">
          <LinearGradient
            colors={["#EEF2FF", "#FFFFFF"]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            className="absolute -top-20 -right-20 w-80 h-80 bg-blue-100 rounded-full"
            style={{ opacity: 0.5, filter: 'blur(60px)' } as any}
          />
          <View
            className="absolute top-40 -left-20 w-72 h-72 bg-indigo-100 rounded-full"
            style={{ opacity: 0.4, filter: 'blur(50px)' } as any}
          />
        </View>

        <View className="pt-20 px-6 pb-20">
          <View className="items-center mb-12">
            <Image
              source={require("@/assets/images/logo.svg")}
              style={{ width: 100, height: 28 }}
              contentFit="contain"
            />
          </View>

          <View className="items-center mb-10">
            <Text className="text-[38px] font-bold text-[#1e293b] text-center leading-[46px] font-[Montserrat_700Bold]">
              Gérez vos biens{"\n"}immobiliers avec{" "}
              <Text className="text-[#3153A1]">excellence.</Text>
            </Text>
            <Text className="text-[16px] text-[#64748b] text-center mt-4 px-4 leading-[24px] font-[Montserrat_400Regular]">
              La plateforme tout-en-un pour les propriétaires, locataires et agences.
            </Text>
          </View>

          <View className="relative h-[340px] items-center justify-center mb-12">
            <View
              style={{
                width: width * 0.8,
                backgroundColor: '#fff',
                borderRadius: 24,
                padding: 20,
                shadowColor: '#3153A1',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.1,
                shadowRadius: 30,
                elevation: 10,
                borderWidth: 1,
                borderColor: '#f1f5f9',
                transform: [{ perspective: 1000 }, { rotateX: '5deg' }, { rotateY: '-5deg' }]
              }}
            >
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center">
                    <View className="w-5 h-5 rounded-full bg-[#3153A1]" />
                  </View>
                  <View className="gap-1">
                    <View className="w-16 h-2 bg-slate-200 rounded" />
                    <View className="w-10 h-1.5 bg-slate-100 rounded" />
                  </View>
                </View>
                <View className="flex-row gap-1.5">
                  <View className="w-6 h-6 rounded bg-slate-50" />
                  <View className="w-6 h-6 rounded bg-slate-50" />
                </View>
              </View>

              <View className="flex-row gap-3 mb-6">
                <View className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Feather name="trending-up" size={12} color="#08CB56" />
                    <View className="w-12 h-2 bg-slate-200 rounded" />
                  </View>
                  <View className="w-20 h-5 bg-slate-800 rounded-sm mb-1.5" />
                  <View className="w-14 h-2 bg-green-100 rounded" />
                </View>
                <View className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Feather name="users" size={12} color="#3153A1" />
                    <View className="w-10 h-2 bg-slate-200 rounded" />
                  </View>
                  <View className="w-10 h-5 bg-slate-800 rounded-sm mb-1.5" />
                  <View className="w-16 h-2 bg-slate-100 rounded" />
                </View>
              </View>

              <View className="gap-2.5">
                {[1, 2].map(i => (
                  <View key={i} className="flex-row items-center justify-between p-2.5 rounded-lg border border-slate-50">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-7 h-7 rounded-full bg-slate-100" />
                      <View className="gap-1">
                        <View className="w-20 h-2 bg-slate-200 rounded" />
                        <View className="w-12 h-1.5 bg-slate-50 rounded" />
                      </View>
                    </View>
                    <View className="w-10 h-2 bg-green-50 rounded-full" />
                  </View>
                ))}
              </View>
            </View>

            <View
              style={{
                position: 'absolute',
                top: 40,
                right: 10,
                backgroundColor: '#fff',
                padding: 12,
                borderRadius: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
                elevation: 5,
                flexDirection: 'row',
                gap: 10,
                width: 160,
                zIndex: 20
              }}
            >
              <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center">
                <Ionicons name="checkmark-circle" size={18} color="#08CB56" />
              </View>
              <View className="gap-1">
                <View className="w-16 h-2 bg-slate-800 rounded" />
                <View className="w-20 h-1.5 bg-slate-400 rounded" />
              </View>
            </View>
          </View>

          <View className="gap-4">
            <Button
              onPress={() => router.push("/register")}
              size="lg"
              className="bg-[#3153A1] rounded-2xl h-16 shadow-xl shadow-[#3153A1]/20 active:scale-[0.98]"
            >
              <Text className="text-white text-[17px] font-bold font-[Montserrat_700Bold]">
                Commencer gratuitement
              </Text>
            </Button>

            <Pressable
              onPress={() => router.push("/login")}
              className="h-14 items-center justify-center active:bg-slate-50 rounded-2xl"
            >
              <Text className="text-[#3153A1] text-[16px] font-semibold font-[Montserrat_600SemiBold]">
                Se connecter
              </Text>
            </Pressable>
          </View>

          <View className="flex-row justify-center gap-6 mt-10">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={18} color="#08CB56" />
              <Text className="text-[13px] text-[#64748b] font-[Montserrat_500Medium]">Sans engagement</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="shield-checkmark" size={18} color="#08CB56" />
              <Text className="text-[13px] text-[#64748b] font-[Montserrat_500Medium]">100% Sécurisé</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

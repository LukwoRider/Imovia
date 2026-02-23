import { Text } from "@/components/ui/text";
import { Feather } from "@expo/vector-icons";
import { ReactNode } from "react";
import { View } from "react-native";

type ProfileSectionCardProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function ProfileSectionCard({
  icon,
  title,
  subtitle,
  children,
}: ProfileSectionCardProps) {
  return (
    <View className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
      <View className="px-4 py-4 flex-row items-center border-b border-[#f3f4f6]">
        <View className="h-10 w-10 rounded-xl border border-[#e5e7eb] items-center justify-center bg-[#eef2ff]">
          <Feather name={icon} size={18} color="#3158B8" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[#1C2233] text-[18px] leading-[22px] font-bold">
            {title}
          </Text>
          <Text className="text-[#6b7280] text-[12px] mt-1">{subtitle}</Text>
        </View>
      </View>

      <View className="px-4 py-4 gap-3">{children}</View>
    </View>
  );
}

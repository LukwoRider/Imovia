import { Feather } from "@expo/vector-icons";
import { TextInput, View } from "react-native";

type ProfileInfoFieldProps = {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  split?: boolean;
};

export default function ProfileInfoField({
  icon,
  value,
  onChangeText,
  placeholder,
  split,
}: ProfileInfoFieldProps) {
  return (
    <View
      className={`h-12 rounded-xl border border-[#D7D9DE] bg-[#F7F7F8] px-3 flex-row items-center ${split ? "flex-1 min-w-0" : ""
        }`}
    >
      <Feather name={icon} size={18} color="#3158B8" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7A7D85"
        className="flex-1 ml-2 text-[15px] text-[#1C2233] font-[Montserrat_400Regular]"
        style={{ minWidth: 0, flexShrink: 1, fontFamily: "Montserrat_400Regular" }}
      />
    </View>
  );
}

import { Text } from "@/components/ui/text";
import { View } from "react-native";

export default function LogementPage() {
    return (
        <View className="flex-1 bg-background items-center justify-center px-8">
            <Text className="text-xl font-bold text-foreground">Mon logement</Text>
            <Text className="text-sm text-muted-foreground mt-2 text-center">
                Cette page sera bientôt disponible
            </Text>
        </View>
    );
}

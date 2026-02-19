import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LocataireLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#3153A1",
                tabBarInactiveTintColor: "#7a7a7a",
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 0,
                    borderWidth: 1,
                    borderColor: "#ececec",
                    borderRadius: 18,
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: 8,
                    paddingTop: 8,
                    paddingBottom: 10 + insets.bottom,
                    height: 74 + insets.bottom,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarItemStyle: {
                    paddingTop: 1,
                    paddingBottom: 2,
                },
                tabBarLabelStyle: {
                    fontSize: 9,
                    lineHeight: 12,
                    fontWeight: "500",
                    marginTop: 2,
                    includeFontPadding: false,
                },
                sceneStyle: {
                    backgroundColor: "#f9fafb",
                    paddingBottom: 90 + insets.bottom,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Accueil",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="time-outline" size={21} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="biens"
                options={{
                    title: "Biens",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="business-outline" size={21} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="logement"
                options={{
                    title: "Mon logement",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="home-outline" size={20} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="documents"
                options={{
                    title: "Documents",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="document-outline" size={20} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="incidents"
                options={{
                    title: "Incidents",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="flame-outline" size={20} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

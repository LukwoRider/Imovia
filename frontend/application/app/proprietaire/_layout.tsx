import AnimatedTabIcon from "@/components/ui/animated-tab-icon";
import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProprietaireLayout() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [tabPulse, setTabPulse] = useState({
        index: 0,
        biens: 0,
        logement: 0,
        documents: 0,
        incidents: 0,
    });

    const bumpTabPulse = (tab: keyof typeof tabPulse) => {
        setTabPulse((prev) => ({ ...prev, [tab]: prev[tab] + 1 }));
    };

    const ownerTabPress = (tab: keyof typeof tabPulse, path: string) => (e: any) => {
        e.preventDefault();
        bumpTabPulse(tab);
        router.replace(path as any);
    };

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                popToTopOnBlur: true,
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
                    href: "/proprietaire" as any,
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon name="time-outline" size={21} color={color} focused={focused} pulseKey={tabPulse.index} />
                    ),
                }}
                listeners={{ tabPress: ownerTabPress("index", "/proprietaire") }}
            />
            <Tabs.Screen
                name="biens"
                options={{
                    title: "Biens",
                    href: "/proprietaire/biens" as any,
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon name="business-outline" size={21} color={color} focused={focused} pulseKey={tabPulse.biens} />
                    ),
                }}
                listeners={{ tabPress: ownerTabPress("biens", "/proprietaire/biens") }}
            />
            <Tabs.Screen
                name="logement"
                options={{
                    title: "Mes locations",
                    href: "/proprietaire/logement" as any,
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon name="home-outline" size={20} color={color} focused={focused} pulseKey={tabPulse.logement} />
                    ),
                }}
                listeners={{ tabPress: ownerTabPress("logement", "/proprietaire/logement") }}
            />
            <Tabs.Screen
                name="documents"
                options={{
                    title: "Documents",
                    href: "/proprietaire/documents" as any,
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon name="document-outline" size={20} color={color} focused={focused} pulseKey={tabPulse.documents} />
                    ),
                }}
                listeners={{ tabPress: ownerTabPress("documents", "/proprietaire/documents") }}
            />
            <Tabs.Screen
                name="incidents"
                options={{
                    title: "Incidents",
                    href: "/proprietaire/incidents" as any,
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon name="flame-outline" size={20} color={color} focused={focused} pulseKey={tabPulse.incidents} />
                    ),
                }}
                listeners={{ tabPress: ownerTabPress("incidents", "/proprietaire/incidents") }}
            />
            <Tabs.Screen name="profile" options={{ href: null }} />
            <Tabs.Screen name="bien/[id]" options={{ href: null }} />
        </Tabs>
    );
}

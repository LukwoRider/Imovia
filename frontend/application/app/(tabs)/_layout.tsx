import AnimatedTabIcon from "@/components/ui/animated-tab-icon";
import { supabase } from "@/lib/supabase";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useTabBarHeight = () => {
    const insets = useSafeAreaInsets();
    return 60 + (insets.bottom > 0 ? insets.bottom : 16);
}

export default function LocataireLayout() {
    const insets = useSafeAreaInsets();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isOwnerOrAgency, setIsOwnerOrAgency] = useState(false);
    const [tabPulse, setTabPulse] = useState({
        index: 0,
        biens: 0,
        logement: 0,
        documents: 0,
        incidents: 0,
        paiements: 0,
    });

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let role = user.user_metadata?.role || "tenant";          
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            if (profile?.role) {
                role = profile.role;
            }

            const checkRoleStr = role.toLowerCase();
            const management = checkRoleStr === 'owner' || checkRoleStr === 'agency' || checkRoleStr === 'propriétaire';

            setUserRole(role);
            setIsOwnerOrAgency(management);
        };

        checkRole();
    }, []);

    const bumpTabPulse = (tab: keyof typeof tabPulse) => {
        setTabPulse((prev) => ({ ...prev, [tab]: prev[tab] + 1 }));
    };

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                popToTopOnBlur: true,
                tabBarActiveTintColor: "#3153A1",
                tabBarInactiveTintColor: "#7a7a7a",
                tabBarStyle: {
                    position: "absolute",
                    bottom: insets.bottom > 0 ? insets.bottom : 16, 
                    height: 60,
                    marginInline: 16,
                    backgroundColor: "#fff",
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "#ececec",
                    elevation: 4, 
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                },
                tabBarItemStyle: {
                    paddingTop: 1,
                    paddingBottom: 2,
                },
                tabBarLabelStyle: {
                    fontSize: 9,
                    lineHeight: 12,
                    fontFamily: "Montserrat_500Medium",
                    fontWeight: "500",
                    marginTop: 2,
                    includeFontPadding: false,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Accueil",
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon
                            name="time-outline"
                            size={21}
                            color={color}
                            focused={focused}
                            pulseKey={tabPulse.index}
                        />
                    ),
                }}
                listeners={{
                    tabPress: () => bumpTabPulse("index"),
                }}
            />
            <Tabs.Screen
                name="biens"
                options={{
                    title: "Biens",
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon
                            name="business-outline"
                            size={21}
                            color={color}
                            focused={focused}
                            pulseKey={tabPulse.biens}
                        />
                    ),
                }}
                listeners={{
                    tabPress: () => bumpTabPulse("biens"),
                }}
            />
            <Tabs.Protected guard={!isOwnerOrAgency}>
                <Tabs.Screen
                    name="logement"
                    options={{
                        title: "Mon logement",
                        href: isOwnerOrAgency ? null : "/(tabs)/logement",
                        tabBarIcon: ({ color, focused }) => (
                            <AnimatedTabIcon
                                name="home-outline"
                                size={20}
                                color={color}
                                focused={focused}
                                pulseKey={tabPulse.logement}
                            />
                        ),
                    }}
                    listeners={{
                        tabPress: () => bumpTabPulse("logement"),
                    }}
                />
            </Tabs.Protected>
            <Tabs.Protected guard={isOwnerOrAgency}>
                <Tabs.Screen
                    name="paiements"
                    options={{
                        title: isOwnerOrAgency ? "Locations" : "Mes paiements",
                        href: isOwnerOrAgency ? "/(tabs)/paiements" : null,
                        tabBarIcon: ({ color, focused }) => (
                            <AnimatedTabIcon
                                name="card-outline"
                                size={20}
                                color={color}
                                focused={focused}
                                pulseKey={tabPulse.paiements}
                            />
                        ),
                    }}
                    listeners={{
                        tabPress: () => bumpTabPulse("paiements"),
                    }}
                />
            </Tabs.Protected>
            <Tabs.Screen
                name="documents"
                options={{
                    title: "Documents",
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon
                            name="document-outline"
                            size={20}
                            color={color}
                            focused={focused}
                            pulseKey={tabPulse.documents}
                        />
                    ),
                }}
                listeners={{
                    tabPress: () => bumpTabPulse("documents"),
                }}
            />
            <Tabs.Screen
                name="incidents"
                options={{
                    title: "Incidents",
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon
                            name="flame-outline"
                            size={20}
                            color={color}
                            focused={focused}
                            pulseKey={tabPulse.incidents}
                        />
                    ),
                }}
                listeners={{
                    tabPress: () => bumpTabPulse("incidents"),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import type { Incident } from "./types";


const PROBLEM_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    plumbing: { label: "Plomberie", color: "#0056BD", icon: "water-outline" }, // lab(44.0605% 29.0279 -86.0352)
    electricity: { label: "Électrique", color: "#EDD632", icon: "flash-outline" }, // lab(76.3898% 14.5258 98.4589)
    appliance: { label: "Panne d'appareil", color: "#FF8100", icon: "build-outline" }, // lab(64.272% 57.1788 90.3583)
    other: { label: "Autre", color: "#6B7280", icon: "alert-circle-outline" }, // lab(48.0876% -2.03595 -16.5814)
};

export default function IncidentCard({ incident }: { incident: Incident }) {
    const config = PROBLEM_CONFIG[incident.typeProb] || PROBLEM_CONFIG.other;

    return (
        <View
            style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 10,
                }}
            >
                <View
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        backgroundColor: config.color,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                    }}
                >
                    <Ionicons name={config.icon} size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: "#1e293b",
                            fontFamily: "Montserrat_700Bold",
                        }}
                        numberOfLines={2}
                    >
                        {config.label}
                    </Text>
                    <Text
                        style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginTop: 2,
                            fontFamily: "Montserrat_400Regular",
                        }}
                    >
                        Déclaré le {incident.dateDeclaration}
                    </Text>
                </View>
            </View>

            <Text
                style={{
                    fontSize: 12,
                    color: "#6b7280",
                    lineHeight: 18,
                    marginBottom: 12,
                    fontFamily: "Montserrat_400Regular",
                }}
                numberOfLines={3}
            >
                {incident.description}
            </Text>

            <View
                style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 14,
                }}
            >
                {incident.localisation && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#f3f4f6",
                            borderRadius: 20,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 11,
                                color: "#374151",
                                fontFamily: "Montserrat_500Medium",
                            }}
                        >
                            {incident.localisation}
                        </Text>
                    </View>
                )}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#f3f4f6",
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 11,
                            color: "#374151",
                            fontFamily: "Montserrat_500Medium",
                        }}
                    >
                        {incident.dureeLabel}
                    </Text>
                </View>
            </View>

            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <View>
                    <Text
                        style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: "#1e293b",
                            fontFamily: "Montserrat_700Bold",
                        }}
                    >
                        {incident.gestionnaireNom}
                    </Text>
                    <Text
                        style={{
                            fontSize: 11,
                            color: "#3153A1",
                            marginTop: 1,
                            fontFamily: "Montserrat_500Medium",
                        }}
                    >
                        {incident.gestionnaireTel}
                    </Text>
                </View>
                <Pressable
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#3153A1",
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                    }}
                >
                    <Ionicons
                        name="call"
                        size={13}
                        color="#fff"
                        style={{ marginRight: 6 }}
                    />
                    <Text
                        style={{
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "600",
                            fontFamily: "Montserrat_600SemiBold",
                        }}
                    >
                        Contacter
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

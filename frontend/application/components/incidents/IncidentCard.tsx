import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import type { Incident } from "./types";


function getStatusBgColor(statut: Incident["statut"]): string {
    switch (statut) {
        case "en_cours":
            return "#e17100";
        case "resolus":
            return "#08cb56";
        case "attente":
            return "#ff0000";
        default:
            return "#6b7280";
    }
}

export default function IncidentCard({ incident }: { incident: Incident }) {
    const statusBg = getStatusBgColor(incident.statut);

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
                        backgroundColor: statusBg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                    }}
                >
                    <Ionicons name="water" size={20} color="#FDF8F2" />
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
                        {incident.titre}
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

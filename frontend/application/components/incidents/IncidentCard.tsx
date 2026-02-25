import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import type { Incident } from "./types";

const PROBLEM_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
    plumbing: { label: "Plomberie", color: "#0056BD", icon: "water-outline" },
    electricity: { label: "Électrique", color: "#EDD632", icon: "flash-outline" },
    appliance: { label: "Panne d'appareil", color: "#FF8100", icon: "build-outline" },
    other: { label: "Autre", color: "#6B7280", icon: "alert-circle-outline" },
};

const STATUS_CONFIG = {
    attente: { label: "En attente", color: "#E17100", bg: "rgba(225,113,0,0.1)", icon: "hourglass-outline" },
    en_cours: { label: "En cours", color: "#3153A1", bg: "rgba(49,83,161,0.1)", icon: "time-outline" },
    resolus: { label: "Résolu", color: "#08CB56", bg: "rgba(8,203,86,0.1)", icon: "checkmark-circle-outline" },
};

export default function IncidentCard({
    incident,
    isManagement = false,
    onRefresh
}: {
    incident: Incident;
    isManagement?: boolean;
    onRefresh?: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const config = PROBLEM_CONFIG[incident.typeProb] || PROBLEM_CONFIG.other;
    const statusCfg = STATUS_CONFIG[incident.statut] || STATUS_CONFIG.attente;

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            const { error } = await supabase
                .from("incidents")
                .update({ status: newStatus })
                .eq("id", incident.id);

            if (error) throw error;
            setShowMenu(false);
            if (onRefresh) onRefresh();
        } catch (err: any) {
            console.error("[IncidentCard] Status update error:", err);
            Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
        }
    };

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
            {/* Header with Title and Status */}
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                }}
            >
                <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            backgroundColor: config.color,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 10,
                        }}
                    >
                        <Ionicons name={config.icon} size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: "700",
                                color: "#1e293b",
                                fontFamily: "Montserrat_700Bold",
                            }}
                            numberOfLines={1}
                        >
                            {config.label}
                        </Text>
                        <Text
                            style={{
                                fontSize: 10,
                                color: "#9ca3af",
                                fontFamily: "Montserrat_400Regular",
                            }}
                        >
                            Déclaré le {incident.dateDeclaration}
                        </Text>
                    </View>
                </View>

                {/* Interactive Status Badge */}
                <Pressable
                    onPress={() => isManagement && setShowMenu(true)}
                    disabled={!isManagement}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: statusCfg.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: statusCfg.color,
                    }}
                >
                    <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} style={{ marginRight: 4 }} />
                    <Text
                        style={{
                            fontSize: 10,
                            fontWeight: "600",
                            color: statusCfg.color,
                            fontFamily: "Montserrat_600SemiBold",
                        }}
                    >
                        {statusCfg.label}
                    </Text>
                    {isManagement && (
                        <Ionicons name="chevron-down" size={10} color={statusCfg.color} style={{ marginLeft: 4 }} />
                    )}
                </Pressable>
            </View>

            {/* Description */}
            <Text
                style={{
                    fontSize: 12,
                    color: "#6b7280",
                    lineHeight: 18,
                    marginBottom: 12,
                    fontFamily: "Montserrat_400Regular",
                }}
            >
                {incident.description}
            </Text>

            {/* Tags (Location, Duration) */}
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
                        <Ionicons name="location-outline" size={10} color="#6B7280" style={{ marginRight: 4 }} />
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
                    <Ionicons name="time-outline" size={10} color="#6B7280" style={{ marginRight: 4 }} />
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

            {/* Footer with Contact Info */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#f1f5f9",
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
                    onPress={() => {
                        if (incident.gestionnaireTel && incident.gestionnaireTel !== "Non renseigné") {
                            Linking.openURL(`tel:${incident.gestionnaireTel}`);
                        } else {
                            Alert.alert("Information", "Aucun numéro de téléphone renseigné.");
                        }
                    }}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#3153A1",
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                    }}
                >
                    <Ionicons name="call" size={13} color="#fff" style={{ marginRight: 6 }} />
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

            {/* Custom Status Selection Modal */}
            <Modal
                visible={showMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMenu(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Changer le statut</Text>

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => handleUpdateStatus("open")}
                        >
                            <View style={[styles.optionDot, { backgroundColor: STATUS_CONFIG.attente.color }]} />
                            <Text style={styles.optionText}>En attente</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => handleUpdateStatus("in_progress")}
                        >
                            <View style={[styles.optionDot, { backgroundColor: STATUS_CONFIG.en_cours.color }]} />
                            <Text style={styles.optionText}>En cours</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => handleUpdateStatus("resolved")}
                        >
                            <View style={[styles.optionDot, { backgroundColor: STATUS_CONFIG.resolus.color }]} />
                            <Text style={styles.optionText}>Résolu</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.option, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}
                            onPress={() => setShowMenu(false)}
                        >
                            <Text style={[styles.optionText, { color: '#6b7280', fontWeight: '400' }]}>Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        width: "100%",
        maxWidth: 300,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        marginBottom: 20,
        textAlign: "center",
        fontFamily: "Montserrat_700Bold",
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
    },
    optionDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
        color: "#374151",
        fontWeight: "600",
        fontFamily: "Montserrat_600SemiBold",
    },
});

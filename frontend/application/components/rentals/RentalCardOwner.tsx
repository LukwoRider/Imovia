import { Text } from "@/components/ui/text";
import { terminateLease, updateLease } from "@/lib/supabase/owner-actions";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface RentalCardOwnerProps {
    lease: {
        id: string;
        rent_amount: number;
        start_date: string;
        status: string;
        property_id: string;
        property: {
            address: string;
            surface_m2: number;
            rooms: number;
        };
        tenants: {
            id: string;
            full_name: string;
            email: string;
            phone: string;
        }[];
    };
    onRefresh?: () => void;
}

export function RentalCardOwner({ lease, onRefresh }: RentalCardOwnerProps) {
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef<View>(null);

    const [profileVisible, setProfileVisible] = useState(false);
    const [leaseManageVisible, setLeaseManageVisible] = useState(false);

    const [leaseForm, setLeaseForm] = useState({
        rent_amount: lease.rent_amount.toString(),
        charges_amount: (lease as any).charges_amount?.toString() || "0",
        payment_day: (lease as any).payment_day?.toString() || "5",
        start_date: lease.start_date.split('T')[0]
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isTerminating, setIsTerminating] = useState(false);

    const tenant = lease.tenants && lease.tenants.length > 0 ? lease.tenants[0] : null;
    const tenantName = tenant ? tenant.full_name : "Aucun locataire";

    const formattedDate = new Date(lease.start_date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "active":
                return { label: "Actif", color: "#10b981", icon: "checkmark-circle" };
            case "pending":
                return { label: "En attente", color: "#f59e0b", icon: "time" };
            case "terminated":
            case "ended":
                return { label: "Terminé", color: "#64748b", icon: "close-circle" };
            default:
                return { label: "Brouillon", color: "#94a3b8", icon: "document" };
        }
    };

    const statusConfig = getStatusConfig(lease.status);

    const openMenu = () => {
        buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
            const screenWidth = Dimensions.get('window').width;
            setMenuPosition({
                top: pageY - 170,
                right: screenWidth - (pageX + width)
            });
            setMenuVisible(true);
        });
    };

    const handleTerminate = () => {
        setMenuVisible(false);

        Alert.alert(
            "Retirer locataire",
            "Êtes-vous sûr de vouloir retirer ce locataire ? Le bail sera marqué comme terminé et le bien redeviendra disponible.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Retirer locataire",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsTerminating(true);
                            console.log(`[RentalCard] Terminating lease: ${lease.id}`);
                            await terminateLease(lease.id, lease.property_id);

                            Alert.alert("Succès", "Le locataire a été retiré et le bail est terminé.", [
                                { text: "OK", onPress: () => onRefresh?.() }
                            ]);
                        } catch (error: any) {
                            console.error("[RentalCard] Termination error:", error);
                            Alert.alert("Erreur", error.message || "Une erreur est survenue lors de la suppression.");
                            setIsTerminating(false);
                        }
                    }
                }
            ]
        );
    };

    const handleUpdateLease = async () => {
        setIsSaving(true);
        try {
            await updateLease(lease.id, {
                rent_amount: parseInt(leaseForm.rent_amount),
                charges_amount: parseInt(leaseForm.charges_amount),
                payment_day: parseInt(leaseForm.payment_day),
                start_date: leaseForm.start_date
            });
            Alert.alert("Succès", "Le bail a été mis à jour.");
            setLeaseManageVisible(false);
            onRefresh?.();
        } catch (error: any) {
            Alert.alert("Erreur", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.card}>
            {isTerminating && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator color="#3153A1" size="large" />
                    <Text style={{ marginTop: 12, color: "#3153A1", fontWeight: "600" }}>Suppression en cours...</Text>
                </View>
            )}

            <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.address} numberOfLines={2}>
                        {lease.property.address}
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: `${statusConfig.color}15`, borderColor: `${statusConfig.color}20` }]}>
                    <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                    </Text>
                </View>
            </View>

            <View style={styles.tenantRow}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person" size={16} color="#64748b" />
                </View>
                <View>
                    <Text style={styles.label}>LOCATAIRE</Text>
                    <Text style={styles.tenantName}>{tenantName}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.label}>DEPUIS LE</Text>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ alignItems: "flex-end", marginRight: 4 }}>
                        <Text style={[styles.label, { color: "#3153A1" }]}>LOYER</Text>
                        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                            <Text style={styles.rentAmount}>{lease.rent_amount.toLocaleString()}</Text>
                            <Text style={styles.currency}>€</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        ref={buttonRef}
                        activeOpacity={0.7}
                        onPress={openMenu}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        style={styles.menuButton}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color={menuVisible ? "#3153A1" : "#94a3b8"} />
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                transparent={true}
                visible={menuVisible}
                animationType="none"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={[
                        styles.inlineMenu,
                        {
                            position: 'absolute',
                            top: menuPosition.top,
                            right: menuPosition.right
                        }
                    ]}>
                        <TouchableOpacity
                            onPress={() => {
                                setMenuVisible(false);
                                setProfileVisible(true);
                            }}
                            style={styles.menuItem}
                        >
                            <View style={styles.menuIconContainer}>
                                <Feather name="user" size={18} color="#475569" />
                            </View>
                            <Text style={styles.menuItemText}>Fiche locataire</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                setMenuVisible(false);
                                setLeaseManageVisible(true);
                            }}
                            style={styles.menuItem}
                        >
                            <View style={styles.menuIconContainer}>
                                <Feather name="clock" size={18} color="#475569" />
                            </View>
                            <Text style={[styles.menuItemText, { color: "#e67e22" }]}>Gérer le bail</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleTerminate}
                            style={[styles.menuItem, { marginBottom: 0 }]}
                        >
                            <View style={styles.menuIconContainer}>
                                <Feather name="user-x" size={18} color="#475569" />
                            </View>
                            <Text style={[styles.menuItemText, { color: "#f87171" }]}>Retirer locataire</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            <Modal visible={profileVisible} animationType="slide" onRequestClose={() => setProfileVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setProfileVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="#0f172a" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Fiche Locataire</Text>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
                        <View style={styles.avatarLarge}>
                            <Ionicons name="person" size={48} color="#3153A1" />
                        </View>
                        <Text style={styles.nameLarge}>{tenantName}</Text>
                        <Text style={styles.emailLarge}>{tenant?.email || "Pas d'email"}</Text>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoCard}>
                                <Text style={styles.infoLabel}>Téléphone</Text>
                                <Text style={styles.infoValue}>{tenant?.phone || "-- -- -- -- --"}</Text>
                            </View>
                            <View style={styles.infoCard}>
                                <Text style={styles.infoLabel}>Statut du bail</Text>
                                <Text style={[styles.infoValue, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            <Modal visible={leaseManageVisible} animationType="slide" onRequestClose={() => setLeaseManageVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setLeaseManageVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="#0f172a" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Gérer le bail</Text>
                    </View>
                    <ScrollView style={{ padding: 20 }}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>LOYER DE BASE (€)</Text>
                            <TextInput
                                value={leaseForm.rent_amount}
                                onChangeText={val => setLeaseForm({ ...leaseForm, rent_amount: val })}
                                keyboardType="numeric"
                                style={styles.input}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CHARGES (€)</Text>
                            <TextInput
                                value={leaseForm.charges_amount}
                                onChangeText={val => setLeaseForm({ ...leaseForm, charges_amount: val })}
                                keyboardType="numeric"
                                style={styles.input}
                            />
                        </View>
                        <TouchableOpacity
                            disabled={isSaving}
                            onPress={handleUpdateLease}
                            style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                        >
                            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Enregistrer</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        position: 'relative'
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12
    },
    address: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
        lineHeight: 20
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        marginLeft: 8
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase"
    },
    tenantRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16
    },
    avatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10
    },
    label: {
        fontSize: 10,
        color: "#64748b",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5
    },
    tenantName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155"
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 12
    },
    dateText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#334155"
    },
    rentAmount: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a"
    },
    currency: {
        fontSize: 12,
        fontWeight: "700",
        color: "#3153A1",
        marginLeft: 2
    },
    menuButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc"
    },
    inlineMenu: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        width: 220,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 12,
    },
    menuIconContainer: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center'
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1e293b',
        fontFamily: 'Montserrat_500Medium'
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#fff"
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9"
    },
    closeButton: {
        padding: 4
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
        marginLeft: 16
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#3153A110",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16
    },
    nameLarge: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 4
    },
    emailLarge: {
        fontSize: 14,
        color: "#64748b",
        marginBottom: 24
    },
    infoGrid: {
        width: '100%',
        gap: 12
    },
    infoCard: {
        backgroundColor: "#f8fafc",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    infoLabel: {
        color: "#64748b",
        fontSize: 13
    },
    infoValue: {
        fontWeight: "700",
        color: "#0f172a",
        fontSize: 14
    },
    inputGroup: {
        marginBottom: 16
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748b",
        marginBottom: 8
    },
    input: {
        backgroundColor: "#f8fafc",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        fontSize: 16
    },
    saveButton: {
        backgroundColor: "#3153A1",
        padding: 18,
        borderRadius: 18,
        alignItems: "center",
        marginTop: 20
    },
    saveButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16
    }
});

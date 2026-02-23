import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

type Profile = {
    id: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    email?: string;
};

type AjouterBienModalProps = {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ownerId: string;
};

export default function AjouterBienModal({
    visible,
    onClose,
    onSuccess,
    ownerId,
}: AjouterBienModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [tenants, setTenants] = useState<Profile[]>([]);
    const [showTenantPicker, setShowTenantPicker] = useState(false);

    const [postalCode, setPostalCode] = useState("");
    const [address, setAddress] = useState("");
    const [statusText, setStatusText] = useState("");
    const [propertyType, setPropertyType] = useState<"Maison" | "Appartement">("Appartement");
    const [rooms, setRooms] = useState("");
    const [surface, setSurface] = useState("");
    const [rent, setRent] = useState("");
    const [floor, setFloor] = useState("");
    const [description, setDescription] = useState("");
    const [isFurnished, setIsFurnished] = useState<boolean | null>(null);
    const [hasElevator, setHasElevator] = useState<boolean | null>(null);
    const [energyClass, setEnergyClass] = useState("");

    const [selectedTenant, setSelectedTenant] = useState<Profile | null>(null);

    useEffect(() => {
        if (visible) {
            fetchTenants();
        }
    }, [visible]);

    async function fetchTenants() {
        setLoadingTenants(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, phone, avatar_url")
                .eq("role", "tenant");

            if (error) throw error;
            setTenants(data || []);
        } catch (error: any) {
            console.error("Error fetching tenants:", error);
        } finally {
            setLoadingTenants(false);
        }
    }

    const handleSave = async () => {
        if (!address || !rent || !surface || !rooms) {
            Alert.alert("Champs manquants", "Veuillez remplir l'adresse, le loyer, la superficie et le nombre de pièces.");
            return;
        }

        setSubmitting(true);
        try {
            const { data: property, error: propertyError } = await supabase
                .from("properties")
                .insert({
                    owner_id: ownerId,
                    description,
                    address,
                    postal_code: postalCode,
                    city: address.split(',').pop()?.trim() || "",
                    monthly_rent: Number(rent),
                    surface_m2: Number(surface),
                    property_type: propertyType,
                    status: selectedTenant ? 'rented' : 'available',
                    rooms: Number(rooms),
                    floor_number: Number(floor) || 0,
                    is_furnished: isFurnished === true,
                    has_elevator: hasElevator === true,
                    energy_class: energyClass || 'B'
                })
                .select()
                .single();

            if (propertyError) throw propertyError;

            if (selectedTenant && property) {
                const { error: leaseError } = await supabase
                    .from("leases")
                    .insert({
                        property_id: property.id,
                        owner_id: ownerId,
                        start_date: new Date().toISOString().split('T')[0],
                        rent_amount: Number(rent),
                        status: 'active'
                    })
                    .select()
                    .single();

                const { data: newLease } = await supabase
                    .from("leases")
                    .select("id")
                    .eq("property_id", property.id)
                    .eq("status", 'active')
                    .single();

                if (newLease) {
                    await supabase.from("lease_tenants").insert({
                        lease_id: newLease.id,
                        tenant_id: selectedTenant.id
                    });
                }
            }

            Alert.alert("Succès", "Le logement a été ajouté.");
            onSuccess();
            onClose();
            resetForm();
        } catch (error: any) {
            console.error("Error saving property:", error);
            Alert.alert("Erreur", error.message || "Une erreur est survenue lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setPostalCode("");
        setAddress("");
        setStatusText("");
        setPropertyType("Appartement");
        setRooms("");
        setSurface("");
        setRent("");
        setFloor("");
        setDescription("");
        setIsFurnished(null);
        setHasElevator(null);
        setEnergyClass("");
        setSelectedTenant(null);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Ajouter un logement</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#64748b" />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 2 }]}>
                                <Text style={styles.label}>Adresse :</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="location-outline" size={18} color="#94a3b8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ex : 12 rue du port"
                                        value={address}
                                        onChangeText={setAddress}
                                    />
                                </View>
                            </View>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>CP :</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="59000"
                                        value={postalCode}
                                        onChangeText={setPostalCode}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>Choisir le type de logement :</Text>
                                <View style={styles.toggleRow}>
                                    <Pressable
                                        style={[styles.toggleButton, propertyType === "Maison" && styles.toggleActive]}
                                        onPress={() => setPropertyType("Maison")}
                                    >
                                        <Ionicons name="home-outline" size={16} color={propertyType === "Maison" ? "#3153A1" : "#64748b"} />
                                        <Text style={[styles.toggleText, propertyType === "Maison" && styles.toggleActiveText]}>Maison</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.toggleButton, propertyType === "Appartement" && styles.toggleActive]}
                                        onPress={() => setPropertyType("Appartement")}
                                    >
                                        <Ionicons name="business-outline" size={16} color={propertyType === "Appartement" ? "#3153A1" : "#64748b"} />
                                        <Text style={[styles.toggleText, propertyType === "Appartement" && styles.toggleActiveText]}>Appartement</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Nombre de pièces :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="3"
                                    keyboardType="numeric"
                                    value={rooms}
                                    onChangeText={setRooms}
                                />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Superficie (m2) :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="18"
                                    keyboardType="numeric"
                                    value={surface}
                                    onChangeText={setSurface}
                                />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Loyer (mensuelle) :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="850"
                                    keyboardType="numeric"
                                    value={rent}
                                    onChangeText={setRent}
                                />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Étage :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="3"
                                    keyboardType="numeric"
                                    value={floor}
                                    onChangeText={setFloor}
                                />
                            </View>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Description du bien :</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Type your message here."
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                value={description}
                                onChangeText={setDescription}
                            />
                            <Text style={styles.charCount}>{description.length}/500 caractères</Text>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Meublé :</Text>
                                <View style={styles.toggleRowSmall}>
                                    <Pressable
                                        style={[styles.toggleButtonSmall, isFurnished === true && styles.toggleActive]}
                                        onPress={() => setIsFurnished(true)}
                                    >
                                        <Text style={[styles.toggleText, isFurnished === true && styles.toggleActiveText]}>Oui</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.toggleButtonSmall, isFurnished === false && styles.toggleActive]}
                                        onPress={() => setIsFurnished(false)}
                                    >
                                        <Text style={[styles.toggleText, isFurnished === false && styles.toggleActiveText]}>Non</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Ascenseur :</Text>
                                <View style={styles.toggleRowSmall}>
                                    <Pressable
                                        style={[styles.toggleButtonSmall, hasElevator === true && styles.toggleActive]}
                                        onPress={() => setHasElevator(true)}
                                    >
                                        <Text style={[styles.toggleText, hasElevator === true && styles.toggleActiveText]}>Oui</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.toggleButtonSmall, hasElevator === false && styles.toggleActive]}
                                        onPress={() => setHasElevator(false)}
                                    >
                                        <Text style={[styles.toggleText, hasElevator === false && styles.toggleActiveText]}>Non</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Classe énergétique :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="B"
                                    value={energyClass}
                                    onChangeText={setEnergyClass}
                                    autoCapitalize="characters"
                                    maxLength={1}
                                />
                            </View>
                        </View>

                        <View style={styles.separator} />

                        <View style={styles.tenantSection}>
                            <View style={styles.tenantHeader}>
                                <Text style={styles.sectionTitle}>Locataire</Text>
                                <View style={styles.tenantActions}>
                                    <Pressable
                                        style={styles.addButton}
                                        onPress={() => setShowTenantPicker(true)}
                                    >
                                        <Text style={styles.addButtonText}>Ajouter</Text>
                                    </Pressable>
                                    {selectedTenant && (
                                        <Pressable
                                            style={styles.deleteButton}
                                            onPress={() => setSelectedTenant(null)}
                                        >
                                            <Text style={styles.deleteButtonText}>Supprimer</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.field}>
                                    <Text style={styles.label}>Nom :</Text>
                                    <View style={styles.disabledInput}>
                                        <Text style={styles.disabledText}>{selectedTenant?.full_name.split(' ').pop() || "-"}</Text>
                                    </View>
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.label}>Prénom :</Text>
                                    <View style={styles.disabledInput}>
                                        <Text style={styles.disabledText}>{selectedTenant?.full_name.split(' ')[0] || "-"}</Text>
                                    </View>
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.label}>Numéro :</Text>
                                    <View style={styles.disabledInput}>
                                        <Text style={styles.disabledText}>{selectedTenant?.phone || "-"}</Text>
                                    </View>
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.label}>Mail :</Text>
                                    <View style={styles.disabledInput}>
                                        <Text style={styles.disabledText}>{selectedTenant?.email || "-"}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Button
                                onPress={handleSave}
                                disabled={submitting}
                                style={styles.saveButton}
                            >
                                <View style={styles.saveButtonContent}>
                                    <Ionicons name="save-outline" size={18} color="#fff" />
                                    <Text style={styles.saveButtonText}>{submitting ? "Enregistrement..." : "Enregistrer"}</Text>
                                </View>
                            </Button>
                        </View>
                    </ScrollView>
                </View>
            </View>

            <Modal visible={showTenantPicker} transparent animationType="fade">
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerContent}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Sélectionner un locataire</Text>
                            <Pressable onPress={() => setShowTenantPicker(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </Pressable>
                        </View>
                        {loadingTenants ? (
                            <ActivityIndicator size="large" color="#3153A1" style={{ padding: 20 }} />
                        ) : (
                            <ScrollView style={styles.tenantList}>
                                {tenants.map(tenant => (
                                    <Pressable
                                        key={tenant.id}
                                        style={styles.tenantItem}
                                        onPress={() => {
                                            setSelectedTenant(tenant);
                                            setShowTenantPicker(false);
                                        }}
                                    >
                                        <View style={styles.tenantAvatar}>
                                            <Ionicons name="person" size={20} color="#3153A1" />
                                        </View>
                                        <View>
                                            <Text style={styles.tenantName}>{tenant.full_name}</Text>
                                            <Text style={styles.tenantRole}>Locataire</Text>
                                        </View>
                                    </Pressable>
                                ))}
                                {tenants.length === 0 && (
                                    <Text style={styles.emptyText}>Aucun locataire trouvé.</Text>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "90%",
        padding: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        fontFamily: "Montserrat_700Bold",
        textAlign: "center",
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    form: {
        flex: 1,
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    field: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 8,
        fontFamily: "Montserrat_600SemiBold",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: "#fff",
        height: 44,
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: "#1e293b",
        fontFamily: "Montserrat_400Regular",
    },
    inputSmall: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: "#fff",
        height: 44,
        fontSize: 14,
        color: "#1e293b",
        textAlign: "center",
        fontFamily: "Montserrat_400Regular",
    },
    toggleRow: {
        flexDirection: "row",
        gap: 12,
    },
    toggleRowSmall: {
        flexDirection: "row",
        gap: 8,
    },
    toggleButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        flex: 1,
        justifyContent: "center",
    },
    toggleButtonSmall: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        minWidth: 50,
        alignItems: "center",
    },
    toggleActive: {
        borderColor: "#3153A1",
        backgroundColor: "rgba(49, 83, 161, 0.05)",
    },
    toggleText: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "500",
        fontFamily: "Montserrat_500Medium",
    },
    toggleActiveText: {
        color: "#3153A1",
        fontWeight: "600",
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 12,
        backgroundColor: "#fff",
        minHeight: 100,
        textAlignVertical: "top",
        fontSize: 14,
        color: "#1e293b",
        fontFamily: "Montserrat_400Regular",
    },
    charCount: {
        alignSelf: "flex-end",
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 4,
    },
    separator: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginVertical: 20,
    },
    tenantSection: {
        marginBottom: 24,
    },
    tenantHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        fontFamily: "Montserrat_700Bold",
    },
    tenantActions: {
        flexDirection: "row",
        gap: 8,
    },
    addButton: {
        backgroundColor: "#3153A1",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    deleteButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: "#64748b",
        fontSize: 14,
        fontWeight: "600",
    },
    disabledInput: {
        borderWidth: 1,
        borderColor: "#f1f5f9",
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: "#f8fafc",
        height: 44,
        justifyContent: "center",
    },
    disabledText: {
        fontSize: 13,
        color: "#94a3b8",
        fontFamily: "Montserrat_400Regular",
    },
    footer: {
        marginTop: 10,
        marginBottom: 40,
        alignItems: "center",
    },
    saveButton: {
        width: 160,
        backgroundColor: "#3153A1",
        borderRadius: 10,
        height: 48,
    },
    saveButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    pickerContent: {
        backgroundColor: "#fff",
        borderRadius: 16,
        maxHeight: "70%",
        padding: 20,
    },
    pickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
    },
    tenantList: {
        flexGrow: 0,
    },
    tenantItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    tenantAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#eef2ff",
        alignItems: "center",
        justifyContent: "center",
    },
    tenantName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
    },
    tenantRole: {
        fontSize: 12,
        color: "#64748b",
    },
    emptyText: {
        textAlign: "center",
        color: "#94a3b8",
        padding: 20,
    },
});

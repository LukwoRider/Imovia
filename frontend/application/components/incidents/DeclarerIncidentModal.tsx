import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, TextInput, View } from "react-native";


const MONTH_NAMES = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
];

const DAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
    const d = new Date(year, month, 1).getDay();
    // Convert Sunday=0 to Monday-based (0=Mon, 6=Sun)
    return d === 0 ? 6 : d - 1;
}


const INCIDENT_TYPES: {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}[] = [
        { key: "plomberie", label: "Plomberie", icon: "water-outline" },
        { key: "electrique", label: "Eléctrique", icon: "flash-outline" },
        { key: "panne", label: "Panne d'appareil", icon: "tv-outline" },
        { key: "autre", label: "Autre", icon: "pencil-outline" },
    ];

export default function DeclarerIncidentView({
    onBack,
    onSuccess,
}: {
    onBack: () => void;
    onSuccess?: () => void;
}) {
    const [selectedType, setSelectedType] = useState("");
    const [description, setDescription] = useState("");
    const [localisation, setLocalisation] = useState("");
    const [locFocused, setLocFocused] = useState(false);
    const [descFocused, setDescFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = selectedType.length > 0 && description.trim().length > 0;

    const handleSubmit = async () => {
        if (!canSubmit || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Utilisateur non connecté");

            const { data: leaseData, error: leaseError } = await supabase
                .from("lease_tenants")
                .select("lease_id")
                .eq("tenant_id", user.id)
                .maybeSingle();

            if (leaseError) {
                console.error("[Incident] Lease fetch error:", leaseError);
                throw new Error("Erreur lors de la vérification de votre bail.");
            }

            if (!leaseData) {
                Alert.alert(
                    "Action impossible",
                    "Vous n'avez pas de bail actif associé à votre compte. Seuls les locataires ayant un bail en cours peuvent déclarer des incidents."
                );
                return;
            }

            const leaseId = leaseData.lease_id;

            const backendType = mapToBackendType(selectedType);

            const { data: incidentId, error: rpcError } = await supabase.rpc("create_incident", {
                p_lease_id: leaseId,
                p_property_id: null,
                p_title: null,
                p_description: description.trim(),
                p_incident_type: backendType,
                p_priority: 'medium',
                p_location_details: localisation.trim() || null,
                p_contact_phone: null,
                p_preferred_visit_date: null,
                p_allow_access_without_presence: true
            });

            if (rpcError) throw rpcError;

            Alert.alert("Succès", "Votre incident a été déclaré avec succès.");
            if (onSuccess) onSuccess();
            onBack();
        } catch (error: any) {
            console.error("[Incident] Submission error:", error);
            Alert.alert("Erreur", error.message || "Une erreur est survenue lors de l'envoi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    function mapToBackendType(uiKey: string): string {
        switch (uiKey) {
            case "plomberie": return "plumbing";
            case "electrique": return "electricity";
            case "panne": return "appliance";
            case "autre":
            default: return "other";
        }
    }

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
        >
            <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 24,
                    }}
                >
                    <Pressable
                        onPress={onBack}
                        hitSlop={12}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                        }}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={18}
                            color="#1e293b"
                        />
                    </Pressable>
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: "700",
                            color: "#1e293b",
                            fontFamily: "Montserrat_700Bold",
                        }}
                    >
                        Déclarer un incident
                    </Text>
                </View>


                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#1e293b",
                        marginBottom: 14,
                        fontFamily: "Montserrat_700Bold",
                    }}
                >
                    Choisir un type d'incident
                </Text>

                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 10,
                        marginBottom: 24,
                    }}
                >
                    {INCIDENT_TYPES.map((type) => {
                        const active = selectedType === type.key;
                        return (
                            <Pressable
                                key={type.key}
                                onPress={() =>
                                    setSelectedType(
                                        active ? "" : type.key
                                    )
                                }
                                style={{
                                    width: "48%",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: active
                                        ? "#3153A1"
                                        : "#fff",
                                    borderRadius: 12,
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderWidth: 1,
                                    borderColor: active
                                        ? "#3153A1"
                                        : "#e5e7eb",
                                }}
                            >
                                <Ionicons
                                    name={type.icon}
                                    size={16}
                                    color={active ? "#fff" : "#6b7280"}
                                    style={{ marginRight: 8 }}
                                />
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: "600",
                                        color: active ? "#fff" : "#374151",
                                        fontFamily:
                                            "Montserrat_600SemiBold",
                                    }}
                                >
                                    {type.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#1e293b",
                        marginBottom: 10,
                        fontFamily: "Montserrat_700Bold",
                    }}
                >
                    Décrire le probléme
                </Text>

                <TextInput
                    placeholder="Décrivez l'incident..."
                    placeholderTextColor="#9ca3af"
                    value={description}
                    onChangeText={setDescription}
                    onFocus={() => setDescFocused(true)}
                    onBlur={() => setDescFocused(false)}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    selectionColor="#3153A1"
                    cursorColor="#3153A1"
                    style={
                        {
                            backgroundColor: "#fff",
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            fontSize: 14,
                            color: "#1e293b",
                            fontFamily: "Montserrat_400Regular",
                            borderWidth: 1,
                            borderColor: descFocused
                                ? "#3153A1"
                                : "#e5e7eb",
                            minHeight: 120,
                            marginBottom: 20,
                            ...(Platform.OS === "web"
                                ? ({ outlineStyle: "none" } as any)
                                : {}),
                        }
                    }
                />

                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#1e293b",
                        marginBottom: 10,
                        fontFamily: "Montserrat_700Bold",
                    }}
                >
                    Localisation précise
                </Text>

                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: locFocused ? "#3153A1" : "#e5e7eb",
                        marginBottom: 24,
                    }}
                >
                    <Ionicons
                        name="location-outline"
                        size={18}
                        color="#9ca3af"
                        style={{ marginRight: 10 }}
                    />
                    <TextInput
                        placeholder="Ex: Cuisine, Chambre 1..."
                        placeholderTextColor="#9ca3af"
                        value={localisation}
                        onChangeText={setLocalisation}
                        onFocus={() => setLocFocused(true)}
                        onBlur={() => setLocFocused(false)}
                        selectionColor="#3153A1"
                        cursorColor="#3153A1"
                        style={
                            {
                                flex: 1,
                                fontSize: 14,
                                color: "#1e293b",
                                fontFamily: "Montserrat_400Regular",
                                padding: 0,
                                ...(Platform.OS === "web"
                                    ? ({ outlineStyle: "none" } as any)
                                    : {}),
                            }
                        }
                    />
                </View>

                <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: (canSubmit && !isSubmitting) ? "#3153A1" : "#93a4c8",
                        borderRadius: 14,
                        paddingVertical: 16,
                        marginBottom: 10,
                    }}
                >
                    <Text
                        style={{
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: "700",
                            fontFamily: "Montserrat_700Bold",
                        }}
                    >
                        {isSubmitting ? "Envoi en cours..." : "Déclarer cet incident"}
                    </Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

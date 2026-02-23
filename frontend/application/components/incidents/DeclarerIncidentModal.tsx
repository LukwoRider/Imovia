import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, TextInput, View } from "react-native";

function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    const parts: string[] = [];
    for (let i = 0; i < digits.length && i < 12; i += 2) {
        parts.push(digits.slice(i, i + 2));
    }
    return parts.join(" ");
}

function formatDateLabel(d: Date): string {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

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

function MiniCalendar({
    selectedDate,
    onSelect,
}: {
    selectedDate: Date | null;
    onSelect: (d: Date) => void;
}) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const days = useMemo(() => {
        const totalDays = getDaysInMonth(viewYear, viewMonth);
        const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let i = 1; i <= totalDays; i++) cells.push(i);
        return cells;
    }, [viewYear, viewMonth]);

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const isSelected = (day: number) =>
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getFullYear() === viewYear;

    const isToday = (day: number) =>
        today.getDate() === day &&
        today.getMonth() === viewMonth &&
        today.getFullYear() === viewYear;

    return (
        <View
            style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#3153A1",
                padding: 14,
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Pressable onPress={prevMonth} hitSlop={10}>
                    <Ionicons
                        name="chevron-back"
                        size={20}
                        color="#3153A1"
                    />
                </Pressable>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#1e293b",
                        fontFamily: "Montserrat_700Bold",
                    }}
                >
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>
                <Pressable onPress={nextMonth} hitSlop={10}>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#3153A1"
                    />
                </Pressable>
            </View>

            <View
                style={{
                    flexDirection: "row",
                    marginBottom: 6,
                }}
            >
                {DAY_LABELS.map((label) => (
                    <View
                        key={label}
                        style={{
                            flex: 1,
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                fontWeight: "600",
                                fontFamily: "Montserrat_600SemiBold",
                            }}
                        >
                            {label}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {days.map((day, idx) => (
                    <View
                        key={idx}
                        style={{
                            width: `${100 / 7}%`,
                            alignItems: "center",
                            paddingVertical: 3,
                        }}
                    >
                        {day ? (
                            <Pressable
                                onPress={() =>
                                    onSelect(
                                        new Date(viewYear, viewMonth, day)
                                    )
                                }
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: isSelected(day)
                                        ? "#3153A1"
                                        : isToday(day)
                                            ? "#eef2ff"
                                            : "transparent",
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: isSelected(day)
                                            ? "700"
                                            : "500",
                                        color: isSelected(day)
                                            ? "#fff"
                                            : isToday(day)
                                                ? "#3153A1"
                                                : "#374151",
                                        fontFamily: isSelected(day)
                                            ? "Montserrat_700Bold"
                                            : "Montserrat_500Medium",
                                    }}
                                >
                                    {day}
                                </Text>
                            </Pressable>
                        ) : (
                            <View style={{ width: 32, height: 32 }} />
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
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
}: {
    onBack: () => void;
}) {
    const [selectedType, setSelectedType] = useState("");
    const [description, setDescription] = useState("");
    const [telephone, setTelephone] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [autoriseAcces, setAutoriseAcces] = useState(true);
    const [descFocused, setDescFocused] = useState(false);
    const [phoneFocused, setPhoneFocused] = useState(false);
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
                p_description: description.trim(),
                p_incident_type: backendType,
                p_contact_phone: telephone.replace(/\s/g, ""),
                p_preferred_visit_date: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
                p_allow_access_without_presence: autoriseAcces
            });

            if (rpcError) throw rpcError;

            Alert.alert("Succès", "Votre incident a été déclaré avec succès.");
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

                <View
                    style={{
                        backgroundColor: "#f9fafb",
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        marginBottom: 24,
                        gap: 12,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#fff",
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            borderWidth: 1,
                            borderColor: phoneFocused ? "#3153A1" : "#e5e7eb",
                        }}
                    >
                        <Ionicons
                            name="call-outline"
                            size={18}
                            color="#9ca3af"
                            style={{ marginRight: 10 }}
                        />
                        <TextInput
                            placeholder="06 00 00 00 00"
                            placeholderTextColor="#9ca3af"
                            value={telephone}
                            onChangeText={(t) => setTelephone(formatPhone(t))}
                            onFocus={() => setPhoneFocused(true)}
                            onBlur={() => setPhoneFocused(false)}
                            keyboardType="phone-pad"
                            maxLength={14}
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
                        onPress={() => setShowDatePicker(!showDatePicker)}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#fff",
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            borderWidth: 1,
                            borderColor: showDatePicker
                                ? "#3153A1"
                                : "#e5e7eb",
                        }}
                    >
                        <Ionicons
                            name="calendar-outline"
                            size={18}
                            color="#9ca3af"
                            style={{ marginRight: 10 }}
                        />
                        <Text
                            style={{
                                flex: 1,
                                fontSize: 14,
                                color: selectedDate
                                    ? "#1e293b"
                                    : "#9ca3af",
                                fontFamily: "Montserrat_400Regular",
                            }}
                        >
                            {selectedDate
                                ? formatDateLabel(selectedDate)
                                : "Choisir une date"}
                        </Text>
                        <Ionicons
                            name={
                                showDatePicker
                                    ? "chevron-down"
                                    : "chevron-forward"
                            }
                            size={16}
                            color="#9ca3af"
                        />
                    </Pressable>

                    {showDatePicker && (
                        <MiniCalendar
                            selectedDate={selectedDate}
                            onSelect={(d) => {
                                setSelectedDate(d);
                                setShowDatePicker(false);
                            }}
                        />
                    )}

                    <Pressable
                        onPress={() => setAutoriseAcces(!autoriseAcces)}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 4,
                        }}
                    >
                        <View
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                backgroundColor: autoriseAcces
                                    ? "#3153A1"
                                    : "#fff",
                                borderWidth: autoriseAcces ? 0 : 1.5,
                                borderColor: "#d1d5db",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 10,
                            }}
                        >
                            {autoriseAcces && (
                                <Ionicons
                                    name="checkmark"
                                    size={15}
                                    color="#fff"
                                />
                            )}
                        </View>
                        <Text
                            style={{
                                flex: 1,
                                fontSize: 12,
                                color: "#374151",
                                fontFamily: "Montserrat_500Medium",
                                lineHeight: 17,
                            }}
                        >
                            Autorise le gestionnaire a acceder a mon logement
                            en mon absence
                        </Text>
                    </Pressable>
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

                <Text
                    style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        textAlign: "center",
                        fontFamily: "Montserrat_400Regular",
                    }}
                >
                    Vos informations sont sécurisées et nous contacterons
                    rapidement
                </Text>
            </View>
        </ScrollView>
    );
}

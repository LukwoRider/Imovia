import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

interface Property {
    id: string;
    address: string;
}

interface Tenant {
    id: string;
    full_name: string;
}

interface AjouterDocumentModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ownerId: string;
}

function formatDateLabel(d: Date): string {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

const DOCUMENT_TYPES = [
    { key: "contract", label: "Contrats" },
    { key: "inventory", label: "État des lieux" },
    { key: "other", label: "Autres" },
];

const MONTH_NAMES = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
    const d = new Date(year, month, 1).getDay();
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
            setViewMonth(11); setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0); setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const isSelected = (day: number) =>
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getFullYear() === viewYear;

    return (
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
                <Pressable onPress={prevMonth} hitSlop={10}>
                    <Ionicons name="chevron-back" size={20} color="#3153A1" />
                </Pressable>
                <Text style={styles.calendarTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
                <Pressable onPress={nextMonth} hitSlop={10}>
                    <Ionicons name="chevron-forward" size={20} color="#3153A1" />
                </Pressable>
            </View>
            <View style={styles.calendarDaysRow}>
                {DAY_LABELS.map((label: string) => (
                    <View key={label} style={styles.calendarDayLabelCell}>
                        <Text style={styles.calendarDayLabelText}>{label}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.calendarGrid}>
                {days.map((day, idx) => (
                    <View key={idx} style={styles.calendarCell}>
                        {day ? (
                            <Pressable
                                onPress={() => onSelect(new Date(viewYear, viewMonth, day))}
                                style={[styles.calendarDayButton, isSelected(day) && styles.calendarDaySelected]}
                            >
                                <Text style={[styles.calendarDayText, isSelected(day) && styles.calendarDayTextSelected]}>{day}</Text>
                            </Pressable>
                        ) : <View style={styles.calendarDayButton} />}
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function AjouterDocumentModal({ visible, onClose, onSuccess, ownerId }: AjouterDocumentModalProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPropertyPicker, setShowPropertyPicker] = useState(false);
    const [showTenantPicker, setShowTenantPicker] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<string>("other");
    const [showTypePicker, setShowTypePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchProperties();
        }
    }, [visible]);

    async function fetchProperties() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("properties")
                .select("id, address")
                .eq("owner_id", ownerId);
            if (error) throw error;
            setProperties(data || []);
        } catch (error: any) {
            console.error("Error fetching properties:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchTenants(propertyId: string) {
        setLoading(true);
        try {
            // Find the active lease for this property
            const { data: lease, error: leaseError } = await supabase
                .from("leases")
                .select("id")
                .eq("property_id", propertyId)
                .eq("status", "active")
                .maybeSingle();

            if (leaseError) throw leaseError;

            if (lease) {
                const { data: leaseTenants, error: ltError } = await supabase
                    .from("lease_tenants")
                    .select("tenant_id, profiles(full_name)")
                    .eq("lease_id", lease.id);

                if (ltError) throw ltError;

                const mappedTenants = (leaseTenants || []).map((lt: any) => ({
                    id: lt.tenant_id,
                    full_name: lt.profiles?.full_name || "Inconnu",
                }));
                setTenants(mappedTenants);
            } else {
                setTenants([]);
            }
        } catch (error: any) {
            console.error("Error fetching tenants:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleSelectProperty = (propertyId: string) => {
        setSelectedPropertyId(propertyId);
        setSelectedTenantId(null);
        setShowPropertyPicker(false);
        fetchTenants(propertyId);
    };

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "*/*",
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                setSelectedFile(result);
            }
        } catch (error) {
            console.error("Error picking file:", error);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !selectedPropertyId || !selectedFile || !selectedDate) {
            Alert.alert("Champs manquants", "Veuillez remplir toutes les informations nécessaires.");
            return;
        }

        setSubmitting(true);
        try {
            const { data: lease } = await supabase
                .from("leases")
                .select("id")
                .eq("property_id", selectedPropertyId)
                .eq("status", "active")
                .maybeSingle();

            if (!lease) throw new Error("Aucun bail actif trouvé pour ce logement.");

            if (selectedFile.canceled) return;
            const file = selectedFile.assets[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `leases/${lease.id}/${fileName}`;

            const response = await fetch(file.uri);
            const blob = await response.blob();

            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, blob, {
                    contentType: file.mimeType || "application/octet-stream",
                    cacheControl: "3600",
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { error: dbError } = await supabase.from("documents").insert({
                uploader_id: ownerId,
                property_id: selectedPropertyId,
                lease_id: lease.id,
                title: title.trim(),
                document_type: selectedDocType,
                storage_path: filePath,
                document_date: selectedDate.toISOString(),
                target_tenant_id: selectedTenantId,
            });

            if (dbError) throw dbError;

            Alert.alert("Succès", "Le document a été ajouté avec succès.");
            resetForm();
            onSuccess();
        } catch (error: any) {
            console.error("Error saving document:", error);
            Alert.alert("Erreur", error.message || "Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setSelectedPropertyId(null);
        setSelectedTenantId(null);
        setTenants([]);
        setSelectedFile(null);
        setSelectedDate(new Date());
        setShowDatePicker(false);
        setSelectedDocType("other");
        setShowTypePicker(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
    const selectedTenant = tenants.find(t => t.id === selectedTenantId);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>Ajouter un document</Text>
                            <Text style={styles.subtitle}>Partager un document{"\n"}Pensez à remplir toute les informations nécessaire</Text>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#64748b" />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        <View style={styles.field}>
                            <Text style={styles.label}>Titre document :</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ecrivez le titre de votre document"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Type de document :</Text>
                            <Pressable style={styles.pickerTrigger} onPress={() => setShowTypePicker(true)}>
                                <View style={styles.pickerInner}>
                                    <Text style={styles.pickerValue}>
                                        {DOCUMENT_TYPES.find(t => t.key === selectedDocType)?.label || "Choisir le type"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                                </View>
                            </Pressable>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Logement :</Text>
                                <Pressable style={styles.pickerTrigger} onPress={() => setShowPropertyPicker(true)}>
                                    <View style={styles.pickerInner}>
                                        <Text style={[styles.pickerValue, !selectedProperty && styles.placeholder]} numberOfLines={1}>
                                            {selectedProperty ? selectedProperty.address : "Choisir le logement"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                                    </View>
                                </Pressable>
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Locataire :</Text>
                                <Pressable style={styles.pickerTrigger} onPress={() => setShowTenantPicker(true)} disabled={!selectedPropertyId}>
                                    <View style={styles.pickerInner}>
                                        <Text style={[styles.pickerValue, !selectedTenant && styles.placeholder]} numberOfLines={1}>
                                            {selectedTenant ? selectedTenant.full_name : "Choisir le locataire"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                                    </View>
                                </Pressable>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Uploader document :</Text>
                                <Pressable style={styles.filePicker} onPress={handleFilePick}>
                                    <Text style={[styles.pickerValue, !selectedFile && styles.placeholder]} numberOfLines={1}>
                                        {selectedFile && !selectedFile.canceled ? selectedFile.assets[0].name : "Uploader votre fichier ici"}
                                    </Text>
                                </Pressable>
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Date du document :</Text>
                                <Pressable style={styles.pickerTrigger} onPress={() => setShowDatePicker(!showDatePicker)}>
                                    <View style={styles.pickerInner}>
                                        <Ionicons name="calendar-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
                                        <Text style={styles.pickerValue}>
                                            {selectedDate ? formatDateLabel(selectedDate) : "Choisir une date"}
                                        </Text>
                                    </View>
                                </Pressable>
                                {showDatePicker && (
                                    <View style={styles.calendarWrapper}>
                                        <MiniCalendar
                                            selectedDate={selectedDate}
                                            onSelect={(d) => { setSelectedDate(d); setShowDatePicker(false); }}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        <Pressable
                            onPress={handleSave}
                            disabled={submitting}
                            style={[styles.submitBtn, submitting && styles.btnDisabled]}
                        >
                            <View style={styles.submitBtnContent}>
                                {submitting ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : <Ionicons name="checkmark-done-outline" size={20} color="#fff" style={{ marginRight: 8 }} />}
                                <Text style={styles.submitBtnText}>Valider</Text>
                            </View>
                        </Pressable>

                        <Text style={styles.footerInfo}>Vos informations sont sécurisées et nous contacterons rapidement</Text>
                    </ScrollView>
                </View>
            </View>

            <Modal visible={showPropertyPicker} transparent animationType="fade">
                <View style={styles.subPickerOverlay}>
                    <View style={styles.subPickerContent}>
                        <View style={styles.subPickerHeader}>
                            <Text style={styles.subPickerTitle}>Choisir un logement</Text>
                            <Pressable onPress={() => setShowPropertyPicker(false)}><Ionicons name="close" size={24} color="#64748b" /></Pressable>
                        </View>
                        <ScrollView>
                            {loading ? <ActivityIndicator size="large" color="#3153A1" /> : properties.map(p => (
                                <Pressable key={p.id} style={styles.pickerItem} onPress={() => handleSelectProperty(p.id)}>
                                    <Text style={styles.pickerItemText}>{p.address}</Text>
                                </Pressable>
                            ))}
                            {!loading && properties.length === 0 && <Text style={styles.emptyText}>Aucun logement trouvé</Text>}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showTenantPicker} transparent animationType="fade">
                <View style={styles.subPickerOverlay}>
                    <View style={styles.subPickerContent}>
                        <View style={styles.subPickerHeader}>
                            <Text style={styles.subPickerTitle}>Choisir un locataire</Text>
                            <Pressable onPress={() => setShowTenantPicker(false)}><Ionicons name="close" size={24} color="#64748b" /></Pressable>
                        </View>
                        <ScrollView>
                            {loading ? <ActivityIndicator size="large" color="#3153A1" /> : tenants.map(t => (
                                <Pressable key={t.id} style={styles.pickerItem} onPress={() => { setSelectedTenantId(t.id); setShowTenantPicker(false); }}>
                                    <Text style={styles.pickerItemText}>{t.full_name}</Text>
                                </Pressable>
                            ))}
                            {!loading && tenants.length === 0 && <Text style={styles.emptyText}>Aucun locataire trouvé pour ce logement</Text>}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showTypePicker} transparent animationType="fade">
                <View style={styles.subPickerOverlay}>
                    <View style={styles.subPickerContent}>
                        <View style={styles.subPickerHeader}>
                            <Text style={styles.subPickerTitle}>Type de document</Text>
                            <Pressable onPress={() => setShowTypePicker(false)}><Ionicons name="close" size={24} color="#64748b" /></Pressable>
                        </View>
                        <ScrollView>
                            {DOCUMENT_TYPES.map(type => (
                                <Pressable key={type.key} style={styles.pickerItem} onPress={() => { setSelectedDocType(type.key); setShowTypePicker(false); }}>
                                    <Text style={styles.pickerItemText}>{type.label}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 12 },
    content: { backgroundColor: "#fff", borderRadius: 24, maxHeight: "95%", padding: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
    title: { fontSize: 20, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold" },
    subtitle: { fontSize: 12, color: "#9ca3af", marginTop: 4, fontFamily: "Montserrat_400Regular" },
    closeBtn: { padding: 4 },
    form: { flexGrow: 0 },
    row: { flexDirection: "row", gap: 12, marginBottom: 12, width: '100%' },
    field: { flex: 1, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: "700", color: "#1e293b", marginBottom: 6, fontFamily: "Montserrat_700Bold" },
    input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 12, height: 44, fontSize: 13, color: "#1e293b", fontFamily: "Montserrat_400Regular", marginBottom: 12 },
    pickerTrigger: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 12, height: 44, justifyContent: "center" },
    pickerInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    pickerValue: { fontSize: 13, color: "#1e293b", fontFamily: "Montserrat_400Regular" },
    placeholder: { color: "#94a3b8" },
    filePicker: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 12, height: 44, justifyContent: "center" },
    submitBtn: { backgroundColor: "#3153A1", borderRadius: 12, height: 50, justifyContent: "center", alignItems: "center", marginTop: 16 },
    btnDisabled: { opacity: 0.6 },
    submitBtnContent: { flexDirection: "row", alignItems: "center" },
    submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Montserrat_700Bold" },
    footerInfo: { textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 12, fontFamily: "Montserrat_400Regular" },
    calendarWrapper: { position: "absolute", top: 48, left: 0, right: 0, zIndex: 1000 },
    calendarContainer: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#3153A1", padding: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    calendarTitle: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
    calendarDaysRow: { flexDirection: "row", marginBottom: 4 },
    calendarDayLabelCell: { flex: 1, alignItems: "center" },
    calendarDayLabelText: { fontSize: 10, color: "#9ca3af", fontWeight: "600" },
    calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
    calendarCell: { width: "14.28%", alignItems: "center", paddingVertical: 2 },
    calendarDayButton: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    calendarDaySelected: { backgroundColor: "#3153A1" },
    calendarDayText: { fontSize: 12, color: "#374151" },
    calendarDayTextSelected: { color: "#fff", fontWeight: "700" },
    subPickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
    subPickerContent: { backgroundColor: "#fff", borderRadius: 16, padding: 20, maxHeight: "60%" },
    subPickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    subPickerTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
    pickerItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    pickerItemText: { fontSize: 13, color: "#1e293b" },
    emptyText: { textAlign: "center", color: "#9ca3af", padding: 20 },
});

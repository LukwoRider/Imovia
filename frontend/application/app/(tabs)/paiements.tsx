import { BailLocation } from "@/components/rentals/BailLocation";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { getAvailableProperties, getPotentialTenants, onboardTenant } from "@/lib/supabase/owner-actions";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, TextInput, TouchableOpacity, View } from "react-native";

export default function PaymentsPage() {
    const [leases, setLeases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(1);
    const [availableProperties, setAvailableProperties] = useState<any[]>([]);
    const [potentialTenants, setPotentialTenants] = useState<any[]>([]);
    const [tenantSearchQuery, setTenantSearchQuery] = useState("");
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
    const [foundTenant, setFoundTenant] = useState<any>(null);
    const [onboardingForm, setOnboardingForm] = useState({
        rentAmount: "",
        chargesAmount: "",
        paymentDay: "5",
        startDate: new Date().toISOString().split('T')[0]
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const filteredTenants = useMemo(() => {
        if (!tenantSearchQuery.trim()) return potentialTenants;
        return potentialTenants.filter(t =>
            t.full_name?.toLowerCase().includes(tenantSearchQuery.toLowerCase()) ||
            t.email?.toLowerCase().includes(tenantSearchQuery.toLowerCase())
        );
    }, [tenantSearchQuery, potentialTenants]);

    const fetchLeases = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('leases')
                .select(`
                    *,
                    property:properties(*),
                    tenants:lease_tenants(profiles(*))
                `)
                .eq('owner_id', user.id)
                .eq('status', 'active')
                .order('start_date', { ascending: false });

            if (error) throw error;

            const transformedData = (data || []).map(lease => ({
                ...lease,
                tenants: (lease.tenants as any[])?.map((t) => ({
                    id: t.profiles.id,
                    full_name: t.profiles.full_name,
                    email: t.profiles.email,
                    phone: t.profiles.phone
                })) || []
            }));

            setLeases(transformedData);
        } catch (error) {
            console.error("Error fetching leases:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLeases();
    }, [fetchLeases]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeases();
    };

    const handleOpenAddModal = async () => {
        setIsProcessing(true);
        try {
            const [props, tenants] = await Promise.all([
                getAvailableProperties(),
                getPotentialTenants()
            ]);
            setAvailableProperties(props);
            setPotentialTenants(tenants);
            setIsAddModalVisible(true);
            setOnboardingStep(1);
            setSelectedProperty(null);
            setTenantSearchQuery("");
            setFoundTenant(null);
        } catch (error: any) {
            Alert.alert("Erreur", error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSelectTenant = (tenant: any) => {
        setFoundTenant(tenant);
        setOnboardingStep(3);
    };

    const handleFinishOnboarding = async () => {
        if (!selectedProperty || !foundTenant) return;
        setIsProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await onboardTenant({
                propertyId: selectedProperty.id,
                ownerId: user!.id,
                tenantId: foundTenant.id,
                startDate: onboardingForm.startDate,
                rentAmount: parseInt(onboardingForm.rentAmount) || 0,
                chargesAmount: parseInt(onboardingForm.chargesAmount) || 0,
                paymentDay: parseInt(onboardingForm.paymentDay) || 5,
            });
            Alert.alert("Succès", "Locataire ajouté avec succès !");
            setIsAddModalVisible(false);
            fetchLeases();
        } catch (error: any) {
            Alert.alert("Erreur", error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3153A1"]} />
                }
            >
                <LinearGradient
                    colors={["#1e3a6d", "#3153A1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        paddingTop: 56,
                        paddingBottom: 24,
                        paddingHorizontal: 20,
                        borderBottomLeftRadius: 24,
                        borderBottomRightRadius: 24,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <Image
                                source={require("@/assets/images/logo-white.svg")}
                                style={{ width: 90, height: 24 }}
                                contentFit="contain"
                            />
                            <Text
                                style={{
                                    color: "#fff",
                                    fontSize: 20,
                                    fontWeight: "700",
                                    marginTop: 4,
                                    fontFamily: "Montserrat_700Bold",
                                }}
                            >
                                Mes locations
                            </Text>
                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.7)",
                                    fontSize: 13,
                                    marginTop: 3,
                                    fontFamily: "Montserrat_400Regular",
                                }}
                            >
                                Gérez vos baux et vos locataires
                            </Text>
                        </View>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <NotificationBellButton />
                            <ProfileHeaderButton />
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16, marginTop: 20, paddingBottom: 100 }}>
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold", marginBottom: 12 }}>
                            Baux actifs
                        </Text>
                        <Pressable
                            onPress={handleOpenAddModal}
                            disabled={isProcessing}
                            style={{
                                backgroundColor: isProcessing ? "#cbd5e1" : "#3153A1",
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#3153A1",
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 4
                            }}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={{ color: "#fff", fontWeight: "700", fontFamily: "Montserrat_700Bold" }}>
                                        Ajouter un locataire
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>

                    {loading ? (
                        <View style={{ padding: 40, alignItems: "center" }}>
                            <ActivityIndicator size="large" color="#3153A1" />
                            <Text style={{ color: "#6b7280", marginTop: 12, fontFamily: "Montserrat_500Medium" }}>Chargement des locations...</Text>
                        </View>
                    ) : leases.length > 0 ? (
                        leases.map((lease) => (
                            <BailLocation key={lease.id} lease={lease} onRefresh={fetchLeases} />
                        ))
                    ) : (
                        <View style={{ padding: 40, alignItems: "center", backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "dashed" }}>
                            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                            <Text style={{
                                color: "#6b7280",
                                fontFamily: "Montserrat_500Medium",
                                marginTop: 16,
                                textAlign: "center"
                            }}>
                                Aucun bail actif trouvé.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 60 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 20 }}>
                        <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#1e293b" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 20, fontWeight: "700", marginLeft: 16, fontFamily: "Montserrat_700Bold" }}>
                            Ajouter un locataire
                        </Text>
                    </View>

                    <ScrollView style={{ paddingHorizontal: 20 }}>
                        <View style={{ flexDirection: "row", marginBottom: 30, gap: 4 }}>
                            {[1, 2, 3].map(step => (
                                <View key={step} style={{
                                    flex: 1,
                                    height: 4,
                                    backgroundColor: step <= onboardingStep ? "#3153A1" : "#f1f5f9",
                                    borderRadius: 2
                                }} />
                            ))}
                        </View>

                        {onboardingStep === 1 && (
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 8 }}>Sélectionner un bien</Text>
                                <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Choisissez le logement pour ce nouveau bail.</Text>

                                {availableProperties.map(prop => (
                                    <TouchableOpacity
                                        key={prop.id}
                                        onPress={() => setSelectedProperty(prop)}
                                        style={{
                                            padding: 16,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderColor: selectedProperty?.id === prop.id ? "#3153A1" : "#f1f5f9",
                                            marginBottom: 12,
                                            backgroundColor: selectedProperty?.id === prop.id ? "#3153A105" : "#fff"
                                        }}
                                    >
                                        <Text style={{ fontWeight: "700", color: "#1e293b" }}>{prop.address}</Text>
                                        <Text style={{ fontSize: 13, color: "#64748b" }}>{prop.surface_m2}m² • {prop.rooms} pièces</Text>
                                    </TouchableOpacity>
                                ))}

                                {availableProperties.length === 0 && (
                                    <View style={{ padding: 30, alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 16 }}>
                                        <Ionicons name="home-outline" size={40} color="#cbd5e1" />
                                        <Text style={{ textAlign: "center", color: "#64748b", marginTop: 12 }}>Aucun bien disponible. Veuillez d'abord ajouter un bien ou clore les baux existants.</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    disabled={!selectedProperty}
                                    onPress={() => setOnboardingStep(2)}
                                    style={{
                                        backgroundColor: selectedProperty ? "#3153A1" : "#cbd5e1",
                                        padding: 16,
                                        borderRadius: 12,
                                        alignItems: "center",
                                        marginTop: 20
                                    }}
                                >
                                    <Text style={{ color: "#fff", fontWeight: "700" }}>Continuer</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {onboardingStep === 2 && (
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 8 }}>Sélectionner le locataire</Text>
                                <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Choisissez le locataire dans la liste ci-dessous.</Text>

                                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 12, marginBottom: 16 }}>
                                    <Ionicons name="search" size={20} color="#94a3b8" />
                                    <TextInput
                                        placeholder="Rechercher par nom ou email..."
                                        value={tenantSearchQuery}
                                        onChangeText={setTenantSearchQuery}
                                        style={{ flex: 1, padding: 12, fontSize: 16, fontFamily: "Montserrat_400Regular" }}
                                    />
                                </View>

                                {filteredTenants.length > 0 ? (
                                    filteredTenants.map(tenant => (
                                        <TouchableOpacity
                                            key={tenant.id}
                                            onPress={() => handleSelectTenant(tenant)}
                                            style={{
                                                padding: 16,
                                                borderRadius: 12,
                                                backgroundColor: "#f8fafc",
                                                marginBottom: 10,
                                                borderWidth: 1,
                                                borderColor: "#e2e8f0"
                                            }}
                                        >
                                            <Text style={{ fontWeight: "700", color: "#1e293b" }}>{tenant.full_name}</Text>
                                            <Text style={{ fontSize: 13, color: "#64748b" }}>{tenant.email}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={{ padding: 40, alignItems: "center" }}>
                                        <Text style={{ color: "#94a3b8", textAlign: "center" }}>Aucun locataire trouvé.</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={() => setOnboardingStep(1)}
                                    style={{ padding: 16, alignItems: "center", marginTop: 10 }}
                                >
                                    <Text style={{ color: "#64748b" }}>Retour</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {onboardingStep === 3 && (
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 8 }}>Détails du bail</Text>
                                <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>Finalisez les conditions du contrat pour {foundTenant?.full_name}.</Text>

                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: "700" }}>LOYER DE BASE (€)</Text>
                                    <TextInput
                                        value={onboardingForm.rentAmount}
                                        onChangeText={val => setOnboardingForm({ ...onboardingForm, rentAmount: val })}
                                        keyboardType="numeric"
                                        style={{ backgroundColor: "#f8fafc", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", fontFamily: "Montserrat_400Regular" }}
                                    />
                                </View>

                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: "700" }}>CHARGES (€)</Text>
                                    <TextInput
                                        value={onboardingForm.chargesAmount}
                                        onChangeText={val => setOnboardingForm({ ...onboardingForm, chargesAmount: val })}
                                        keyboardType="numeric"
                                        style={{ backgroundColor: "#f8fafc", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", fontFamily: "Montserrat_400Regular" }}
                                    />
                                </View>

                                <View style={{ marginBottom: 24 }}>
                                    <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: "700" }}>JOUR DE PAIEMENT</Text>
                                    <TextInput
                                        value={onboardingForm.paymentDay}
                                        onChangeText={val => setOnboardingForm({ ...onboardingForm, paymentDay: val })}
                                        keyboardType="numeric"
                                        style={{ backgroundColor: "#f8fafc", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", fontFamily: "Montserrat_400Regular" }}
                                    />
                                </View>

                                <TouchableOpacity
                                    disabled={isProcessing}
                                    onPress={handleFinishOnboarding}
                                    style={{
                                        backgroundColor: "#08cb56",
                                        padding: 16,
                                        borderRadius: 12,
                                        alignItems: "center"
                                    }}
                                >
                                    {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Finaliser et Activer le bail</Text>}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setOnboardingStep(2)}
                                    style={{ padding: 16, alignItems: "center", marginTop: 10 }}
                                >
                                    <Text style={{ color: "#64748b" }}>Retour</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

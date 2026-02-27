import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, View } from "react-native";

type LogementData = {
    titre: string;
    adresse: string;
    surface: number;
    pieces: number;
    loyer: number;
    meuble: boolean;
    description: string;
};

type ContratData = {
    debut: string;
    finPrevue: string;
    depotGarantie: string;
    totalMensuel: string;
};

type ProprietaireData = {
    nom: string;
    tel: string;
    email: string;
};

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: string;
}) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f9fafb",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#f3f4f6",
            }}
        >
            <View
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: "#eef2ff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                }}
            >
                <Ionicons name={icon as any} size={14} color="#3153A1" />
            </View>
            <Text
                style={{
                    flex: 1,
                    fontSize: 13,
                    color: "#374151",
                    fontFamily: "Montserrat_500Medium",
                }}
            >
                {label}
            </Text>
            <Text
                style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#1e293b",
                    fontFamily: "Montserrat_600SemiBold",
                }}
            >
                {value}
            </Text>
        </View>
    );
}

function ContactRow({
    icon,
    text,
}: {
    icon: string;
    text: string;
}) {
    if (!text) return null;
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f9fafb",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: "#f3f4f6",
            }}
        >
            <View
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: "#eef2ff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                }}
            >
                <Ionicons name={icon as any} size={14} color="#3153A1" />
            </View>
            <Text
                style={{
                    fontSize: 13,
                    color: "#1e293b",
                    fontFamily: "Montserrat_500Medium",
                }}
            >
                {text}
            </Text>
        </View>
    );
}

function Badge({ icon, label }: { icon: string; label: string }) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f9fafb",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: "#e5e7eb",
            }}
        >
            <Ionicons name={icon as any} size={14} color="#6b7280" />
            <Text
                style={{
                    fontSize: 12,
                    color: "#374151",
                    marginLeft: 6,
                    fontWeight: "500",
                    fontFamily: "Montserrat_500Medium",
                }}
            >
                {label}
            </Text>
        </View>
    );
}

export default function LogementPage() {
    const scrollViewRef = useRef<ScrollView>(null);
    useScrollToTopOnFocus(scrollViewRef);

    const [loading, setLoading] = useState(true);
    const [logement, setLogement] = useState<LogementData | null>(null);
    const [contrat, setContrat] = useState<ContratData | null>(null);
    const [proprietaire, setProprietaire] = useState<ProprietaireData | null>(null);

    useEffect(() => {
        fetchLogementData();
    }, []);

    async function fetchLogementData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Utilisateur non connecté");

            const { data: leaseRows, error: leaseError } = await supabase
                .from("lease_tenants")
                .select(`
                    lease_id,
                    leases (
                        *,
                        properties (
                            *,
                            profiles:owner_id (
                                full_name,
                                phone
                            )
                        )
                    )
                `)
                .eq("tenant_id", user.id);

            if (leaseError) throw leaseError;

            const leaseCandidates = (leaseRows || [])
                .map((row: any) => {
                    const lease = Array.isArray(row.leases) ? row.leases[0] : row.leases;
                    return lease ? { lease_id: row.lease_id, lease } : null;
                })
                .filter(Boolean) as { lease_id: string; lease: any }[];

            const selectedLease =
                leaseCandidates
                    .filter(({ lease }) => lease?.status === "active")
                    .sort((a, b) => new Date(b.lease.start_date || 0).getTime() - new Date(a.lease.start_date || 0).getTime())[0]
                ?? leaseCandidates
                    .sort((a, b) => new Date(b.lease.start_date || 0).getTime() - new Date(a.lease.start_date || 0).getTime())[0];

            if (!selectedLease?.lease) {
                setLogement(null);
                setContrat(null);
                setProprietaire(null);
                return;
            }

            const l = selectedLease.lease as any;
            const p = l.properties;
            const owner = p.profiles;

            setLogement({
                titre: p.title || "Votre logement",
                adresse: p.address || "Adresse non renseignée",
                surface: p.surface_m2 || 0,
                pieces: p.rooms || 0,
                loyer: l.rent_amount || 0,
                meuble: p.is_furnished || false,
                description: p.description || "Aucune description disponible.",
            });

            setContrat({
                debut: l.start_date ? new Date(l.start_date).toLocaleDateString("fr-FR") : "N/C",
                finPrevue: l.end_date ? new Date(l.end_date).toLocaleDateString("fr-FR") : "Indéterminée",
                depotGarantie: l.deposit_amount ? `${l.deposit_amount}€` : "Non spécifié",
                totalMensuel: l.rent_amount ? `${Number(l.rent_amount) + Number(l.charges_amount || 0)}€` : "Non spécifié",
            });

            setProprietaire({
                nom: owner?.full_name || "Propriétaire",
                tel: owner?.phone || "Non renseigné",
                email: "Non renseignée", // Not in profiles table by default in this schema
            });

        } catch (error: any) {
            console.error("[Logement] Fetch error:", error);
            Alert.alert("Erreur", "Impossible de charger les données du logement.");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#f9fafb", justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#3153A1" />
                <Text style={{ marginTop: 12, color: "#6b7280", fontFamily: "Montserrat_500Medium" }}>Chargement...</Text>
            </View>
        );
    }

    if (!logement) {
        return (
            <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
                <View style={{ paddingTop: 60, paddingHorizontal: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>Mon Logement</Text>
                    <View style={{ marginTop: 40, alignItems: "center" }}>
                        <Ionicons name="home-outline" size={60} color="#d1d5db" />
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280", marginTop: 16 }}>Aucun logement trouvé</Text>
                        <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 8, textAlign: "center" }}>
                            Vous n'avez pas de bail actif associé à votre compte.
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
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
                                Mon Logement
                            </Text>
                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.7)",
                                    fontSize: 13,
                                    marginTop: 3,
                                    fontFamily: "Montserrat_400Regular",
                                }}
                            >
                                Accédez à tous vos documents de location
                            </Text>
                        </View>
                        <View
                            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                        >
                            <NotificationBellButton />
                            <ProfileHeaderButton />
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            marginBottom: 14,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 14,
                            }}
                        >
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    backgroundColor: "#eef2ff",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                }}
                            >
                                <Ionicons name="home-outline" size={20} color="#3153A1" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: "700",
                                        color: "#1e293b",
                                        fontFamily: "Montserrat_700Bold",
                                    }}
                                    numberOfLines={1}
                                >
                                    {logement.titre}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: "#9ca3af",
                                        marginTop: 2,
                                        fontFamily: "Montserrat_400Regular",
                                    }}
                                    numberOfLines={1}
                                >
                                    {logement.adresse}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: 8,
                                marginBottom: 16,
                            }}
                        >
                            <Badge icon="resize-outline" label={`${logement.surface} m²`} />
                            {logement.pieces > 0 && <Badge icon="grid-outline" label={`${logement.pieces} Pièces`} />}
                            {logement.meuble ? (
                                <Badge icon="bed-outline" label="Meublé" />
                            ) : null}
                            <Badge icon="cash-outline" label={`${logement.loyer} €`} />
                        </View>

                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: "700",
                                color: "#1e293b",
                                marginBottom: 8,
                                fontFamily: "Montserrat_700Bold",
                            }}
                        >
                            Description
                        </Text>
                        <Text
                            style={{
                                fontSize: 13,
                                color: "#374151",
                                lineHeight: 20,
                                fontFamily: "Montserrat_400Regular",
                            }}
                        >
                            {logement.description}
                        </Text>
                    </View>

                    {contrat && (
                        <View
                            style={{
                                backgroundColor: "#fff",
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                marginBottom: 14,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 14,
                                }}
                            >
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 12,
                                        backgroundColor: "#eef2ff",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 12,
                                    }}
                                >
                                    <Ionicons
                                        name="document-text-outline"
                                        size={20}
                                        color="#3153A1"
                                    />
                                </View>
                                <View>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            color: "#1e293b",
                                            fontFamily: "Montserrat_700Bold",
                                        }}
                                    >
                                        Contrat de location
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            color: "#9ca3af",
                                            marginTop: 1,
                                            fontFamily: "Montserrat_400Regular",
                                        }}
                                    >
                                        Détails de votre engagement
                                    </Text>
                                </View>
                            </View>

                            <InfoRow
                                icon="calendar-outline"
                                label="Début"
                                value={contrat.debut}
                            />
                            <InfoRow
                                icon="time-outline"
                                label="Fin prévue"
                                value={contrat.finPrevue}
                            />
                            <InfoRow
                                icon="shield-checkmark-outline"
                                label="Dépôt de garantie"
                                value={contrat.depotGarantie}
                            />
                            <InfoRow
                                icon="wallet-outline"
                                label="Total mensuel"
                                value={contrat.totalMensuel}
                            />
                        </View>
                    )}

                    {proprietaire && (
                        <View
                            style={{
                                backgroundColor: "#fff",
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                marginBottom: 14,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginBottom: 14,
                                }}
                            >
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 12,
                                        backgroundColor: "#eef2ff",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 12,
                                    }}
                                >
                                    <Ionicons
                                        name="people-outline"
                                        size={20}
                                        color="#3153A1"
                                    />
                                </View>
                                <View>
                                    <Text
                                        style={{
                                            fontSize: 15,
                                            fontWeight: "700",
                                            color: "#1e293b",
                                            fontFamily: "Montserrat_700Bold",
                                        }}
                                    >
                                        Contact Propriétaire
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            color: "#9ca3af",
                                            marginTop: 1,
                                            fontFamily: "Montserrat_400Regular",
                                        }}
                                    >
                                        Informations de contact
                                    </Text>
                                </View>
                            </View>

                            <ContactRow icon="person-outline" text={proprietaire.nom} />
                            <ContactRow icon="call-outline" text={proprietaire.tel} />
                            {proprietaire.email !== "Non renseignée" && <ContactRow icon="mail-outline" text={proprietaire.email} />}

                            <Pressable
                                onPress={() => {
                                    if (proprietaire?.tel && proprietaire.tel !== "Non renseigné") {
                                        Linking.openURL(`tel:${proprietaire.tel}`);
                                    } else {
                                        Alert.alert("Information", "Aucun numéro de téléphone renseigné.");
                                    }
                                }}
                                style={{
                                    backgroundColor: "#3153A1",
                                    borderRadius: 12,
                                    paddingVertical: 14,
                                    paddingHorizontal: 24,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginTop: 8,
                                }}
                            >
                                <Ionicons
                                    name="call-outline"
                                    size={16}
                                    color="#fff"
                                    style={{ marginRight: 8 }}
                                />
                                <Text
                                    style={{
                                        color: "#fff",
                                        fontSize: 14,
                                        fontWeight: "600",
                                        fontFamily: "Montserrat_600SemiBold",
                                    }}
                                >
                                    Contacter
                                </Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

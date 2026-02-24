import IncidentCard from "@/components/incidents/IncidentCard";
import PaginationBar from "@/components/incidents/PaginationBar";
import { ITEMS_PER_PAGE, STATUS_FILTERS, type Incident, type IncidentStatus } from "@/components/incidents/types";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View, Pressable } from "react-native";

function mapBackendStatus(status?: string | null): Incident["statut"] {
    switch (status) {
        case "resolved":
            return "resolus";
        case "in_progress":
            return "en_cours";
        case "open":
        default:
            return "attente";
    }
}

function durationLabel(status?: string | null, createdAt?: string | null) {
    if (!createdAt) return "Statut inconnu";
    const start = new Date(createdAt);
    const now = new Date();
    const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    if (status === "resolved") return `Resolu le ${now.toLocaleDateString("fr-FR")}`;
    return `En cours depuis ${days} jour${days > 1 ? "s" : ""}`;
}

export default function ProprietaireIncidentsPage() {
    const scrollViewRef = useRef<ScrollView>(null);
    useScrollToTopOnFocus(scrollViewRef);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<IncidentStatus>("tous");
    const [currentPage, setCurrentPage] = useState(1);
    const [incidents, setIncidents] = useState<Incident[]>([]);

    useEffect(() => {
        fetchIncidents();
    }, []);

    async function fetchIncidents() {
        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                setIncidents([]);
                return;
            }

            let dbIncidents: any[] = [];
            try {
                const { data } = await supabase
                    .from("incidents")
                    .select(`
                        id,
                        title,
                        description,
                        created_at,
                        updated_at,
                        status,
                        location_details,
                        properties!inner (
                            owner_id
                        )
                    `)
                    .eq("properties.owner_id", user.id)
                    .order("created_at", { ascending: false });
                dbIncidents = data || [];
            } catch (e) {
                console.error("[OwnerIncidents] Join fetch error:", e);
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, phone")
                .eq("id", user.id)
                .maybeSingle();

            const managerName = profile?.full_name || "Imovia";
            const managerPhone = profile?.phone || "Non renseigne";

            const mapped: Incident[] = dbIncidents.map((inc: any) => ({
                id: String(inc.id),
                titre: inc.title || inc.description?.split("\n")?.[0] || "Incident",
                dateDeclaration: new Date(inc.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }).replace(",", " a"),
                description: inc.description || "Aucune description",
                localisation: inc.location_details || "Localisation non precisee",
                statut: mapBackendStatus(inc.status),
                dureeLabel: durationLabel(inc.status, inc.created_at),
                gestionnaireNom: managerName,
                gestionnaireTel: managerPhone,
            }));

            setIncidents(mapped);
        } catch (error) {
            console.error("[OwnerIncidents] Fetch error:", error);
            setIncidents([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredIncidents = useMemo(() => {
        let list = incidents;
        if (activeFilter !== "tous") list = list.filter((i) => i.statut === activeFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (i) =>
                    i.titre.toLowerCase().includes(q) ||
                    i.description.toLowerCase().includes(q) ||
                    i.localisation.toLowerCase().includes(q),
            );
        }
        return list;
    }, [incidents, activeFilter, search]);

    const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedIncidents = filteredIncidents.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, search]);

    return (
        <View style={{ flex: 1, backgroundColor: "#f3f4f8" }}>
            <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 28 }}>
                <LinearGradient
                    colors={["#18A6E3", "#0D51C5", "#0A2B97"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        paddingTop: 56,
                        paddingBottom: 28,
                        paddingHorizontal: 20,
                        borderBottomLeftRadius: 24,
                        borderBottomRightRadius: 24,
                    }}
                >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Image source={require("@/assets/images/logo-white.svg")} style={{ width: 96, height: 26 }} contentFit="contain" />
                            <Text style={{ color: "#fff", fontSize: 18, marginTop: 8, fontFamily: "Montserrat_700Bold" }}>
                                Incidents
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, marginTop: 4, fontFamily: "Montserrat_400Regular" }}>
                                Suivez et gerez tous les incidents signales
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <NotificationBellButton />
                            <ProfileHeaderButton />
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 12,
                            marginBottom: 12,
                        }}
                    >
                        <Ionicons name="search-outline" size={16} color="#9ca3af" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search..."
                            placeholderTextColor="#9ca3af"
                            style={{
                                flex: 1,
                                height: 42,
                                marginLeft: 8,
                                color: "#1e293b",
                                fontFamily: "Montserrat_400Regular",
                            }}
                        />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                backgroundColor: "#fff",
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: "#c7d2fe",
                                padding: 4,
                                gap: 4,
                            }}
                        >
                            {STATUS_FILTERS.map((filter) => {
                                const active = activeFilter === filter.key;
                                return (
                                    <Pressable
                                        key={filter.key}
                                        onPress={() => setActiveFilter(filter.key)}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            borderRadius: 8,
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            backgroundColor: active ? "#eef2ff" : "transparent",
                                        }}
                                    >
                                        <Ionicons name={filter.icon as any} size={14} color="#3153A1" />
                                        <Text style={{ marginLeft: 6, color: "#1f2937", fontSize: 12, fontFamily: "Montserrat_500Medium" }}>
                                            {filter.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <View style={{ marginTop: 8 }}>
                        {loading ? (
                            <View
                                style={{
                                    backgroundColor: "#fff",
                                    borderRadius: 14,
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    paddingVertical: 24,
                                    alignItems: "center",
                                }}
                            >
                                <ActivityIndicator size="small" color="#3153A1" />
                                <Text style={{ marginTop: 10, color: "#6b7280" }}>Chargement des incidents...</Text>
                            </View>
                        ) : pagedIncidents.length > 0 ? (
                            <>
                                {pagedIncidents.map((incident) => (
                                    <IncidentCard key={incident.id} incident={incident} />
                                ))}
                                <PaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </>
                        ) : (
                            <View
                                style={{
                                    backgroundColor: "#fff",
                                    borderRadius: 14,
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    paddingVertical: 24,
                                    alignItems: "center",
                                }}
                            >
                                <Ionicons name="warning-outline" size={22} color="#9ca3af" />
                                <Text style={{ marginTop: 10, color: "#6b7280", fontStyle: "italic" }}>
                                    Aucun incident trouve.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

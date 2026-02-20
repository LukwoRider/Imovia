import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";

import DeclarerIncidentView from "@/components/incidents/DeclarerIncidentModal";
import IncidentCard from "@/components/incidents/IncidentCard";
import PaginationBar from "@/components/incidents/PaginationBar";
import {
    ITEMS_PER_PAGE,
    STATUS_FILTERS,
    type Incident,
    type IncidentStatus,
} from "@/components/incidents/types";

export default function IncidentsPage() {
    const scrollViewRef = useRef<ScrollView>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<IncidentStatus>("tous");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchFocused, setSearchFocused] = useState(false);
    const [showDeclarer, setShowDeclarer] = useState(false);

    useEffect(() => {
        fetchIncidents();
    }, []);

    async function fetchIncidents() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch leases for this tenant
            const { data: leases, error: leaseError } = await supabase
                .from("lease_tenants")
                .select("lease_id")
                .eq("tenant_id", user.id);

            if (leaseError) throw leaseError;

            const leaseIds = leases?.map(l => l.lease_id) || [];
            if (leaseIds.length === 0) {
                setIncidents([]);
                return;
            }

            // Fetch incidents for these leases
            const { data: dbIncidents, error: incError } = await supabase
                .from("incidents")
                .select(`
                    id,
                    title,
                    description,
                    created_at,
                    updated_at,
                    status,
                    location_details,
                    properties (
                        owner_id,
                        profiles:owner_id (
                            full_name,
                            phone
                        )
                    )
                `)
                .in("lease_id", leaseIds)
                .order("created_at", { ascending: false });

            if (incError) throw incError;

            const mapped: Incident[] = (dbIncidents || []).map(inc => {
                const owner = (inc.properties as any)?.profiles;
                return {
                    id: inc.id,
                    titre: inc.title || "Sans titre",
                    dateDeclaration: new Date(inc.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }).replace(",", " à"),
                    description: inc.description || "",
                    localisation: inc.location_details || "Non précisé",
                    statut: mapBackendStatus(inc.status),
                    dureeLabel: calculateDurationLabel(inc.status, inc.created_at, inc.updated_at),
                    gestionnaireNom: owner?.full_name || "Imovia",
                    gestionnaireTel: owner?.phone || "Non renseigné",
                };
            });

            setIncidents(mapped);
        } catch (error: any) {
            console.error("[Incidents] Fetch error:", error);
            Alert.alert("Erreur", "Impossible de charger les incidents.");
        } finally {
            setLoading(false);
        }
    }

    function mapBackendStatus(status: string): Incident["statut"] {
        switch (status) {
            case "resolved": return "resolus";
            case "in_progress": return "en_cours";
            case "open":
            default: return "attente";
        }
    }

    function calculateDurationLabel(status: string, createdAt: string, updatedAt?: string): string {
        const start = new Date(createdAt);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (status === "resolved") {
            const end = updatedAt ? new Date(updatedAt) : now;
            return `Résolu le ${end.toLocaleDateString("fr-FR")}`;
        }

        if (status === "in_progress") {
            return `En cours depuis ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
        }

        return `En attente depuis ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
    }

    useScrollToTopOnFocus(scrollViewRef);

    const filteredIncidents = useMemo(() => {
        let list = incidents;

        if (activeFilter !== "tous") {
            list = list.filter((inc) => inc.statut === activeFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (inc) =>
                    inc.titre.toLowerCase().includes(q) ||
                    inc.description.toLowerCase().includes(q) ||
                    inc.localisation.toLowerCase().includes(q)
            );
        }

        return list;
    }, [search, activeFilter, incidents]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE)
    );
    const safePage = Math.min(currentPage, totalPages);
    const pagedIncidents = filteredIncidents.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    const handleFilterChange = (filter: IncidentStatus) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
                {showDeclarer ? (
                    <>
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
                                        Incidents
                                    </Text>
                                    <Text
                                        style={{
                                            color: "rgba(255,255,255,0.7)",
                                            fontSize: 13,
                                            marginTop: 3,
                                            fontFamily: "Montserrat_400Regular",
                                        }}
                                    >
                                        Suivez et gérez tous les incidents signalés
                                        {"\n"}dans votre logement
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
                        <DeclarerIncidentView onBack={() => setShowDeclarer(false)} />
                    </>
                ) : (
                    <>
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
                                        Incidents
                                    </Text>
                                    <Text
                                        style={{
                                            color: "rgba(255,255,255,0.7)",
                                            fontSize: 13,
                                            marginTop: 3,
                                            fontFamily: "Montserrat_400Regular",
                                        }}
                                    >
                                        Suivez et gérez tous les incidents signalés
                                        {"\n"}dans votre logement
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

                        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
                            <Pressable
                                onPress={() => setShowDeclarer(true)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    alignSelf: "flex-start",
                                    backgroundColor: "#1e3a6d",
                                    borderRadius: 12,
                                    paddingVertical: 12,
                                    paddingHorizontal: 20,
                                    marginBottom: 14,
                                }}
                            >
                                <Ionicons
                                    name="construct-outline"
                                    size={16}
                                    color="#fff"
                                    style={{ marginRight: 10 }}
                                />
                                <Text
                                    style={{
                                        color: "#fff",
                                        fontSize: 13,
                                        fontWeight: "700",
                                        fontFamily: "Montserrat_700Bold",
                                    }}
                                >
                                    Déclarer un incident
                                </Text>
                            </Pressable>

                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: "#fff",
                                    borderRadius: 12,
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    borderWidth: 1,
                                    borderColor: searchFocused ? "#3153A1" : "#e5e7eb",
                                    marginBottom: 14,
                                }}
                            >
                                <Ionicons
                                    name="search-outline"
                                    size={18}
                                    color="#9ca3af"
                                    style={{ marginRight: 10 }}
                                />
                                <TextInput
                                    placeholder="Rechercher"
                                    placeholderTextColor="#9ca3af"
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    value={search}
                                    onChangeText={(t) => {
                                        setSearch(t);
                                        setCurrentPage(1);
                                    }}
                                    selectionColor="#3153A1"
                                    cursorColor="#3153A1"
                                    style={
                                        {
                                            flex: 1,
                                            fontSize: 14,
                                            color: "#1e293b",
                                            fontFamily: "Montserrat_400Regular",
                                            padding: 0,
                                            outlineStyle: "none",
                                        } as any
                                    }
                                />
                                {search.length > 0 && (
                                    <Pressable
                                        onPress={() => {
                                            setSearch("");
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={18}
                                            color="#9ca3af"
                                        />
                                    </Pressable>
                                )}
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{
                                    gap: 6,
                                    paddingBottom: 14,
                                }}
                            >
                                {STATUS_FILTERS.map((filter) => {
                                    const active = activeFilter === filter.key;
                                    return (
                                        <Pressable
                                            key={filter.key}
                                            onPress={() =>
                                                handleFilterChange(filter.key)
                                            }
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                backgroundColor: active
                                                    ? "#3153A1"
                                                    : "#fff",
                                                borderRadius: 20,
                                                paddingHorizontal: 14,
                                                paddingVertical: 8,
                                                borderWidth: 1,
                                                borderColor: active
                                                    ? "#3153A1"
                                                    : "#e5e7eb",
                                            }}
                                        >
                                            <Ionicons
                                                name={filter.icon as any}
                                                size={14}
                                                color={active ? "#fff" : "#6b7280"}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: "600",
                                                    color: active
                                                        ? "#fff"
                                                        : "#374151",
                                                    fontFamily:
                                                        "Montserrat_600SemiBold",
                                                }}
                                            >
                                                {filter.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>

                            {loading ? (
                                <View style={{ padding: 40, alignItems: "center" }}>
                                    <Text style={{ color: "#6b7280", fontFamily: "Montserrat_500Medium" }}>Chargement des incidents...</Text>
                                </View>
                            ) : pagedIncidents.length > 0 ? (
                                pagedIncidents.map((inc) => (
                                    <IncidentCard key={inc.id} incident={inc} />
                                ))
                            ) : (
                                <View
                                    style={{
                                        backgroundColor: "#fff",
                                        borderRadius: 14,
                                        padding: 32,
                                        alignItems: "center",
                                        borderWidth: 1,
                                        borderColor: "#e5e7eb",
                                        marginBottom: 10,
                                    }}
                                >
                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={40}
                                        color="#d1d5db"
                                    />
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: "#9ca3af",
                                            marginTop: 12,
                                            textAlign: "center",
                                            fontFamily: "Montserrat_500Medium",
                                        }}
                                    >
                                        Aucun incident trouvé
                                    </Text>
                                </View>
                            )}

                            <PaginationBar
                                currentPage={safePage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

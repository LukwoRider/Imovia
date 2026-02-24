import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

type LocationRow = {
    id: string;
    monthKey: string;
    monthLabel: string;
    title: string;
    address: string;
    city: string;
    statusLabel: string;
    statusColor: string;
    dueDate: number;
};

function monthLabel(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
    });
}

function monthKey(date: string) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function statusMeta(status?: string | null) {
    const s = String(status || "").toLowerCase();
    if (s === "paid") return { label: "Paye", color: "#08CB56", bg: "#ECFDF3" };
    if (s === "late") return { label: "En retard", color: "#EF4444", bg: "#FEF2F2" };
    return { label: "En cours", color: "#E17100", bg: "#FFF7ED" };
}

export default function ProprietaireLocationsPage() {
    const scrollViewRef = useRef<ScrollView>(null);
    useScrollToTopOnFocus(scrollViewRef);

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<LocationRow[]>([]);

    useEffect(() => {
        fetchLocations();
    }, []);

    async function fetchLocations() {
        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data: properties } = await supabase
                .from("properties")
                .select("id, title, address, city")
                .eq("owner_id", user.id);

            const propertyList = properties || [];
            const propertyIds = propertyList.map((p: any) => p.id);
            if (!propertyIds.length) {
                setRows([]);
                return;
            }

            const propertyById = Object.fromEntries(propertyList.map((p: any) => [p.id, p]));

            const { data: leases } = await supabase
                .from("leases")
                .select("id, property_id")
                .in("property_id", propertyIds);

            const leaseList = leases || [];
            const leaseIds = leaseList.map((l: any) => l.id);
            if (!leaseIds.length) {
                setRows([]);
                return;
            }

            const leaseToProperty = Object.fromEntries(leaseList.map((l: any) => [l.id, l.property_id]));

            const { data: leaseTenants } = await supabase
                .from("lease_tenants")
                .select(`
                    lease_id,
                    tenant_id,
                    profiles:tenant_id (
                        full_name
                    )
                `)
                .in("lease_id", leaseIds);

            const tenantByLease = new Map<string, string>();
            (leaseTenants || []).forEach((lt: any) => {
                const tenantName = lt?.profiles?.full_name ? String(lt.profiles.full_name).split(" ")[0] : "";
                if (tenantName && !tenantByLease.has(String(lt.lease_id))) {
                    tenantByLease.set(String(lt.lease_id), tenantName);
                }
            });

            const { data: payments } = await supabase
                .from("rent_payments")
                .select("id, lease_id, due_date, status")
                .in("lease_id", leaseIds)
                .order("due_date", { ascending: false })
                .limit(40);

            const mapped: LocationRow[] = (payments || [])
                .filter((p: any) => p.due_date)
                .map((p: any) => {
                    const leaseId = String(p.lease_id);
                    const property = propertyById[leaseToProperty[leaseId]] || {};
                    const tenant = tenantByLease.get(leaseId);
                    const meta = statusMeta(p.status);
                    return {
                        id: String(p.id),
                        monthKey: monthKey(p.due_date),
                        monthLabel: monthLabel(p.due_date),
                        title: `${property.title || property.city || "Location"}${tenant ? ` - ${tenant}` : ""}`,
                        address: property.address || "Adresse non renseignee",
                        city: property.city || "Ville non renseignee",
                        statusLabel: meta.label,
                        statusColor: meta.color,
                        dueDate: new Date(p.due_date).getTime(),
                    };
                });

            // Fallback if there are leases but no generated payments yet.
            if (!mapped.length) {
                const fallbackRows: LocationRow[] = leaseList.slice(0, 10).map((l: any, index: number) => {
                    const property = propertyById[l.property_id] || {};
                    const tenant = tenantByLease.get(String(l.id));
                    const now = new Date();
                    now.setMonth(now.getMonth() - index);
                    const fake = now.toISOString();
                    const meta = statusMeta("due");
                    return {
                        id: `lease-${l.id}`,
                        monthKey: monthKey(fake),
                        monthLabel: monthLabel(fake),
                        title: `${property.title || property.city || "Location"}${tenant ? ` - ${tenant}` : ""}`,
                        address: property.address || "Adresse non renseignee",
                        city: property.city || "Ville non renseignee",
                        statusLabel: meta.label,
                        statusColor: meta.color,
                        dueDate: now.getTime(),
                    };
                });
                setRows(fallbackRows);
                return;
            }

            setRows(mapped);
        } catch (error) {
            console.error("[OwnerLocations] Fetch error:", error);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    const grouped = rows
        .sort((a, b) => b.dueDate - a.dueDate)
        .reduce<Record<string, { label: string; items: LocationRow[] }>>((acc, row) => {
            if (!acc[row.monthKey]) acc[row.monthKey] = { label: row.monthLabel, items: [] };
            acc[row.monthKey].items.push(row);
            return acc;
        }, {});

    const groups = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

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
                            <Image
                                source={require("@/assets/images/logo-white.svg")}
                                style={{ width: 96, height: 26 }}
                                contentFit="contain"
                            />
                            <Text style={{ color: "#fff", fontSize: 18, marginTop: 8, fontFamily: "Montserrat_700Bold" }}>
                                Mes locations
                            </Text>
                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.82)",
                                    fontSize: 12,
                                    marginTop: 4,
                                    fontFamily: "Montserrat_400Regular",
                                }}
                            >
                                Suivez vos locations et les paiements
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <NotificationBellButton />
                            <ProfileHeaderButton />
                        </View>
                    </View>
                </LinearGradient>

                {loading ? (
                    <View style={{ padding: 32, alignItems: "center" }}>
                        <ActivityIndicator size="large" color="#3153A1" />
                    </View>
                ) : groups.length === 0 ? (
                    <View
                        style={{
                            margin: 16,
                            backgroundColor: "#fff",
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            padding: 16,
                        }}
                    >
                        <Text style={{ fontFamily: "Montserrat_600SemiBold", color: "#1e293b", fontSize: 15 }}>
                            Mes locations
                        </Text>
                        <Text style={{ marginTop: 8, color: "#6b7280", fontStyle: "italic" }}>
                            Aucune location a afficher pour le moment.
                        </Text>
                    </View>
                ) : (
                    <View style={{ paddingHorizontal: 12, paddingTop: 14 }}>
                        {groups.map(([key, group]) => (
                            <View key={key} style={{ marginBottom: 8 }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: "#1f2937",
                                        marginLeft: 6,
                                        marginBottom: 10,
                                        textTransform: "capitalize",
                                        fontFamily: "Montserrat_600SemiBold",
                                    }}
                                >
                                    {group.label}
                                </Text>

                                {group.items.map((item) => (
                                    <View
                                        key={item.id}
                                        style={{
                                            backgroundColor: "#fff",
                                            borderRadius: 14,
                                            borderWidth: 1,
                                            borderColor: "#e5e7eb",
                                            padding: 12,
                                            marginBottom: 10,
                                            marginHorizontal: 4,
                                        }}
                                    >
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <View
                                                style={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: 8,
                                                    backgroundColor: "#3153A1",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    marginRight: 10,
                                                }}
                                            >
                                                <Ionicons name="business-outline" size={20} color="#fff" />
                                            </View>

                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: "#1f2937", fontSize: 14, fontFamily: "Montserrat_600SemiBold" }}>
                                                    {item.title}
                                                </Text>
                                                <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                                                    {item.address}
                                                </Text>
                                                <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                                                    {item.city}
                                                </Text>
                                            </View>

                                            <View
                                                style={{
                                                    borderRadius: 999,
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 4,
                                                    borderWidth: 1,
                                                    borderColor: item.statusColor,
                                                    backgroundColor: "#fff",
                                                }}
                                            >
                                                <Text style={{ color: item.statusColor, fontSize: 11, fontFamily: "Montserrat_600SemiBold" }}>
                                                    {item.statusLabel}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

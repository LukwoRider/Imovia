import { Button } from "@/components/ui/button";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

// --- Types ---
type StatItem = {
    label: string;
    value: string;
    trend: string;
    up: boolean;
    icon: any;
};

type PaymentItem = {
    mois: string;
    date: string;
    montant: string;
    paid: boolean;
};

function StatCard({ label, value, trend, up, icon }: StatItem) {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
            }}
        >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <View
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: "#eef2ff",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name={icon} size={16} color="#3153A1" />
                </View>
                <Text style={{ fontSize: 11, color: "#6b7280", marginLeft: 8, fontFamily: "Montserrat_400Regular" }}>{label}</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>{value}</Text>
            <Text style={{ fontSize: 11, color: up ? "#08CB56" : "#FF0000", marginTop: 2, fontFamily: "Montserrat_400Regular" }}>
                {up ? "↑" : "↓"} {trend}
            </Text>
        </View>
    );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "#eef2ff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                }}
            >
                <Ionicons name={icon as any} size={18} color="#3153A1" />
            </View>
            <View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>{title}</Text>
                <Text style={{ fontSize: 11, color: "#9ca3af", fontFamily: "Montserrat_400Regular" }}>{subtitle}</Text>
            </View>
        </View>
    );
}

function PaiementRow({ item }: { item: PaymentItem }) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#f3f4f6",
            }}
        >
            <View
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: item.paid ? "rgba(8,203,86,0.15)" : "rgba(225,113,0,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                }}
            >
                <Ionicons
                    name={item.paid ? "checkmark-circle" : "time"}
                    size={16}
                    color={item.paid ? "#08CB56" : "#E17100"}
                />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#1e293b" }}>{item.mois}</Text>
                <Text style={{ fontSize: 11, color: "#9ca3af" }}>{item.date}</Text>
            </View>
            <View
                style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                }}
            >
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e293b" }}>{item.montant}</Text>
            </View>
        </View>
    );
}

export default function DashboardLocataire() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");
    const [activeLease, setActiveLease] = useState<any>(null);
    const [stats, setStats] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);

    useScrollToTopOnFocus(scrollViewRef);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Profile for Name
            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", user.id)
                .single();
            if (profile) setUserName(profile.full_name.split(" ")[0]);

            // 2. Fetch Active Lease & Property
            const { data: leaseTenant } = await supabase
                .from("lease_tenants")
                .select(`
                    lease_id,
                    leases (
                        *,
                        properties (*)
                    )
                `)
                .eq("tenant_id", user.id)
                .limit(1)
                .single();

            if (leaseTenant?.leases) {
                const lease = leaseTenant.leases as any;
                setActiveLease(lease);

                const leaseId = lease.id;

                // 3. Fetch Stats
                // - Next payment
                const { data: nextPayment } = await supabase
                    .from("rent_payments")
                    .select("amount_due, due_date")
                    .eq("lease_id", leaseId)
                    .in("status", ["due", "late"])
                    .order("due_date", { ascending: true })
                    .limit(1)
                    .single();

                // - Documents count
                const { count: docCount } = await supabase
                    .from("documents")
                    .select("*", { count: "exact", head: true })
                    .eq("lease_id", leaseId);

                // - Incidents count
                const { count: incCount } = await supabase
                    .from("incidents")
                    .select("*", { count: "exact", head: true })
                    .eq("lease_id", leaseId);

                setStats([
                    { label: "Loyer mensuel", value: `${lease.rent_amount}€`, trend: "Total", up: true, icon: "home" },
                    { label: "Prochain loyer", value: nextPayment ? `${nextPayment.amount_due}€` : "A jour", trend: nextPayment ? `Dû le ${new Date(nextPayment.due_date).toLocaleDateString('fr-FR')}` : "Aucun", up: !nextPayment, icon: "cash" },
                    { label: "Documents", value: `${docCount || 0}`, trend: "Total", up: true, icon: "document-text" },
                    { label: "Incidents", value: `${incCount || 0}`, trend: "Total", up: false, icon: "alert-circle" },
                ]);

                // 4. Fetch Recent Payments
                const { data: paymentsData } = await supabase
                    .from("rent_payments")
                    .select("*")
                    .eq("lease_id", leaseId)
                    .order("due_date", { ascending: false })
                    .limit(3);

                if (paymentsData) {
                    setPayments(paymentsData.map(p => ({
                        mois: new Date(p.due_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                        date: p.paid_at ? `Payé le ${new Date(p.paid_at).toLocaleDateString('fr-FR')}` : "En attente",
                        montant: `${p.amount_due} €`,
                        paid: p.status === 'paid'
                    })));
                }

                // 5. Fetch Recent Incidents
                const { data: incidentsData } = await supabase
                    .from("incidents")
                    .select("*")
                    .eq("lease_id", leaseId)
                    .order("created_at", { ascending: false })
                    .limit(2);

                if (incidentsData) {
                    setIncidents(incidentsData.map(inc => ({
                        titre: inc.title || "Incident",
                        desc: inc.description,
                        statut: inc.status === 'open' ? 'En cours' : inc.status === 'in_progress' ? 'Traité' : 'Résolu',
                        color: inc.status === 'open' ? "#E17100" : inc.status === 'in_progress' ? "#3153A1" : "#08CB56"
                    })));
                }

                // 6. Fetch Recent Documents
                const { data: docsData } = await supabase
                    .from("documents")
                    .select("*")
                    .eq("lease_id", leaseId)
                    .order("created_at", { ascending: false })
                    .limit(3);

                if (docsData) {
                    setDocuments(docsData.map(doc => ({
                        titre: doc.title,
                        date: new Date(doc.created_at).toLocaleDateString('fr-FR'),
                        type: doc.document_type
                    })));
                }
            }
        } catch (error) {
            console.error("[Dashboard] Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 32 }}>
                <LinearGradient
                    colors={["#1e3a6d", "#3153A1"]}
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
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Image
                                source={require("@/assets/images/logo-white.svg")}
                                style={{ width: 90, height: 24, marginBottom: 2 }}
                                contentFit="contain"
                            />
                            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 4, fontFamily: "Montserrat_700Bold" }}>
                                Bonjour, {userName || "David"} !
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 3, fontFamily: "Montserrat_400Regular" }}>
                                Bienvenue sur votre espace locataire imovia
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <NotificationBellButton />
                            <ProfileHeaderButton />
                        </View>
                    </View>
                </LinearGradient>

                {loading ? (
                    <View style={{ padding: 40, alignItems: "center" }}>
                        <ActivityIndicator size="large" color="#3153A1" />
                    </View>
                ) : (
                    <>
                        <View style={{ paddingHorizontal: 16, marginTop: -12 }}>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                                {stats.length > 0 && (
                                    <>
                                        <StatCard {...stats[0]} />
                                        <StatCard {...stats[1]} />
                                    </>
                                )}
                            </View>
                            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                                {stats.length > 2 && (
                                    <>
                                        <StatCard {...stats[2]} />
                                        <StatCard {...stats[3]} />
                                    </>
                                )}
                            </View>
                        </View>

                        <View
                            style={{
                                marginHorizontal: 16,
                                marginTop: 20,
                                backgroundColor: "#fff",
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                            }}
                        >
                            <SectionHeader icon="home-outline" title="Mon logement" subtitle="Informations sur votre location actuelle" />

                            {activeLease ? (
                                <>
                                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 4 }}>
                                        {activeLease.properties.title}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                                        {activeLease.properties.address}, {activeLease.properties.city}
                                    </Text>

                                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                                        {[
                                            { icon: "resize-outline", label: `${activeLease.properties.surface_m2} m²` },
                                            { icon: "grid-outline", label: `${activeLease.properties.rooms} Pièces` },
                                            { icon: "bed-outline", label: activeLease.properties.is_furnished ? "Meublé" : "Non meublé" },
                                            { icon: "cash-outline", label: `${activeLease.rent_amount} €` },
                                        ].map((badge) => (
                                            <View
                                                key={badge.label}
                                                style={{
                                                    flexDirection: "row",
                                                    alignItems: "center",
                                                    backgroundColor: "#f9fafb",
                                                    borderRadius: 8,
                                                    paddingHorizontal: 10,
                                                    paddingVertical: 6,
                                                    borderWidth: 1,
                                                    borderColor: "#e5e7eb",
                                                }}
                                            >
                                                <Ionicons name={badge.icon as any} size={14} color="#6b7280" />
                                                <Text style={{ fontSize: 12, color: "#374151", marginLeft: 4 }}>{badge.label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <Text style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>Aucun bail actif trouvé.</Text>
                            )}

                            <Button onPress={() => router.push("/(locataire)/logement")}>
                                <Ionicons name="document-text-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text>Voir les détails</Text>
                            </Button>
                        </View>

                        <View
                            style={{
                                marginHorizontal: 16,
                                marginTop: 20,
                                backgroundColor: "#fff",
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                            }}
                        >
                            <SectionHeader icon="card-outline" title="Etat des paiements" subtitle="Suivi de vos paiements de loyer" />

                            {payments.length > 0 ? (
                                <>
                                    {payments.map((p, i) => (
                                        <PaiementRow key={i} item={p} />
                                    ))}

                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                                        <Text style={{ fontSize: 12, color: "#6b7280" }}>Paiements récents</Text>
                                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#1e293b" }}>
                                            {payments.filter(p => p.paid).length}/{payments.length}
                                        </Text>
                                    </View>
                                    <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, marginTop: 6 }}>
                                        <View
                                            style={{
                                                height: 6,
                                                borderRadius: 3,
                                                backgroundColor: "#3153A1",
                                                width: `${(payments.filter(p => p.paid).length / payments.length) * 100}%`,
                                            }}
                                        />
                                    </View>
                                </>
                            ) : (
                                <Text style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>Aucun paiement trouvé.</Text>
                            )}
                        </View>

                        <View
                            style={{
                                marginHorizontal: 16,
                                marginTop: 20,
                                backgroundColor: "#fff",
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                            }}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <SectionHeader icon="warning-outline" title="Mes incidents" subtitle="Suivi de vos déclarations" />
                                <Pressable
                                    onPress={() => router.push("/(locataire)/incidents")}
                                    style={{ backgroundColor: "#3153A1", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 }}
                                >
                                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>Voir tout</Text>
                                </Pressable>
                            </View>

                            {incidents.length > 0 ? (
                                incidents.map((inc, i) => (
                                    <View
                                        key={i}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "flex-start",
                                            paddingVertical: 10,
                                            borderBottomWidth: i < incidents.length - 1 ? 1 : 0,
                                            borderBottomColor: "#f3f4f6",
                                        }}
                                    >
                                        <Ionicons name="ellipse" size={8} color={inc.color} style={{ marginTop: 5, marginRight: 10 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "600", color: "#1e293b" }}>{inc.titre}</Text>
                                            <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{inc.desc}</Text>
                                        </View>
                                        <View
                                            style={{
                                                borderRadius: 12,
                                                paddingHorizontal: 10,
                                                paddingVertical: 3,
                                                backgroundColor: "#FDF8F2",
                                                borderWidth: 1,
                                                borderColor: inc.color,
                                            }}
                                        >
                                            <Text style={{ fontSize: 11, fontWeight: "600", color: inc.color }}>{inc.statut}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic", marginBottom: 10 }}>Aucun incident signalé.</Text>
                            )}

                            <Button
                                onPress={() => router.push("/(locataire)/incidents")}
                                style={{ marginTop: 14 }}
                            >
                                <Ionicons name="warning-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                                <Text>Déclarer un incident</Text>
                            </Button>
                        </View>

                        <View
                            style={{
                                marginHorizontal: 16,
                                marginTop: 20,
                                backgroundColor: "#fff",
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                            }}
                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <SectionHeader icon="folder-outline" title="Mes documents" subtitle="Accès rapide à vos documents" />
                                <Pressable
                                    onPress={() => router.push("/(locataire)/documents")}
                                    style={{ backgroundColor: "#3153A1", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 }}
                                >
                                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>Voir tout</Text>
                                </Pressable>
                            </View>

                            {documents.length > 0 ? (
                                documents.map((doc, i) => (
                                    <View
                                        key={i}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            paddingVertical: 10,
                                            borderBottomWidth: i < documents.length - 1 ? 1 : 0,
                                            borderBottomColor: "#f3f4f6",
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: "#3153A1",
                                                marginRight: 10,
                                            }}
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: "600", color: "#1e293b" }}>{doc.titre}</Text>
                                            <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{doc.date}</Text>
                                        </View>
                                        <View
                                            style={{
                                                borderRadius: 8,
                                                paddingHorizontal: 10,
                                                paddingVertical: 4,
                                                borderWidth: 1,
                                                borderColor: "#e5e7eb",
                                                flexDirection: "row",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Ionicons name="download-outline" size={12} color="#6b7280" style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 11, color: "#6b7280" }}>{doc.type}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>Aucun document disponible.</Text>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

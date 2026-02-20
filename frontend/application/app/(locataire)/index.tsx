import { Button } from "@/components/ui/button";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

// --- Mock Data ---
const STATS = [
    { label: "Mon Logement", value: "1750", trend: "+8.56%", up: true, icon: "home" as const },
    { label: "Prochain loyer", value: "1020€", trend: "-8.56%", up: false, icon: "cash" as const },
    { label: "Documents", value: "23", trend: "+8.56%", up: true, icon: "document-text" as const },
    { label: "Incidents", value: "1750", trend: "-8.56%", up: false, icon: "alert-circle" as const },
];

const PAIEMENTS = [
    { mois: "Janvier 2024", date: "Payé le 05/01/2024", montant: "1950 €", paid: true },
    { mois: "Janvier 2024", date: "Payé le 05/01/2024", montant: "1950 €", paid: true },
    { mois: "Mars 2024", date: "En attente", montant: "1950 €", paid: false },
];

const INCIDENTS = [
    { titre: "Fuite d'eau sous l'évier", desc: "Une fuite d'eau a été constatée sous l'évier.", statut: "En cours", color: "#E17100" },
    { titre: "Problème électrique", desc: "Problème de fusible", statut: "Résolu", color: "#08CB56" },
];

const DOCUMENTS = [
    { titre: "Contrat de location - Marais", date: "07/04/2025", type: "contrat" },
    { titre: "État des lieux d'entrée", date: "01/01/2024", type: "etat_des_lieux" },
    { titre: "Quittance Janvier 2024", date: "10/01/2024", type: "quittance" },
];

function StatCard({ label, value, trend, up, icon }: typeof STATS[0]) {
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

function PaiementRow({ item }: { item: typeof PAIEMENTS[0] }) {
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
    const paiementsAJour = PAIEMENTS.filter((p) => p.paid).length;
    const totalPaiements = PAIEMENTS.length;

    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
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
                                Bonjour, David !
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 3, fontFamily: "Montserrat_400Regular" }}>
                                Bienvenue sur votre espace locataire imovia
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <NotificationBellButton />
                            <View
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="person" size={17} color="#fff" />
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16, marginTop: -12 }}>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <StatCard {...STATS[0]} />
                        <StatCard {...STATS[1]} />
                    </View>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                        <StatCard {...STATS[2]} />
                        <StatCard {...STATS[3]} />
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

                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 4 }}>
                        Appartement lumineux - Marais
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                        25 Rue des Francs-Bourgeois, 75004 Paris
                    </Text>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                        {[
                            { icon: "resize-outline", label: "200 m²" },
                            { icon: "grid-outline", label: "4 Pièces" },
                            { icon: "bed-outline", label: "Meublé" },
                            { icon: "cash-outline", label: "1950 €" },
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

                    {PAIEMENTS.map((p, i) => (
                        <PaiementRow key={i} item={p} />
                    ))}

                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                        <Text style={{ fontSize: 12, color: "#6b7280" }}>Paiements à jour</Text>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#1e293b" }}>
                            {paiementsAJour}/{totalPaiements}
                        </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, marginTop: 6 }}>
                        <View
                            style={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: "#3153A1",
                                width: `${(paiementsAJour / totalPaiements) * 100}%`,
                            }}
                        />
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
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <SectionHeader icon="warning-outline" title="Mes incidents" subtitle="Suivi de vos déclarations" />
                        <Pressable
                            onPress={() => router.push("/(locataire)/incidents")}
                            style={{ backgroundColor: "#3153A1", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 }}
                        >
                            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>Voir tout</Text>
                        </Pressable>
                    </View>

                    {INCIDENTS.map((inc, i) => (
                        <View
                            key={i}
                            style={{
                                flexDirection: "row",
                                alignItems: "flex-start",
                                paddingVertical: 10,
                                borderBottomWidth: i < INCIDENTS.length - 1 ? 1 : 0,
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
                    ))}

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

                    {DOCUMENTS.map((doc, i) => (
                        <View
                            key={i}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingVertical: 10,
                                borderBottomWidth: i < DOCUMENTS.length - 1 ? 1 : 0,
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
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

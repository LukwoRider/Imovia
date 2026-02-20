import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

const STATS = [
    { label: "Mes Logements", value: "2", trend: "+8.56%", up: true, icon: "home" as const },
    { label: "Recouvrement", value: "1020€", trend: "-8.56%", up: false, icon: "cash" as const },
    { label: "Documents", value: "6", trend: "+9.6%", up: true, icon: "document-text" as const },
    { label: "Incidents", value: "2", trend: "+12.3%", up: true, icon: "alert-circle" as const },
];

const DATES_IMPORTANTES = [
    { titre: "Arriver locataire - Marais", desc: "Prévoir arriver" },
    { titre: "Rénovation - Confluence n°203", desc: "Rénovation électrique" },
    { titre: "Départ locataire - Westfield", desc: "État des lieux de sortie" },
];

const PAIEMENTS_SUMMARY = [
    { label: "Payés", count: 2, icon: "checkmark-circle" as const, color: "#08CB56", bg: "rgba(8,203,86,0.15)" },
    { label: "En attente", count: 1, icon: "time" as const, color: "#E17100", bg: "rgba(225,113,0,0.15)" },
    { label: "En retard", count: 1, icon: "alert-circle" as const, color: "#FF0000", bg: "rgba(255,0,0,0.15)" },
];

const LOGEMENT_CATEGORIES = [
    { label: "Disponible", color: "#93C5FD" },
    { label: "Loué", color: "#3153A1" },
    { label: "En travaux", color: "#E17100" },
    { label: "A vendre", color: "#1e293b" },
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

function StatCard({ label, value, trend, up, icon }: (typeof STATS)[0]) {
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
                <Text style={{ fontSize: 11, color: "#6b7280", marginLeft: 8, fontFamily: "Montserrat_400Regular" }}>
                    {label}
                </Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>
                {value}
            </Text>
            <Text
                style={{
                    fontSize: 11,
                    color: up ? "#08CB56" : "#FF0000",
                    marginTop: 2,
                    fontFamily: "Montserrat_400Regular",
                }}
            >
                {up ? "↑" : "↓"} {trend}
            </Text>
        </View>
    );
}

function SectionHeader({
    icon,
    title,
    subtitle,
}: {
    icon: string;
    title: string;
    subtitle: string;
}) {
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
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>
                    {title}
                </Text>
                <Text style={{ fontSize: 11, color: "#9ca3af", fontFamily: "Montserrat_400Regular" }}>
                    {subtitle}
                </Text>
            </View>
        </View>
    );
}

export default function DashboardProprietaire() {
    const router = useRouter();
    const tauxRecouvrement = 80;

    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
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
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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
                                    fontFamily: "Montserrat_700Bold",
                                }}
                            >
                                Bonjour, David !
                            </Text>
                            <Text
                                style={{
                                    color: "rgba(255,255,255,0.7)",
                                    fontSize: 13,
                                    marginTop: 3,
                                    fontFamily: "Montserrat_400Regular",
                                }}
                            >
                                Bienvenue sur votre espace propriétaire imovia
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
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
                                <Ionicons name="notifications-outline" size={17} color="#fff" />
                            </View>
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
                    <SectionHeader
                        icon="calendar-outline"
                        title="Dates importantes"
                        subtitle="Informations sur les prochains projets, paiements..."
                    />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 10 }}
                    >
                        {DATES_IMPORTANTES.map((item, i) => (
                            <View
                                key={i}
                                style={{
                                    backgroundColor: "#f9fafb",
                                    borderRadius: 12,
                                    padding: 14,
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    width: 200,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: "700",
                                        color: "#1e293b",
                                        fontFamily: "Montserrat_700Bold",
                                        marginBottom: 4,
                                    }}
                                    numberOfLines={2}
                                >
                                    {item.titre}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: "#9ca3af",
                                        fontFamily: "Montserrat_400Regular",
                                    }}
                                >
                                    {item.desc}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
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
                    <SectionHeader
                        icon="home-outline"
                        title="Mon logement"
                        subtitle="Informations sur votre location actuelle"
                    />

                    <View style={{ alignItems: "center", marginBottom: 20 }}>
                        <View
                            style={{
                                width: 140,
                                height: 140,
                                borderRadius: 70,
                                backgroundColor: "#f3f4f6",
                                justifyContent: "center",
                                alignItems: "center",
                                overflow: "hidden",
                            }}
                        >
                            {/* Segment 1: Loué (50%) */}
                            <View
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: 140,
                                    height: 70,
                                    backgroundColor: "#3153A1",
                                }}
                            />
                            {/* Segment 2: Disponible (30%) */}
                            <View
                                style={{
                                    position: "absolute",
                                    top: 70,
                                    left: 0,
                                    width: 70,
                                    height: 70,
                                    backgroundColor: "#93C5FD",
                                }}
                            />
                            {/* Segment 3: En travaux (15%) */}
                            <View
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    width: 70,
                                    height: 70,
                                    backgroundColor: "#E17100",
                                    transform: [{ rotate: "45deg" }],
                                    transformOrigin: "top left",
                                }}
                            />
                            {/* Segment 4: A vendre (5%) */}
                            <View
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: 0,
                                    width: 35,
                                    height: 70,
                                    backgroundColor: "#1e293b",
                                }}
                            />

                            {/* Inner circle for donut look (optional but cleaner) */}
                            <View
                                style={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: 35,
                                    backgroundColor: "#fff",
                                }}
                            />
                        </View>
                    </View>

                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            gap: 16,
                            marginBottom: 16,
                        }}
                    >
                        {LOGEMENT_CATEGORIES.map((cat) => (
                            <View key={cat.label} style={{ flexDirection: "row", alignItems: "center" }}>
                                <View
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 3,
                                        backgroundColor: cat.color,
                                        marginRight: 6,
                                    }}
                                />
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: "#6b7280",
                                        fontFamily: "Montserrat_400Regular",
                                    }}
                                >
                                    {cat.label}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <Pressable
                        onPress={() => router.push("/(proprietaire)/logement")}
                        style={{
                            backgroundColor: "#3153A1",
                            borderRadius: 12,
                            paddingVertical: 12,
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: "600",
                                fontFamily: "Montserrat_600SemiBold",
                            }}
                        >
                            Voir les détails
                        </Text>
                    </Pressable>
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
                    <SectionHeader
                        icon="card-outline"
                        title="Etat des paiements"
                        subtitle="Suivi de vos paiements de loyer"
                    />

                    {PAIEMENTS_SUMMARY.map((p, i) => (
                        <View
                            key={i}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingVertical: 12,
                                borderBottomWidth: i < PAIEMENTS_SUMMARY.length - 1 ? 1 : 0,
                                borderBottomColor: "#f3f4f6",
                            }}
                        >
                            <View
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: p.bg,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 10,
                                }}
                            >
                                <Ionicons name={p.icon} size={16} color={p.color} />
                            </View>
                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 14,
                                    fontWeight: "600",
                                    color: "#1e293b",
                                    fontFamily: "Montserrat_600SemiBold",
                                }}
                            >
                                {p.label}
                            </Text>
                            <View
                                style={{
                                    backgroundColor: "#f9fafb",
                                    borderRadius: 8,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderWidth: 1,
                                    borderColor: "#e5e7eb",
                                    minWidth: 36,
                                    alignItems: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: "600",
                                        color: "#1e293b",
                                        fontFamily: "Montserrat_600SemiBold",
                                    }}
                                >
                                    {p.count}
                                </Text>
                            </View>
                        </View>
                    ))}

                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 14,
                        }}
                    >
                        <Text style={{ fontSize: 12, color: "#6b7280", fontFamily: "Montserrat_400Regular" }}>
                            Taux de recouvrement
                        </Text>
                        <Text
                            style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: "#1e293b",
                                fontFamily: "Montserrat_600SemiBold",
                            }}
                        >
                            {tauxRecouvrement}%
                        </Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, marginTop: 6 }}>
                        <View
                            style={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: "#3153A1",
                                width: `${tauxRecouvrement}%`,
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
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                        }}
                    >
                        <SectionHeader icon="warning-outline" title="Les Incidents" subtitle="Suivi des incidents" />
                        <Pressable
                            onPress={() => router.push("/(proprietaire)/incidents")}
                            style={{
                                backgroundColor: "#3153A1",
                                borderRadius: 16,
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                            }}
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
                            <Ionicons
                                name="ellipse"
                                size={8}
                                color={inc.color}
                                style={{ marginTop: 5, marginRight: 10 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: "600",
                                        color: "#1e293b",
                                        fontFamily: "Montserrat_600SemiBold",
                                    }}
                                >
                                    {inc.titre}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: "#9ca3af",
                                        marginTop: 2,
                                        fontFamily: "Montserrat_400Regular",
                                    }}
                                >
                                    {inc.desc}
                                </Text>
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
                                <Text style={{ fontSize: 11, fontWeight: "600", color: inc.color }}>
                                    {inc.statut}
                                </Text>
                            </View>
                        </View>
                    ))}
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
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                        }}
                    >
                        <SectionHeader
                            icon="folder-outline"
                            title="Mes documents"
                            subtitle="Accès rapide à vos documents"
                        />
                        <Pressable
                            onPress={() => router.push("/(proprietaire)/documents")}
                            style={{
                                backgroundColor: "#3153A1",
                                borderRadius: 16,
                                paddingHorizontal: 12,
                                paddingVertical: 4,
                            }}
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
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: "600",
                                        color: "#1e293b",
                                        fontFamily: "Montserrat_600SemiBold",
                                    }}
                                >
                                    {doc.titre}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: "#9ca3af",
                                        marginTop: 2,
                                        fontFamily: "Montserrat_400Regular",
                                    }}
                                >
                                    {doc.date}
                                </Text>
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
                                <Text style={{ fontSize: 11, color: "#6b7280", fontFamily: "Montserrat_400Regular" }}>
                                    {doc.type}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

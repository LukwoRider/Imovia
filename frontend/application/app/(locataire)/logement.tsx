import { Ionicons } from "@expo/vector-icons";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";

const LOGEMENT = {
    titre: "Appartement lumineux - Marais",
    adresse: "25 Rue des Francs-Bourgeois, 75004 Paris",
    surface: 200,
    pieces: 4,
    loyer: 1950,
    meuble: true,
    description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
};

const CONTRAT = {
    debut: "01/01/2024",
    finPrevue: "Indéterminée",
    depotGarantie: "1950€",
    totalMensuel: "1950€",
};

const PROPRIETAIRE = {
    nom: "Jean Martin",
    tel: "06 12 34 56 78",
    email: "jean.martin@email.com",
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
                                    {LOGEMENT.titre}
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
                                    {LOGEMENT.adresse}
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
                            <Badge icon="resize-outline" label={`${LOGEMENT.surface} m²`} />
                            <Badge icon="grid-outline" label={`${LOGEMENT.pieces} Pièces`} />
                            {LOGEMENT.meuble ? (
                                <Badge icon="bed-outline" label="Meublé" />
                            ) : null}
                            <Badge icon="cash-outline" label={`${LOGEMENT.loyer} €`} />
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
                            {LOGEMENT.description}
                        </Text>
                    </View>

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
                                    Informations de contacts
                                </Text>
                            </View>
                        </View>

                        <InfoRow
                            icon="calendar-outline"
                            label="Début"
                            value={CONTRAT.debut}
                        />
                        <InfoRow
                            icon="time-outline"
                            label="Fin prévue"
                            value={CONTRAT.finPrevue}
                        />
                        <InfoRow
                            icon="shield-checkmark-outline"
                            label="Dépôt de garantie"
                            value={CONTRAT.depotGarantie}
                        />
                        <InfoRow
                            icon="wallet-outline"
                            label="Total mensuel"
                            value={CONTRAT.totalMensuel}
                        />
                    </View>

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
                                    Informations de contacts
                                </Text>
                            </View>
                        </View>

                        <ContactRow icon="person-outline" text={PROPRIETAIRE.nom} />
                        <ContactRow icon="call-outline" text={PROPRIETAIRE.tel} />
                        <ContactRow icon="mail-outline" text={PROPRIETAIRE.email} />

                        <Pressable
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
                </View>
            </ScrollView>
        </View>
    );
}

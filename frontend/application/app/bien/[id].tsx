import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { Text } from "@/components/ui/text";

// --- Mock data (sera remplacé par un appel API) ---
const BIENS_DB: Record<string, BienDetail> = {
    "1": {
        id: 1,
        adresse: "25 Rue des Francs-Bourgeois",
        ville: "Lille",
        prix: 289,
        surface: 45,
        type: "Appartement",
        chambres: 2,
        cuisines: 1,
        toilettes: 1,
        classeEnergie: "A",
        visite: "Visite possible les week-ends de 10h à 18h",
        disponibilite: "Disponible à partir du 27/07/2026",
        meuble: true,
        description:
            "Bel appartement lumineux situé dans le quartier des Francs-Bourgeois à Lille. Proche de toutes les commodités, transports en commun et commerces. L'appartement dispose d'un séjour spacieux, d'une cuisine équipée, de deux chambres confortables et d'une salle de bain moderne. Idéal pour un couple ou une colocation.",
    },
    "2": {
        id: 2,
        adresse: "12 Avenue Foch",
        ville: "Lille",
        prix: 450,
        surface: 72,
        type: "Appartement",
        chambres: 3,
        cuisines: 1,
        toilettes: 2,
        classeEnergie: "B",
        visite: "Visite possible en semaine de 14h à 18h",
        disponibilite: "Disponible à partir du 01/09/2026",
        meuble: false,
        description:
            "Grand appartement de 72m² avec vue sur l'avenue Foch. Trois chambres spacieuses, deux salles de bain, une cuisine séparée et un grand salon lumineux. Parking souterrain inclus. Proche du métro et des écoles.",
    },
    "3": {
        id: 3,
        adresse: "8 Rue de la Monnaie",
        ville: "Lille",
        prix: 620,
        surface: 95,
        type: "Maison",
        chambres: 4,
        cuisines: 1,
        toilettes: 2,
        classeEnergie: "C",
        visite: "Visite sur rendez-vous",
        disponibilite: "Disponible immédiatement",
        meuble: true,
        description:
            "Charmante maison de ville avec jardin, située dans le vieux Lille. Quatre chambres, salon double, cuisine aménagée et équipée, deux salles d'eau. Terrasse et petit jardin à l'arrière. Quartier calme et résidentiel.",
    },
    "4": {
        id: 4,
        adresse: "3 Boulevard Carnot",
        ville: "Paris",
        prix: 1200,
        surface: 120,
        type: "Appartement",
        chambres: 4,
        cuisines: 1,
        toilettes: 2,
        classeEnergie: "B",
        visite: "Visite possible les week-ends de 10h à 18h",
        disponibilite: "Disponible à partir du 15/08/2026",
        meuble: false,
        description:
            "Superbe appartement haussmannien de 120m² avec parquet, moulures et cheminées d'époque. Quatre chambres, deux salles de bain, grande cuisine et double séjour. Situé sur le boulevard Carnot, à proximité des transports.",
    },
    "5": {
        id: 5,
        adresse: "15 Rue Nationale",
        ville: "Lille",
        prix: 380,
        surface: 55,
        type: "Studio",
        chambres: 1,
        cuisines: 1,
        toilettes: 1,
        classeEnergie: "A",
        visite: "Visite possible tous les jours de 9h à 19h",
        disponibilite: "Disponible à partir du 01/06/2026",
        meuble: true,
        description:
            "Studio moderne entièrement rénové, idéalement situé sur la rue Nationale. Kitchenette équipée, salle de douche, coin nuit séparé par une verrière. Parfait pour un étudiant ou un jeune actif.",
    },
};

// Fallback for unknown IDs
const DEFAULT_BIEN: BienDetail = {
    id: 0,
    adresse: "Bien non trouvé",
    ville: "",
    prix: 0,
    surface: 0,
    type: "",
    chambres: 0,
    cuisines: 0,
    toilettes: 0,
    classeEnergie: "",
    visite: "",
    disponibilite: "",
    meuble: false,
    description: "",
};

type BienDetail = {
    id: number;
    adresse: string;
    ville: string;
    prix: number;
    surface: number;
    type: string;
    chambres: number;
    cuisines: number;
    toilettes: number;
    classeEnergie: string;
    visite: string;
    disponibilite: string;
    meuble: boolean;
    description: string;
};

const screenWidth = Dimensions.get("window").width;

// --- Info Row Component ---
function InfoRow({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
            <View
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: "#eef2ff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Ionicons name={icon as any} size={16} color="#3153A1" />
            </View>
            <Text style={{ fontSize: 14, color: "#1e293b", fontWeight: "500", flex: 1, fontFamily: "Montserrat_500Medium" }}>{text}</Text>
        </View>
    );
}

// --- Main Detail Page ---
export default function BienDetailPage() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [activeImage, setActiveImage] = useState(0);

    const bien = BIENS_DB[id ?? ""] ?? DEFAULT_BIEN;
    const imageCount = 4; // Mock: 4 images placeholder

    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* === HEADER === */}
                <LinearGradient
                    colors={["#1e3a6d", "#3153A1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        paddingTop: 56,
                        paddingBottom: 20,
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
                            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4, fontFamily: "Montserrat_700Bold" }}>
                                Recherche de biens
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2, fontFamily: "Montserrat_400Regular" }}>
                                Recherchez votre futur chez vous
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

                <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                    {/* === BACK + ADDRESS === */}
                    <Pressable
                        onPress={() => router.back()}
                        style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
                    >
                        <View
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: "#eef2ff",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 10,
                            }}
                        >
                            <Ionicons name="arrow-back" size={16} color="#3153A1" />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b", flex: 1, fontFamily: "Montserrat_700Bold" }} numberOfLines={1}>
                            {bien.adresse}
                        </Text>
                    </Pressable>

                    {/* === IMAGE GALLERY === */}
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            overflow: "hidden",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            marginBottom: 16,
                        }}
                    >
                        {/* Main image */}
                        <View
                            style={{
                                width: "100%",
                                height: 220,
                                backgroundColor: "#c7cdd6",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Ionicons name="image-outline" size={48} color="#9ca3af" />
                            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, fontFamily: "Montserrat_400Regular" }}>Photo principale</Text>
                        </View>

                        {/* Thumbnail row */}
                        <View style={{ flexDirection: "row", gap: 2, padding: 2 }}>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Pressable
                                    key={i}
                                    onPress={() => setActiveImage(i + 1)}
                                    style={{
                                        flex: 1,
                                        height: 80,
                                        backgroundColor: activeImage === i + 1 ? "#a8b5c9" : "#d1d8e0",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: activeImage === i + 1 ? 2 : 0,
                                        borderColor: "#3153A1",
                                        borderRadius: 4,
                                    }}
                                >
                                    <Ionicons name="image-outline" size={20} color="#9ca3af" />
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* === PROPERTY INFO === */}
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            marginBottom: 16,
                        }}
                    >
                        {/* Address + type */}
                        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>
                            {bien.adresse}
                        </Text>
                        <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2, marginBottom: 12, fontFamily: "Montserrat_400Regular" }}>
                            {bien.ville}
                        </Text>

                        {/* Badges: chambres, cuisine, surface, toilettes */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                            {[
                                { icon: "bed-outline", label: `${bien.chambres} Chambre${bien.chambres > 1 ? "s" : ""}` },
                                { icon: "restaurant-outline", label: `${bien.cuisines} Cuisine` },
                                { icon: "resize-outline", label: `${bien.surface} m²` },
                                { icon: "water-outline", label: `${bien.toilettes} Toilette${bien.toilettes > 1 ? "s" : ""}` },
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
                                    <Text style={{ fontSize: 12, color: "#374151", marginLeft: 4, fontWeight: "500", fontFamily: "Montserrat_500Medium" }}>
                                        {badge.label}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Info rows */}
                        {bien.classeEnergie ? (
                            <InfoRow icon="speedometer-outline" text={`Classe ${bien.classeEnergie}`} />
                        ) : null}
                        {bien.visite ? (
                            <InfoRow icon="calendar-outline" text={bien.visite} />
                        ) : null}
                        {bien.disponibilite ? (
                            <InfoRow icon="time-outline" text={bien.disponibilite} />
                        ) : null}
                        <InfoRow
                            icon="home-outline"
                            text={bien.meuble ? "Meublé" : "Non meublé"}
                        />
                    </View>

                    {/* === PRICE + CONTACT CARD === */}
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            marginBottom: 16,
                            alignItems: "center",
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 14 }}>
                            <Text style={{ fontSize: 28, fontWeight: "700", color: "#3153A1", fontFamily: "Montserrat_700Bold" }}>
                                {bien.prix}€
                            </Text>
                            <Text style={{ fontSize: 15, color: "#9ca3af", marginLeft: 4, fontFamily: "Montserrat_400Regular" }}>/ mois</Text>
                        </View>

                        <Pressable
                            style={{
                                backgroundColor: "#3153A1",
                                borderRadius: 12,
                                paddingVertical: 14,
                                paddingHorizontal: 32,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                marginBottom: 10,
                            }}
                        >
                            <Ionicons name="call-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: "Montserrat_600SemiBold" }}>Contacter</Text>
                        </Pressable>

                        <Text style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", fontFamily: "Montserrat_400Regular" }}>
                            {bien.type ? `${bien.type} · ` : ""}{bien.surface} m² · {bien.ville}
                        </Text>
                    </View>

                    {/* === DESCRIPTION === */}
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            marginBottom: 16,
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                            <View
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    backgroundColor: "#eef2ff",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 10,
                                }}
                            >
                                <Ionicons name="document-text-outline" size={16} color="#3153A1" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>Description</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: "#374151", lineHeight: 22, fontFamily: "Montserrat_400Regular" }}>
                            {bien.description}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

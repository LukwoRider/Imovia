import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Pressable,
    ScrollView,
    View,
} from "react-native";

type BienDetail = {
    id: string;
    adresse: string;
    ville: string;
    prix: number;
    surface: number;
    type: string;
    chambres: number;
    cuisines?: number;
    toilettes: number;
    classeEnergie: string;
    visite?: string;
    meuble: boolean;
    description: string;
    images: string[];
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
    const [bien, setBien] = useState<BienDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchBienDetail();
    }, [id]);

    async function fetchBienDetail() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("properties")
                .select(`
                    *,
                    property_images (
                        storage_path
                    )
                `)
                .eq("id", id)
                .single();

            if (error) throw error;

            const mapped: BienDetail = {
                id: data.id,
                adresse: data.address || "Adresse non renseignée",
                ville: data.city || "Ville non renseignée",
                prix: Number(data.monthly_rent) || 0,
                surface: Number(data.surface_m2) || 0,
                type: data.property_type || "Bien",
                chambres: data.rooms || 0,
                cuisines: undefined, // Donnée non présente dans la table properties
                toilettes: data.bathrooms || 0,
                classeEnergie: data.energy_class || "",
                visite: undefined, // Donnée non présente dans la table properties
                meuble: data.is_furnished || false,
                description: data.description || "Aucune description fournie.",
                images: (data.property_images || []).map((img: any) => {
                    const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(img.storage_path);
                    return publicUrl;
                })
            };

            setBien(mapped);
        } catch (error: any) {
            console.error("[BienDetail] Fetch error:", error);
            Alert.alert("Erreur", "Impossible de charger les détails du bien.");
            router.back();
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
                <ActivityIndicator size="large" color="#3153A1" />
                <Text style={{ marginTop: 12, color: "#6b7280", fontFamily: "Montserrat_500Medium" }}>Chargement du bien...</Text>
            </View>
        );
    }

    if (!bien) return null;

    const images = bien.images.length > 0 ? bien.images : [null]; // Fallback if no images

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
                            <NotificationBellButton />
                            <ProfileHeaderButton />
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
                            {images[activeImage] ? (
                                <Image
                                    source={{ uri: images[activeImage] }}
                                    style={{ width: "100%", height: "100%" }}
                                    contentFit="cover"
                                />
                            ) : (
                                <>
                                    <Ionicons name="image-outline" size={48} color="#9ca3af" />
                                    <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, fontFamily: "Montserrat_400Regular" }}>Aucune photo disponible</Text>
                                </>
                            )}
                        </View>

                        {/* Thumbnail row */}
                        {images.length > 1 && (
                            <View style={{ flexDirection: "row", gap: 2, padding: 2 }}>
                                {images.map((img, i) => (
                                    <Pressable
                                        key={i}
                                        onPress={() => setActiveImage(i)}
                                        style={{
                                            flex: 1,
                                            height: 80,
                                            backgroundColor: activeImage === i ? "#a8b5c9" : "#d1d8e0",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderWidth: activeImage === i ? 2 : 0,
                                            borderColor: "#3153A1",
                                            borderRadius: 4,
                                        }}
                                    >
                                        {img ? (
                                            <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} />
                                        ) : (
                                            <Ionicons name="image-outline" size={20} color="#9ca3af" />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        )}
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
                                { icon: "bed-outline", label: `${bien.chambres} Chambre${bien.chambres > 1 ? "s" : ""}`, show: true },
                                { icon: "restaurant-outline", label: `${bien.cuisines} Cuisine`, show: bien.cuisines !== undefined },
                                { icon: "resize-outline", label: `${bien.surface} m²`, show: true },
                                { icon: "water-outline", label: `${bien.toilettes} Toilette${bien.toilettes > 1 ? "s" : ""}`, show: true },
                            ].filter(b => b.show).map((badge) => (
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

import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Dimensions,
    GestureResponderEvent,
    LayoutChangeEvent,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";

type Property = {
    id: string;
    adresse: string;
    ville: string;
    prix: number;
    surface: number;
    type: string;
    imagesCount: number;
    thumbnail?: string;
};

const ITEMS_PER_PAGE = 4;
const screenWidth = Dimensions.get("window").width;

const SURFACE_MIN = 0;
const SURFACE_MAX = 300;
const LOYER_MIN = 0;
const LOYER_MAX = 5000;

function DraggableSlider({
    label,
    minValue,
    maxValue,
    value,
    onValueChange,
    formatValue,
}: {
    label: string;
    minValue: number;
    maxValue: number;
    value: number;
    onValueChange: (v: number) => void;
    formatValue: (v: number) => string;
}) {
    const trackWidth = useRef(0);
    const trackX = useRef(0);

    const percent = ((value - minValue) / (maxValue - minValue)) * 100;

    const handleTrackLayout = (e: LayoutChangeEvent) => {
        trackWidth.current = e.nativeEvent.layout.width;
        trackX.current = e.nativeEvent.layout.x;
    };

    const handleMove = (e: GestureResponderEvent) => {
        if (trackWidth.current === 0) return;
        const touchX = e.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, touchX / trackWidth.current));
        const newValue = Math.round(minValue + ratio * (maxValue - minValue));
        onValueChange(newValue);
    };

    return (
        <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1e293b", fontFamily: "Montserrat_700Bold" }}>{label}</Text>
                <View style={{ backgroundColor: "#f0f2f5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, color: "#6b7280", fontWeight: "500", fontFamily: "Montserrat_500Medium" }}>{formatValue(value)}</Text>
                </View>
            </View>
            <View
                onLayout={handleTrackLayout}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleMove}
                onResponderMove={handleMove}
                style={{
                    height: 32,
                    justifyContent: "center",
                }}
            >
                <View style={{ height: 4, backgroundColor: "#e5e7eb", borderRadius: 2 }}>
                    <View
                        style={{
                            height: 4,
                            backgroundColor: "#3153A1",
                            borderRadius: 2,
                            width: `${percent}%`,
                        }}
                    />
                </View>
                <View
                    style={{
                        position: "absolute",
                        left: `${percent}%`,
                        marginLeft: -10,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#fff",
                        borderWidth: 3,
                        borderColor: "#3153A1",
                        shadowColor: "#000",
                        shadowOpacity: 0.12,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 3,
                    }}
                />
            </View>
        </View>
    );
}

function PropertyCard({
    item,
    onPress,
}: {
    item: Property;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                marginBottom: 14,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
            }}
        >
            <View
                style={{
                    width: "100%",
                    height: 160,
                    backgroundColor: "#c7cdd6",
                    justifyContent: "flex-end",
                }}
            >
                {item.thumbnail && (
                    <Image
                        source={{ uri: item.thumbnail }}
                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                        contentFit="cover"
                    />
                )}

                {item.imagesCount > 0 && (
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            paddingBottom: 10,
                            gap: 5,
                        }}
                    >
                        {Array.from({ length: Math.min(item.imagesCount, 5) }).map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: i === 0 ? "#3153A1" : "rgba(255,255,255,0.5)",
                                }}
                            />
                        ))}
                    </View>
                )}
            </View>

            <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text
                    style={{ fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 2, fontFamily: "Montserrat_600SemiBold" }}
                    numberOfLines={1}
                >
                    {item.adresse}
                </Text>
                <Text style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6, fontFamily: "Montserrat_400Regular" }}>{item.ville}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#3153A1", fontFamily: "Montserrat_700Bold" }}>{item.prix}€</Text>
                        <Text style={{ fontSize: 12, color: "#9ca3af", fontFamily: "Montserrat_400Regular" }}> /mois</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Ionicons name="resize-outline" size={12} color="#9ca3af" />
                            <Text style={{ fontSize: 11, color: "#6b7280", marginLeft: 3 }}>{item.surface}m²</Text>
                        </View>
                        {item.type ? (
                            <View style={{ backgroundColor: "#eef2ff", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                                <Text style={{ fontSize: 10, color: "#3153A1", fontWeight: "600", fontFamily: "Montserrat_600SemiBold" }}>{item.type}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
            </View>
        </Pressable>
    );
}

function PaginationBar({
    currentPage,
    totalPages,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (p: number) => void;
}) {
    if (totalPages <= 1) return null;

    const pages: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i <= 2 || i >= totalPages - 0 || i === currentPage) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== "...") {
            pages.push("...");
        }
    }

    return (
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, gap: 2 }}>
            <Pressable
                onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
                style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: currentPage > 1 ? "#fff" : "transparent",
                    borderWidth: currentPage > 1 ? 1 : 0,
                    borderColor: "#e5e7eb",
                }}
            >
                <Text style={{ fontSize: 12, color: currentPage > 1 ? "#1e293b" : "#d1d5db", fontWeight: "600" }}>
                    Précédent
                </Text>
            </Pressable>

            {pages.map((p, i) =>
                p === "..." ? (
                    <Text key={`dots-${i}`} style={{ fontSize: 13, color: "#9ca3af", paddingHorizontal: 6 }}>
                        ...
                    </Text>
                ) : (
                    <Pressable
                        key={p}
                        onPress={() => onPageChange(p as number)}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            backgroundColor: currentPage === p ? "#3153A1" : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                                fontWeight: currentPage === p ? "700" : "500",
                                color: currentPage === p ? "#fff" : "#6b7280",
                            }}
                        >
                            {p}
                        </Text>
                    </Pressable>
                )
            )}

            <Pressable
                onPress={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: currentPage < totalPages ? "#fff" : "transparent",
                    borderWidth: currentPage < totalPages ? 1 : 0,
                    borderColor: "#e5e7eb",
                }}
            >
                <Text style={{ fontSize: 12, color: currentPage < totalPages ? "#1e293b" : "#d1d5db", fontWeight: "600" }}>
                    Suivant
                </Text>
            </Pressable>
        </View>
    );
}

export default function BiensPage() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [biens, setBiens] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [surfaceMax, setSurfaceMax] = useState(SURFACE_MAX);
    const [loyerMax, setLoyerMax] = useState(LOYER_MAX);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        fetchBiens();
    }, []);

    async function fetchBiens() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("properties")
                .select(`
                    id,
                    address,
                    city,
                    monthly_rent,
                    surface_m2,
                    property_type,
                    property_images (
                        count
                    )
                `)
                .eq("status", "available")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const mapped: Property[] = (data || []).map(p => ({
                id: p.id,
                adresse: p.address || "Adresse non renseignée",
                ville: p.city || "Ville non renseignée",
                prix: Number(p.monthly_rent) || 0,
                surface: Number(p.surface_m2) || 0,
                type: p.property_type || "",
                imagesCount: (p.property_images as any)?.[0]?.count || 0
            }));

            setBiens(mapped);
        } catch (error: any) {
            console.error("[Biens] Fetch error:", error);
            Alert.alert("Erreur", "Impossible de charger les biens.");
        } finally {
            setLoading(false);
        }
    }

    useScrollToTopOnFocus(scrollViewRef);

    const filteredBiens = useMemo(() => {
        const searchLower = search.trim().toLowerCase();
        return biens.filter((bien) => {
            if (searchLower) {
                const matchSearch =
                    bien.adresse.toLowerCase().includes(searchLower) ||
                    bien.ville.toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }
            if (bien.surface > surfaceMax) return false;
            if (bien.prix > loyerMax) return false;
            return true;
        });
    }, [search, surfaceMax, loyerMax, biens]);

    const totalPages = Math.max(1, Math.ceil(filteredBiens.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedBiens = filteredBiens.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    const handlePageChange = (p: number) => {
        setCurrentPage(p);
    };

    const handleFilter = () => {
        setCurrentPage(1);
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
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
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                            <Image
                                source={require("@/assets/images/logo-white.svg")}
                                style={{ width: 90, height: 24 }}
                                contentFit="contain"
                            />
                            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", fontFamily: "Montserrat_700Bold" }}>
                                Recherche de biens
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 3, fontFamily: "Montserrat_400Regular" }}>
                                Recherchez votre futur chez vous
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <NotificationBellButton />
                            <ProfileHeaderButton />
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: "#1e293b", marginBottom: 14, fontFamily: "Montserrat_700Bold" }}>
                        Trouver un appartement à Lille ?
                    </Text>

                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 14,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            marginBottom: 18,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "#f9fafb",
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: searchFocused ? "#3153A1" : "#e5e7eb",
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons name="search-outline" size={18} color="#9ca3af" />
                            <TextInput
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                value={search}
                                onChangeText={(text) => {
                                    setSearch(text);
                                    setCurrentPage(1);
                                }}
                                placeholder="Ville, code postal..."
                                placeholderTextColor="#9ca3af"
                                selectionColor="#3153A1"
                                cursorColor="#3153A1"
                                style={{
                                    flex: 1,
                                    marginLeft: 8,
                                    fontSize: 14,
                                    color: "#1e293b",
                                    paddingVertical: 0,
                                    fontFamily: "Montserrat_400Regular",
                                    outlineStyle: "none",
                                } as any}
                                returnKeyType="search"
                            />
                            {search.length > 0 && (
                                <Pressable onPress={() => { setSearch(""); setCurrentPage(1); }}>
                                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                                </Pressable>
                            )}
                        </View>

                        <DraggableSlider
                            label="Surface"
                            minValue={SURFACE_MIN}
                            maxValue={SURFACE_MAX}
                            value={surfaceMax}
                            onValueChange={setSurfaceMax}
                            formatValue={(v) => `0 - ${v} m²${v >= SURFACE_MAX ? " et +" : ""}`}
                        />

                        <DraggableSlider
                            label="Loyer"
                            minValue={LOYER_MIN}
                            maxValue={LOYER_MAX}
                            value={loyerMax}
                            onValueChange={setLoyerMax}
                            formatValue={(v) => `0 - ${v}€${v >= LOYER_MAX ? " et +" : ""}`}
                        />

                        <Pressable
                            onPress={handleFilter}
                            style={{
                                backgroundColor: "#3153A1",
                                borderRadius: 10,
                                paddingVertical: 12,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                marginTop: 4,
                            }}
                        >
                            <Ionicons name="options-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "Montserrat_600SemiBold" }}>Filtrer</Text>
                        </Pressable>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, color: "#6b7280" }}>
                            {filteredBiens.length} bien{filteredBiens.length > 1 ? "s" : ""} trouvé{filteredBiens.length > 1 ? "s" : ""}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                            Page {safePage}/{totalPages}
                        </Text>
                    </View>

                    {loading ? (
                        <View style={{ padding: 40, alignItems: "center" }}>
                            <Text style={{ color: "#6b7280", fontFamily: "Montserrat_500Medium" }}>Chargement des biens...</Text>
                        </View>
                    ) : pagedBiens.length > 0 ? (
                        pagedBiens.map((bien) => (
                            <PropertyCard
                                key={bien.id}
                                item={bien}
                                onPress={() => router.push(`/bien/${bien.id}` as any)}
                            />
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
                            }}
                        >
                            <Ionicons name="search" size={40} color="#d1d5db" />
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#6b7280", marginTop: 12 }}>
                                Aucun bien trouvé
                            </Text>
                            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, textAlign: "center" }}>
                                Modifiez vos critères de recherche{"\n"}pour trouver plus de résultats
                            </Text>
                        </View>
                    )}

                    <PaginationBar
                        currentPage={safePage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

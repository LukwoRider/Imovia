import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
    Dimensions,
    GestureResponderEvent,
    LayoutChangeEvent,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";
import { Text } from "@/components/ui/text";

const ALL_BIENS = [
    { id: 1, adresse: "25 Rue des Francs-Bourgeois", ville: "Lille", prix: 289, surface: 45, type: "Appartement", favori: true, images: 4 },
    { id: 2, adresse: "12 Avenue Foch", ville: "Lille", prix: 450, surface: 72, type: "Appartement", favori: false, images: 4 },
    { id: 3, adresse: "8 Rue de la Monnaie", ville: "Lille", prix: 620, surface: 95, type: "Maison", favori: false, images: 4 },
    { id: 4, adresse: "3 Boulevard Carnot", ville: "Paris", prix: 1200, surface: 120, type: "Appartement", favori: false, images: 4 },
    { id: 5, adresse: "15 Rue Nationale", ville: "Lille", prix: 380, surface: 55, type: "Studio", favori: false, images: 4 },
    { id: 6, adresse: "42 Rue Esquermoise", ville: "Lille", prix: 750, surface: 85, type: "Appartement", favori: true, images: 4 },
    { id: 7, adresse: "7 Place du Général de Gaulle", ville: "Lille", prix: 520, surface: 60, type: "Appartement", favori: false, images: 4 },
    { id: 8, adresse: "19 Rue Solférino", ville: "Lille", prix: 340, surface: 38, type: "Studio", favori: false, images: 4 },
    { id: 9, adresse: "28 Rue des Arts", ville: "Lyon", prix: 890, surface: 110, type: "Maison", favori: false, images: 4 },
    { id: 10, adresse: "5 Rue de Béthune", ville: "Lille", prix: 410, surface: 50, type: "Appartement", favori: false, images: 4 },
];

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
    onToggleFavori,
    onPress,
}: {
    item: typeof ALL_BIENS[0];
    onToggleFavori: (id: number) => void;
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
                <Pressable
                    onPress={() => onToggleFavori(item.id)}
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: item.favori ? "rgba(49,83,161,0.15)" : "rgba(255,255,255,0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons
                        name={item.favori ? "heart" : "heart-outline"}
                        size={19}
                        color={item.favori ? "#3153A1" : "#fff"}
                    />
                </Pressable>

                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        paddingBottom: 10,
                        gap: 5,
                    }}
                >
                    {Array.from({ length: item.images }).map((_, i) => (
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
    const [search, setSearch] = useState("");
    const [surfaceMax, setSurfaceMax] = useState(SURFACE_MAX);
    const [loyerMax, setLoyerMax] = useState(LOYER_MAX);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchFocused, setSearchFocused] = useState(false);
    const [favoris, setFavoris] = useState<Set<number>>(
        new Set(ALL_BIENS.filter((b) => b.favori).map((b) => b.id))
    );

    const toggleFavori = (id: number) => {
        setFavoris((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredBiens = useMemo(() => {
        const searchLower = search.trim().toLowerCase();
        return ALL_BIENS.filter((bien) => {
            if (searchLower) {
                const matchSearch =
                    bien.adresse.toLowerCase().includes(searchLower) ||
                    bien.ville.toLowerCase().includes(searchLower);
                if (!matchSearch) return false;
            }
            if (bien.surface > surfaceMax) return false;
            if (bien.prix > loyerMax) return false;
            return true;
        }).map((bien) => ({
            ...bien,
            favori: favoris.has(bien.id),
        }));
    }, [search, surfaceMax, loyerMax, favoris]);

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

                    {pagedBiens.length > 0 ? (
                        pagedBiens.map((bien) => (
                            <PropertyCard
                                key={bien.id}
                                item={bien}
                                onToggleFavori={toggleFavori}
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

import AjouterBienModal from "@/components/biens/AjouterBienModal";
import BiensPaginationBar from "@/components/biens/BiensPaginationBar";
import PropertyCard from "@/components/biens/PropertyCard";
import RangeSlider from "@/components/biens/RangeSlider";
import {
    ITEMS_PER_PAGE,
    LOYER_MAX,
    LOYER_MIN,
    SURFACE_MAX,
    SURFACE_MIN,
    type Property,
} from "@/components/biens/types";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";

function isOwnerOrAgencyRole(role?: string | null) {
    if (!role) return false;
    const normalized = role.trim().toLowerCase();
    return (
        normalized === "owner" ||
        normalized === "agency" ||
        normalized === "propriétaire" ||
        normalized === "proprietaire" ||
        normalized === "propriÃ©taire"
    );
}

export default function BiensPage() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const [biens, setBiens] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [surfaceMin, setSurfaceMin] = useState(SURFACE_MIN);
    const [surfaceMax, setSurfaceMax] = useState(SURFACE_MAX);
    const [loyerMin, setLoyerMin] = useState(LOYER_MIN);
    const [loyerMax, setLoyerMax] = useState(LOYER_MAX);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchFocused, setSearchFocused] = useState(false);

    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const initialize = async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const user = session?.user;

                    if (user) {
                        setUserId(user.id);

                        let role = user.user_metadata?.role || "tenant";
                        console.log("[Biens] Initial role from metadata:", role);

                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("role")
                            .eq("id", user.id)
                            .maybeSingle();

                        if (profile?.role) {
                            role = profile.role;
                            console.log("[Biens] Role confirmed from profile:", role);
                        }

                        setUserRole(role);
                        fetchBiens(role, user.id);
                    } else {
                        setUserRole("tenant");
                        fetchBiens("tenant");
                    }
                } catch (err) {
                    console.error("[Biens] Initialization error:", err);
                    setUserRole("tenant");
                    fetchBiens("tenant");
                }
            };
            initialize();
        }, [])
    );

    async function fetchBiens(role: string, uid?: string) {
        setLoading(true);
        try {
            let query = supabase
                .from("properties")
                .select(`
                    id,
                    address,
                    city,
                    monthly_rent,
                    surface_m2,
                    property_type,
                    property_images (
                        storage_path
                    )
                `);

            const isOwner = isOwnerOrAgencyRole(role);

            if (isOwner) {
                if (uid) {
                    console.log("[Biens] Fetching for owner/agency:", uid);
                    query = query.eq("owner_id", uid);
                } else {
                    console.warn("[Biens] User matches owner role but no UID provided, falling back to all available");
                    query = query.eq("status", "available");
                }
            } else {
                console.log("[Biens] Fetching for tenant (available properties)");
                query = query.eq("status", "available");
            }

            const { data, error } = await query.order("created_at", { ascending: false });

            if (error) throw error;

            const mapped: Property[] = (data || []).map(p => {
                const rawImages = (p.property_images as any[] || []);
                const imagesCount = rawImages.length;
                const allImageUrls = rawImages
                    .filter((img: any) => img?.storage_path)
                    .map((img: any) => {
                        const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(img.storage_path);
                        return urlData.publicUrl;
                    });
                return {
                    id: p.id,
                    adresse: p.address || "Adresse non renseignée",
                    ville: p.city || "Ville non renseignée",
                    prix: Number(p.monthly_rent) || 0,
                    surface: Number(p.surface_m2) || 0,
                    type: p.property_type || "",
                    imagesCount,
                    thumbnail: allImageUrls[0],
                    images: allImageUrls,
                };
            });

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
            if (bien.surface < surfaceMin || bien.surface > surfaceMax) return false;
            if (bien.prix < loyerMin || bien.prix > loyerMax) return false;
            return true;
        });
    }, [search, surfaceMin, surfaceMax, loyerMin, loyerMax, biens]);

    const totalPages = Math.max(1, Math.ceil(filteredBiens.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedBiens = filteredBiens.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    const handlePageChange = (p: number) => {
        setCurrentPage(p);
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
                                {isOwnerOrAgencyRole(userRole) ? "Mes Biens" : "Recherche de biens"}
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 3, fontFamily: "Montserrat_400Regular" }}>
                                {isOwnerOrAgencyRole(userRole) ? "Gérez vos logements et locataires" : "Recherchez votre futur chez vous"}
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>

                            <NotificationBellButton />
                            <ProfileHeaderButton />
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
                    {userRole && (userRole.toLowerCase() === 'owner' || userRole.toLowerCase() === 'agency' || userRole.toLowerCase() === 'propriétaire') && (
                        <Pressable
                            onPress={() => setIsAddModalVisible(true)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "#3153A1",
                                borderRadius: 10,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                alignSelf: "flex-start",
                                marginBottom: 12,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="add-circle" size={18} color="#fff" />
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12, fontFamily: 'Montserrat_700Bold' }}>Ajouter</Text>
                            </View>
                        </Pressable>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 17, fontWeight: "700", color: "#1e293b", marginBottom: 14, fontFamily: "Montserrat_700Bold" }}>
                            {userRole && (userRole.toLowerCase() === 'owner' || userRole.toLowerCase() === 'agency' || userRole.toLowerCase() === 'propriétaire') ? "Vos biens immobiliers" : "Trouver un appartement ?"}
                        </Text>
                    </View>

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
                                    ...(Platform.OS === "web"
                                        ? ({ outlineStyle: "none" } as any)
                                        : {}),
                                }}
                                returnKeyType="search"
                            />
                            {search.length > 0 && (
                                <Pressable onPress={() => { setSearch(""); setCurrentPage(1); }}>
                                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                                </Pressable>
                            )}
                        </View>

                        <RangeSlider
                            label="Surface"
                            minValue={SURFACE_MIN}
                            maxValue={SURFACE_MAX}
                            startValue={surfaceMin}
                            endValue={surfaceMax}
                            onRangeChange={(min, max) => {
                                setSurfaceMin(min);
                                setSurfaceMax(max);
                                setCurrentPage(1);
                            }}
                            formatRange={(min, max) => `${min} - ${max} m²${max >= SURFACE_MAX ? " et +" : ""}`}
                        />

                        <RangeSlider
                            label="Loyer"
                            minValue={LOYER_MIN}
                            maxValue={LOYER_MAX}
                            startValue={loyerMin}
                            endValue={loyerMax}
                            onRangeChange={(min, max) => {
                                setLoyerMin(min);
                                setLoyerMax(max);
                                setCurrentPage(1);
                            }}
                            formatRange={(min, max) => `${min}€ - ${max}€${max >= LOYER_MAX ? " et +" : ""}`}
                        />


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
                                onPress={() => router.push(`/(locataire)/bien/${bien.id}` as any)}
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

                    <BiensPaginationBar
                        currentPage={safePage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </View>
            </ScrollView>

            <AjouterBienModal
                visible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                onSuccess={() => fetchBiens(userRole || "tenant", userId || undefined)}
                ownerId={userId || ""}
            />
        </View>
    );
}

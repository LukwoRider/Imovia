import AjouterDocumentModal from "@/components/documents/AjouterDocumentModal";
import DocumentRow from "@/components/documents/DocumentRow";
import DocumentsPaginationBar from "@/components/documents/DocumentsPaginationBar";
import { CATEGORIES, ITEMS_PER_PAGE, type DocCategory, type Document } from "@/components/documents/types";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";

function mapDocType(type?: string | null): DocCategory {
    switch (type) {
        case "contract":
            return "contrats";
        case "inventory":
            return "etat";
        case "receipt":
            return "quittances";
        default:
            return "autres";
    }
}

export default function ProprietaireDocumentsPage() {
    const scrollViewRef = useRef<ScrollView>(null);
    useScrollToTopOnFocus(scrollViewRef);

    const [loading, setLoading] = useState(true);
    const [refreshTick, setRefreshTick] = useState(0);
    const [ownerId, setOwnerId] = useState("");
    const [documents, setDocuments] = useState<Document[]>([]);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<DocCategory>("tous");
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [refreshTick]);

    async function fetchDocuments() {
        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                setDocuments([]);
                return;
            }
            setOwnerId(user.id);

            const { data: uploaded } = await supabase
                .from("documents")
                .select("id, title, document_type, storage_path, lease_id, document_date, created_at")
                .eq("uploader_id", user.id)
                .order("created_at", { ascending: false });

            const { data: leases } = await supabase
                .from("leases")
                .select("id, property_id, properties!inner(owner_id)")
                .eq("properties.owner_id", user.id);

            const leaseIds = (leases || []).map((l: any) => l.id);
            let leaseDocs: any[] = [];
            if (leaseIds.length) {
                const { data } = await supabase
                    .from("documents")
                    .select("id, title, document_type, storage_path, lease_id, document_date, created_at")
                    .in("lease_id", leaseIds)
                    .order("created_at", { ascending: false });
                leaseDocs = data || [];
            }

            const unique = new Map<string, any>();
            [...(uploaded || []), ...leaseDocs].forEach((doc: any) => unique.set(String(doc.id), doc));

            const mapped = Array.from(unique.values())
                .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at))
                .map((d: any): Document => ({
                    id: String(d.id),
                    titre: d.title || "Sans titre",
                    date: new Date(d.document_date || d.created_at).toLocaleDateString("fr-FR"),
                    categorie: mapDocType(d.document_type),
                    storage_path: d.storage_path || "",
                    lease_id: d.lease_id || "",
                }));

            setDocuments(mapped);
        } catch (error) {
            console.error("[OwnerDocuments] Fetch error:", error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredDocs = useMemo(() => {
        let docs = documents;
        if (activeCategory !== "tous") {
            docs = docs.filter((d) => d.categorie === activeCategory);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            docs = docs.filter((d) => d.titre.toLowerCase().includes(q));
        }
        return docs;
    }, [documents, activeCategory, search]);

    const totalPages = Math.max(1, Math.ceil(filteredDocs.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedDocs = filteredDocs.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, activeCategory]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

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
                            <Image source={require("@/assets/images/logo-white.svg")} style={{ width: 96, height: 26 }} contentFit="contain" />
                            <Text style={{ color: "#fff", fontSize: 18, marginTop: 8, fontFamily: "Montserrat_700Bold" }}>
                                Mes Documents
                            </Text>
                            <Text style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, marginTop: 4, fontFamily: "Montserrat_400Regular" }}>
                                Accedez a tous vos documents de location
                            </Text>
                        </View>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <NotificationBellButton />
                            <ProfileHeaderButton />
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
                    <Pressable
                        onPress={() => setShowAddModal(true)}
                        style={{
                            backgroundColor: "#3153A1",
                            borderRadius: 10,
                            paddingVertical: 11,
                            paddingHorizontal: 14,
                            flexDirection: "row",
                            alignItems: "center",
                            alignSelf: "flex-start",
                            marginBottom: 14,
                        }}
                    >
                        <Ionicons name="add-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={{ color: "#fff", fontFamily: "Montserrat_600SemiBold", fontSize: 13 }}>
                            Ajouter un document
                        </Text>
                    </Pressable>

                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 12,
                            marginBottom: 12,
                        }}
                    >
                        <Ionicons name="search-outline" size={16} color="#9ca3af" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search..."
                            placeholderTextColor="#9ca3af"
                            style={{
                                flex: 1,
                                height: 42,
                                marginLeft: 8,
                                color: "#1e293b",
                                fontFamily: "Montserrat_400Regular",
                            }}
                        />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                backgroundColor: "#fff",
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: "#c7d2fe",
                                padding: 4,
                                gap: 4,
                            }}
                        >
                            {CATEGORIES.map((cat) => {
                                const active = activeCategory === cat.key;
                                return (
                                    <Pressable
                                        key={cat.key}
                                        onPress={() => setActiveCategory(cat.key)}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            borderRadius: 8,
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            backgroundColor: active ? "#eef2ff" : "transparent",
                                        }}
                                    >
                                        <Ionicons name={cat.icon as any} size={14} color="#3153A1" />
                                        <Text style={{ marginLeft: 6, color: "#1f2937", fontSize: 12, fontFamily: "Montserrat_500Medium" }}>
                                            {cat.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            padding: 12,
                            marginTop: 8,
                        }}
                    >
                        {loading ? (
                            <View style={{ paddingVertical: 28, alignItems: "center" }}>
                                <ActivityIndicator size="small" color="#3153A1" />
                                <Text style={{ marginTop: 10, color: "#6b7280" }}>Chargement des documents...</Text>
                            </View>
                        ) : pagedDocs.length > 0 ? (
                            <>
                                {pagedDocs.map((doc) => (
                                    <DocumentRow key={doc.id} doc={doc} isManagement={true} onDelete={() => setRefreshTick((t) => t + 1)} />
                                ))}
                                <DocumentsPaginationBar currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </>
                        ) : (
                            <View style={{ paddingVertical: 24, alignItems: "center" }}>
                                <Ionicons name="document-outline" size={22} color="#9ca3af" />
                                <Text style={{ marginTop: 10, color: "#6b7280", fontStyle: "italic" }}>
                                    Aucun document disponible.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <AjouterDocumentModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                    setShowAddModal(false);
                    setRefreshTick((t) => t + 1);
                }}
                ownerId={ownerId}
            />
        </View>
    );
}

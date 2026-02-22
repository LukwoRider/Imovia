import AjouterDocumentModal from "@/components/documents/AjouterDocumentModal";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { Text } from "@/components/ui/text";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { cacheDirectory, EncodingType, writeAsStringAsync } from "expo-file-system/legacy";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as MailComposer from "expo-mail-composer";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, TextInput, View } from "react-native";

type DocCategory = "tous" | "contrats" | "etat" | "autres";

type Document = {
    id: string;
    titre: string;
    date: string;
    categorie: DocCategory;
    storage_path: string;
    lease_id: string;
};


const ITEMS_PER_PAGE = 4;

const CATEGORIES: { key: DocCategory; label: string; icon: string }[] = [
    { key: "tous", label: "Tous", icon: "list-outline" },
    { key: "contrats", label: "Contrats", icon: "briefcase-outline" },
    { key: "etat", label: "Etat", icon: "clipboard-outline" },
    { key: "autres", label: "Autres", icon: "albums-outline" },
];

function DocumentRow({
    doc,
    isManagement,
    onDelete
}: {
    doc: Document;
    isManagement: boolean;
    onDelete: () => void;
}) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            let fullPath = doc.storage_path;

            if (!fullPath.startsWith("leases/")) {
                const cleanName = fullPath.replace(/^\//, "");
                fullPath = `leases/${doc.lease_id}/${cleanName}`;
            }


            const { data, error } = await supabase.storage
                .from("documents")
                .createSignedUrl(fullPath, 60);

            if (error) throw error;
            if (data?.signedUrl) {
                await Linking.openURL(data.signedUrl);
            }
        } catch (error: any) {
            console.error("[Documents] Download error:", error);
            Alert.alert("Erreur", "Impossible de récupérer le fichier : " + (error.message || "Fichier non trouvé"));
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {

        const executeDelete = async () => {
            try {
                if (doc.storage_path) {
                    const { error: storageError } = await supabase.storage
                        .from("documents")
                        .remove([doc.storage_path]);

                    if (storageError) {
                        console.error("[Documents] Storage delete error:", storageError);
                    }
                }

                const { error: dbError } = await supabase
                    .from("documents")
                    .delete()
                    .eq("id", doc.id);

                if (dbError) {
                    console.error("[Documents] Database delete error:", dbError);
                    throw dbError;
                }

                Alert.alert("Succès", "Document supprimé.");
                onDelete();
            } catch (e: any) {
                console.error("[Documents] Full delete crash:", e);
                Alert.alert("Erreur", "Impossible de supprimer le document : " + (e.message || "Erreur inconnue"));
            }
        };

        if (Platform.OS === "web") {
            if (window.confirm("Voulez-vous vraiment supprimer ce document ?")) {
                await executeDelete();
            }
        } else {
            Alert.alert("Supprimer", "Voulez-vous vraiment supprimer ce document ?", [
                { text: "Annuler", style: "cancel", onPress: () => console.log("[Documents] Delete cancelled") },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: executeDelete
                }
            ]);
        }
    };

    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: "#e5e7eb",
            }}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: "#eef2ff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                }}
            >
                <Ionicons name="document-text-outline" size={18} color="#3153A1" />
            </View>

            <View style={{ flex: 1, marginRight: 10 }}>
                <Text
                    style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#1e293b",
                        fontFamily: "Montserrat_600SemiBold",
                    }}
                    numberOfLines={2}
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

            <View style={{ flexDirection: 'row', gap: 6 }}>
                {isManagement && (
                    <Pressable
                        onPress={() => {
                            handleDelete();
                        }}
                        hitSlop={15}
                        style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: pressed ? "#fca5a5" : "#fee2e2",
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            opacity: pressed ? 0.7 : 1,
                        })}
                    >
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
                    </Pressable>
                )}
                <Pressable
                    onPress={handleDownload}
                    disabled={isDownloading}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: isDownloading ? "#9ca3af" : "#3153A1",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                    }}
                >
                    <Text
                        style={{
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: "600",
                            marginRight: 6,
                            fontFamily: "Montserrat_600SemiBold",
                        }}
                    >
                        {isDownloading ? "..." : "Télécharger"}
                    </Text>
                    <Ionicons name="download-outline" size={14} color="#fff" />
                </Pressable>
            </View>
        </View>
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
        if (i <= 2 || i >= totalPages || i === currentPage) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== "...") {
            pages.push("...");
        }
    }

    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 14,
                gap: 2,
            }}
        >
            <Pressable
                onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
                style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: currentPage > 1 ? "#fff" : "transparent",
                    borderWidth: currentPage > 1 ? 1 : 0,
                    borderColor: "#e5e7eb",
                }}
            >
                <Text
                    style={{
                        fontSize: 12,
                        color: currentPage > 1 ? "#1e293b" : "#d1d5db",
                        fontWeight: "600",
                        fontFamily: "Montserrat_600SemiBold",
                    }}
                >
                    Précédent
                </Text>
            </Pressable>

            {pages.map((p, i) =>
                p === "..." ? (
                    <Text
                        key={`dots-${i}`}
                        style={{
                            fontSize: 13,
                            color: "#9ca3af",
                            paddingHorizontal: 6,
                            fontFamily: "Montserrat_400Regular",
                        }}
                    >
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
                                fontFamily:
                                    currentPage === p
                                        ? "Montserrat_700Bold"
                                        : "Montserrat_500Medium",
                            }}
                        >
                            {p}
                        </Text>
                    </Pressable>
                )
            )}

            <Pressable
                onPress={() =>
                    currentPage < totalPages && onPageChange(currentPage + 1)
                }
                style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: currentPage < totalPages ? "#fff" : "transparent",
                    borderWidth: currentPage < totalPages ? 1 : 0,
                    borderColor: "#e5e7eb",
                }}
            >
                <Text
                    style={{
                        fontSize: 12,
                        color: currentPage < totalPages ? "#1e293b" : "#d1d5db",
                        fontWeight: "600",
                        fontFamily: "Montserrat_600SemiBold",
                    }}
                >
                    Suivant
                </Text>
            </Pressable>
        </View>
    );
}

function QuickAction({
    icon,
    title,
    subtitle,
    onPress,
}: {
    icon: string;
    title: string;
    subtitle: string;
    onPress?: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                flex: 1,
                backgroundColor: "#f9fafb",
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                alignItems: "center",
            })}
        >
            <View
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "#eef2ff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                }}
            >
                <Ionicons name={icon as any} size={18} color="#3153A1" />
            </View>
            <Text
                style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#1e293b",
                    textAlign: "center",
                    marginBottom: 4,
                    fontFamily: "Montserrat_700Bold",
                }}
                numberOfLines={2}
            >
                {title}
            </Text>
            <Text
                style={{
                    fontSize: 10,
                    color: "#9ca3af",
                    textAlign: "center",
                    fontFamily: "Montserrat_400Regular",
                }}
                numberOfLines={2}
            >
                {subtitle}
            </Text>
        </Pressable>
    );
}

export default function DocumentsPage() {
    const scrollViewRef = useRef<ScrollView>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<DocCategory>("tous");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchFocused, setSearchFocused] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const isOwnerOrAgency = useMemo(() => {
        if (!userRole) return false;
        const role = userRole.toLowerCase();
        return role === 'owner' || role === 'agency' || role === 'propriétaire';
    }, [userRole]);

    const [isZipping, setIsZipping] = useState(false);

    const generateZip = async () => {
        if (documents.length === 0) {
            Alert.alert("Information", "Aucun document à compresser.");
            return null;
        }

        setIsZipping(true);
        const zip = new JSZip();

        try {
            for (const doc of documents) {
                if (!doc.storage_path) continue;

                const { data, error } = await supabase.storage
                    .from("documents")
                    .download(doc.storage_path);

                if (error) {
                    console.error(`Error downloading ${doc.titre}:`, error);
                    continue;
                }

                const arrayBuffer = await data.arrayBuffer();

                const ext = doc.storage_path.split('.').pop() || 'pdf';
                const filename = `${doc.titre}.${ext}`.replace(/[<>:"/\\|?*]/g, '_');
                zip.file(filename, arrayBuffer);
            }

            if (Platform.OS === 'web') {
                return await zip.generateAsync({ type: "blob" });
            } else {
                const base64 = await zip.generateAsync({ type: "base64" });
                const zipUri = cacheDirectory + "MesDocuments_Imovia.zip";
                await writeAsStringAsync(zipUri, base64, {
                    encoding: EncodingType.Base64,
                });
                return zipUri;
            }
        } catch (error) {
            console.error("ZIP Generation error:", error);
            Alert.alert("Erreur", "Impossible de générer le fichier ZIP.");
            return null;
        } finally {
            setIsZipping(false);
        }
    };

    const handleDownloadAll = async () => {
        const result = await generateZip();
        if (!result) return;

        if (Platform.OS === "web") {
            const blob = result as Blob;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'MesDocuments_Imovia.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } else {
            const uri = result as string;
            await Sharing.shareAsync(uri, {
                mimeType: "application/zip",
                dialogTitle: "Télécharger mes documents",
                UTI: "com.pkware.zip-archive",
            });
        }
    };

    const handleEmailAll = async () => {
        const result = await generateZip();
        if (!result) return;

        if (Platform.OS === 'web') {
            const confirmEmail = window.confirm("Sur navigateur, vous devez télécharger le fichier ZIP puis l'attacher manuellement. Voulez-vous télécharger le ZIP et ouvrir votre messagerie ?");
            if (confirmEmail) {
                handleDownloadAll();
                Linking.openURL("mailto:?subject=Mes Documents Imovia&body=Veuillez trouver ci-joint mes documents Imovia.");
            }
        } else {
            const uri = result as string;
            const isAvailable = await MailComposer.isAvailableAsync();
            if (isAvailable) {
                await MailComposer.composeAsync({
                    subject: "Mes Documents Imovia",
                    body: "Veuillez trouver ci-joint mes documents Imovia.",
                    attachments: [uri],
                });
            } else {
                Alert.alert("Erreur", "L'envoi d'e-mail n'est pas disponible sur cet appareil.");
                await Sharing.shareAsync(uri);
            }
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    async function fetchDocuments() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            setUserId(user.id);

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .maybeSingle();

            const profileRole = profile?.role || user.user_metadata?.role || "tenant";
            setUserRole(profileRole);

            const checkRole = profileRole.toLowerCase();
            const isManagement = checkRole === 'owner' || checkRole === 'agency' || checkRole === 'propriétaire';

            let dbDocs: any[] = [];
            let docError: any = null;

            if (isManagement) {
                const { data, error } = await supabase
                    .from("documents")
                    .select("*")
                    .eq("uploader_id", user.id)
                    .order("created_at", { ascending: false });
                dbDocs = data || [];
                docError = error;
            } else {
                // Fetch leases for this tenant
                const { data: leases, error: leaseError } = await supabase
                    .from("lease_tenants")
                    .select("lease_id")
                    .eq("tenant_id", user.id);

                if (leaseError) throw leaseError;

                const leaseIds = leases?.map(l => l.lease_id) || [];

                if (leaseIds.length > 0) {
                    const { data, error } = await supabase
                        .from("documents")
                        .select("*")
                        .in("lease_id", leaseIds)
                        .order("created_at", { ascending: false });
                    dbDocs = data || [];
                    docError = error;
                }
            }

            if (docError) throw docError;

            const mappedDocs: Document[] = (dbDocs || []).map(d => ({
                id: d.id,
                titre: d.title || "Sans titre",
                date: d.document_date ? new Date(d.document_date).toLocaleDateString("fr-FR") : new Date(d.created_at).toLocaleDateString("fr-FR"),
                categorie: mapDocType(d.document_type),
                storage_path: d.storage_path,
                lease_id: d.lease_id,
            }));

            setDocuments(mappedDocs);
        } catch (error: any) {
            console.error("[Documents] Fetch error:", error);
            Alert.alert("Erreur", "Impossible de charger les documents.");
        } finally {
            setLoading(false);
        }
    }

    function mapDocType(type: string): DocCategory {
        switch (type) {
            case "contract": return "contrats";
            case "inventory": return "etat";
            case "receipt":
            case "other":
            default: return "autres";
        }
    }

    useScrollToTopOnFocus(scrollViewRef);

    const filteredDocs = useMemo(() => {
        let docs = documents;

        if (activeCategory !== "tous") {
            docs = docs.filter((d) => d.categorie === activeCategory);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            docs = docs.filter(
                (d) =>
                    d.titre.toLowerCase().includes(q) ||
                    d.date.includes(q)
            );
        }

        return docs;
    }, [search, activeCategory, documents]);

    const totalPages = Math.max(1, Math.ceil(filteredDocs.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedDocs = filteredDocs.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    const handleCategoryChange = (cat: DocCategory) => {
        setActiveCategory(cat);
        setCurrentPage(1);
    };

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
                                Mes Documents
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
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <NotificationBellButton />
                            <ProfileHeaderButton />
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
                    {isOwnerOrAgency && (
                        <Pressable
                            onPress={() => setShowAddModal(true)}
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
                            <Ionicons name="add-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                            <Text
                                style={{
                                    color: "#fff",
                                    fontSize: 11,
                                    fontWeight: "600",
                                    fontFamily: "Montserrat_600SemiBold",
                                }}
                            >
                                Ajouter
                            </Text>
                        </Pressable>
                    )}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#fff",
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderWidth: 1,
                            borderColor: searchFocused ? "#3153A1" : "#e5e7eb",
                            marginBottom: 14,
                        }}
                    >
                        <Ionicons
                            name="search-outline"
                            size={18}
                            color="#9ca3af"
                            style={{ marginRight: 10 }}
                        />
                        <TextInput
                            placeholder="Rechercher"
                            placeholderTextColor="#9ca3af"
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            value={search}
                            onChangeText={(t) => {
                                setSearch(t);
                                setCurrentPage(1);
                            }}
                            selectionColor="#3153A1"
                            cursorColor="#3153A1"
                            style={{
                                flex: 1,
                                fontSize: 14,
                                color: "#1e293b",
                                fontFamily: "Montserrat_400Regular",
                                padding: 0,
                                outlineStyle: "none",
                            } as any}
                        />
                        {search.length > 0 && (
                            <Pressable
                                onPress={() => {
                                    setSearch("");
                                    setCurrentPage(1);
                                }}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={18}
                                    color="#9ca3af"
                                />
                            </Pressable>
                        )}
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            gap: 6,
                            paddingBottom: 14,
                        }}
                    >
                        {CATEGORIES.map((cat) => {
                            const active = activeCategory === cat.key;
                            return (
                                <Pressable
                                    key={cat.key}
                                    onPress={() => handleCategoryChange(cat.key)}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        backgroundColor: active ? "#3153A1" : "#fff",
                                        borderRadius: 20,
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderWidth: 1,
                                        borderColor: active ? "#3153A1" : "#e5e7eb",
                                    }}
                                >
                                    <Ionicons
                                        name={cat.icon as any}
                                        size={14}
                                        color={active ? "#fff" : "#6b7280"}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: "600",
                                            color: active ? "#fff" : "#374151",
                                            fontFamily: "Montserrat_600SemiBold",
                                        }}
                                    >
                                        {cat.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {loading ? (
                        <View style={{ padding: 40, alignItems: "center" }}>
                            <Text style={{ color: "#6b7280", fontFamily: "Montserrat_500Medium" }}>Chargement des documents...</Text>
                        </View>
                    ) : pagedDocs.length > 0 ? (
                        pagedDocs.map((doc) => (
                            <DocumentRow
                                key={doc.id}
                                doc={doc}
                                isManagement={isOwnerOrAgency}
                                onDelete={fetchDocuments}
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
                                marginBottom: 10,
                            }}
                        >
                            <Ionicons
                                name="document-outline"
                                size={40}
                                color="#d1d5db"
                            />
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: "#9ca3af",
                                    marginTop: 12,
                                    textAlign: "center",
                                    fontFamily: "Montserrat_500Medium",
                                }}
                            >
                                Aucun document trouvé
                            </Text>
                        </View>
                    )}

                    <PaginationBar
                        currentPage={safePage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />

                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            marginTop: 6,
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
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    backgroundColor: "#eef2ff",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 10,
                                }}
                            >
                                <Ionicons
                                    name="flash-outline"
                                    size={16}
                                    color="#3153A1"
                                />
                            </View>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: "700",
                                    color: "#1e293b",
                                    fontFamily: "Montserrat_700Bold",
                                }}
                            >
                                Actions Rapides
                            </Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <QuickAction
                                icon="download-outline"
                                title={isZipping ? "Compression..." : "Telecharger tous Mes Documents"}
                                subtitle="Telecharger tous vos documents"
                                onPress={handleDownloadAll}
                            />
                            <QuickAction
                                icon="mail-outline"
                                title={isZipping ? "Compression..." : "Envoyer par e-mail"}
                                subtitle="Envoyer vos documents par mail"
                                onPress={handleEmailAll}
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {isOwnerOrAgency && userId && (
                <AjouterDocumentModal
                    visible={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchDocuments();
                    }}
                    ownerId={userId}
                />
            )}
        </View>
    );
}

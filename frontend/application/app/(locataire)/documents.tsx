import { Ionicons } from "@expo/vector-icons";
import NotificationBellButton from "@/components/ui/notification-bell-button";
import ProfileHeaderButton from "@/components/ui/profile-header-button";
import { useScrollToTopOnFocus } from "@/hooks/use-scroll-to-top-on-focus";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Text } from "@/components/ui/text";

type DocCategory = "tous" | "contrats" | "etat" | "autres";

type Document = {
    id: number;
    titre: string;
    date: string;
    categorie: "contrats" | "etat" | "autres";
};

const ALL_DOCUMENTS: Document[] = [
    { id: 1, titre: "Contrat de location - Marais", date: "07/04/2025", categorie: "contrats" },
    { id: 2, titre: "État des lieux d'entrée", date: "01/01/2024", categorie: "etat" },
    { id: 3, titre: "Quittance Janvier 2024", date: "10/01/2024", categorie: "autres" },
    { id: 4, titre: "Contrat de location - Marais", date: "07/04/2025", categorie: "contrats" },
    { id: 5, titre: "Quittance Février 2024", date: "10/02/2024", categorie: "autres" },
    { id: 6, titre: "État des lieux de sortie", date: "15/03/2025", categorie: "etat" },
    { id: 7, titre: "Avenant au contrat", date: "01/06/2024", categorie: "contrats" },
    { id: 8, titre: "Quittance Mars 2024", date: "10/03/2024", categorie: "autres" },
];

const ITEMS_PER_PAGE = 4;

const CATEGORIES: { key: DocCategory; label: string; icon: string }[] = [
    { key: "tous", label: "Tous", icon: "list-outline" },
    { key: "contrats", label: "Contrats", icon: "briefcase-outline" },
    { key: "etat", label: "Etat", icon: "clipboard-outline" },
    { key: "autres", label: "Autres", icon: "albums-outline" },
];

function DocumentRow({ doc }: { doc: Document }) {
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

            <Pressable
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#3153A1",
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
                    Telecharger
                </Text>
                <Ionicons name="download-outline" size={14} color="#fff" />
            </Pressable>
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
}: {
    icon: string;
    title: string;
    subtitle: string;
}) {
    return (
        <Pressable
            style={{
                flex: 1,
                backgroundColor: "#f9fafb",
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                alignItems: "center",
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
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<DocCategory>("tous");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchFocused, setSearchFocused] = useState(false);
    useScrollToTopOnFocus(scrollViewRef);

    const filteredDocs = useMemo(() => {
        let docs = ALL_DOCUMENTS;

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
    }, [search, activeCategory]);

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

                    {pagedDocs.length > 0 ? (
                        pagedDocs.map((doc) => (
                            <DocumentRow key={doc.id} doc={doc} />
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
                                title="Telecharger tous Mes Documents"
                                subtitle="Telecharger tous vos documents sans réflechir"
                            />
                            <QuickAction
                                icon="mail-outline"
                                title="Envoyer par e-mail"
                                subtitle="Envoyer vos documents sur votre mail"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

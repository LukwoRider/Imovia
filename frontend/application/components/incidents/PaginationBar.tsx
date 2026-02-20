import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

export default function PaginationBar({
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
                            backgroundColor:
                                currentPage === p ? "#3153A1" : "transparent",
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
                    backgroundColor:
                        currentPage < totalPages ? "#fff" : "transparent",
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

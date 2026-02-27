import { Text } from "@/components/ui/text";
import { Pressable, View } from "react-native";

type BiensPaginationBarProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function BiensPaginationBar({
  currentPage,
  totalPages,
  onPageChange,
}: BiensPaginationBarProps) {
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
        paddingVertical: 18,
        gap: 2,
      }}
    >
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
        <Text
          style={{
            fontSize: 12,
            color: currentPage > 1 ? "#1e293b" : "#d1d5db",
            fontWeight: "600",
          }}
        >
          Précédent
        </Text>
      </Pressable>

      {pages.map((page, index) =>
        page === "..." ? (
          <Text
            key={`dots-${index}`}
            style={{ fontSize: 13, color: "#9ca3af", paddingHorizontal: 6 }}
          >
            ...
          </Text>
        ) : (
          <Pressable
            key={page}
            onPress={() => onPageChange(page)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: currentPage === page ? "#3153A1" : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: currentPage === page ? "700" : "500",
                color: currentPage === page ? "#fff" : "#6b7280",
              }}
            >
              {page}
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
        <Text
          style={{
            fontSize: 12,
            color: currentPage < totalPages ? "#1e293b" : "#d1d5db",
            fontWeight: "600",
          }}
        >
          Suivant
        </Text>
      </Pressable>
    </View>
  );
}

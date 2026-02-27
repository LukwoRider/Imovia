import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Linking, Platform, Pressable, View } from "react-native";
import type { Document } from "./types";

type DocumentRowProps = {
  doc: Document;
  isManagement: boolean;
  onDelete: () => void;
};

export default function DocumentRow({
  doc,
  isManagement,
  onDelete,
}: DocumentRowProps) {
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
      Alert.alert(
        "Erreur",
        "Impossible de récupérer le fichier : " +
          (error.message || "Fichier non trouvé")
      );
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
        Alert.alert(
          "Erreur",
          "Impossible de supprimer le document : " +
            (e.message || "Erreur inconnue")
        );
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Voulez-vous vraiment supprimer ce document ?")) {
        await executeDelete();
      }
    } else {
      Alert.alert("Supprimer", "Voulez-vous vraiment supprimer ce document ?", [
        {
          text: "Annuler",
          style: "cancel",
          onPress: () => console.log("[Documents] Delete cancelled"),
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: executeDelete,
        },
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

      <View style={{ flexDirection: "row", gap: 6 }}>
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


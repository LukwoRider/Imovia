import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from "react-native";

type Profile = {
    id: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    email?: string;
};

type EditPropertyData = {
    id: string;
    address: string;
    city: string;
    postal_code: string;
    property_type: string;
    rooms: number;
    bathrooms: number;
    surface_m2: number;
    monthly_rent: number;
    floor_number: number;
    is_furnished: boolean;
    has_elevator: boolean;
    energy_class: string;
    description: string;
    available_from: string | null;
    images?: string[];
};

type AjouterBienModalProps = {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ownerId: string;
    editProperty?: EditPropertyData | null;
};

export default function AjouterBienModal({
    visible,
    onClose,
    onSuccess,
    ownerId,
    editProperty,
}: AjouterBienModalProps) {
    const [submitting, setSubmitting] = useState(false);

    const [postalCode, setPostalCode] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [statusText, setStatusText] = useState("");
    const [propertyType, setPropertyType] = useState("Maison");
    const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);
    const [rooms, setRooms] = useState("");
    const [bathrooms, setBathrooms] = useState("");
    const [surface, setSurface] = useState("");
    const [rent, setRent] = useState("");
    const [floor, setFloor] = useState("");
    const [availableFrom, setAvailableFrom] = useState("");
    const [description, setDescription] = useState("");
    const [isFurnished, setIsFurnished] = useState<boolean | null>(null);
    const [hasElevator, setHasElevator] = useState<boolean | null>(null);
    const [energyClass, setEnergyClass] = useState("");
    const [showEnergyClassPicker, setShowEnergyClassPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const PROPERTY_TYPES = ["Maison", "Appartement", "Studio", "Loft"];
    const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F"];


    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [initialRemoteImages, setInitialRemoteImages] = useState<string[]>([]);

    const isFormValid = address.trim() !== "" && city.trim() !== "" && rent.trim() !== "" && surface.trim() !== "" && rooms.trim() !== "";





    // Pre-fill form when editing
    useEffect(() => {
        if (editProperty && visible) {
            setAddress(editProperty.address || "");
            setCity(editProperty.city || "");
            setPostalCode(editProperty.postal_code || "");
            setPropertyType(editProperty.property_type || "Maison");
            setRooms(String(editProperty.rooms || ""));
            setBathrooms(String(editProperty.bathrooms || ""));
            setSurface(String(editProperty.surface_m2 || ""));
            setRent(String(editProperty.monthly_rent || ""));
            setFloor(String(editProperty.floor_number || ""));
            setIsFurnished(editProperty.is_furnished);
            setHasElevator(editProperty.has_elevator);
            setEnergyClass(editProperty.energy_class || "");
            setDescription(editProperty.description || "");
            if (editProperty.available_from) {
                const datePart = editProperty.available_from.split('T')[0];
                const parts = datePart.split('-');
                if (parts.length === 3) {
                    setAvailableFrom(`${parts[2]}/${parts[1]}/${parts[0]}`);
                } else {
                    setAvailableFrom("");
                }
            } else {
                setAvailableFrom("");
            }
            setSelectedImages(editProperty.images || []);
            setInitialRemoteImages(editProperty.images || []);
        }
    }, [editProperty, visible]);

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.7,
        });
        if (!result.canceled && result.assets) {
            setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!address || !rent || !surface || !rooms) {
            Alert.alert("Champs manquants", "Veuillez remplir l'adresse, le loyer, la superficie et le nombre de pièces.");
            return;
        }

        setSubmitting(true);
        try {
            let isoDate: string | null = null;
            if (availableFrom && availableFrom.length === 10) {
                const parts = availableFrom.split('/');
                if (parts.length === 3) {
                    isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            const propertyData = {
                owner_id: ownerId,
                description,
                address,
                postal_code: postalCode,
                city: city || address.split(',').pop()?.trim() || "",
                monthly_rent: Number(rent),
                surface_m2: Number(surface),
                property_type: propertyType,
                status: 'available',
                rooms: Number(rooms),
                bathrooms: Number(bathrooms) || 0,
                floor_number: Number(floor) || 0,
                is_furnished: isFurnished === true,
                has_elevator: hasElevator === true,
                energy_class: energyClass || 'B',
                available_from: isoDate
            };

            let property: any;

            if (editProperty) {
                // UPDATE mode
                const { data, error } = await supabase
                    .from("properties")
                    .update(propertyData)
                    .eq("id", editProperty.id)
                    .select()
                    .single();
                if (error) throw error;
                property = data;
            } else {
                // INSERT mode
                const { data, error } = await supabase
                    .from("properties")
                    .insert(propertyData)
                    .select()
                    .single();
                if (error) throw error;
                property = data;
            }

            // Delete removed images (images that were in initial set but no longer in selectedImages)
            if (editProperty && property) {
                const removedImages = initialRemoteImages.filter(url => !selectedImages.includes(url));
                for (const removedUrl of removedImages) {
                    try {
                        // Extract storage_path from the public URL
                        const pathMatch = removedUrl.split('/property-images/')[1];
                        if (pathMatch) {
                            const storagePath = decodeURIComponent(pathMatch);
                            console.log('[Delete] Removing image:', storagePath);
                            // Delete from DB
                            await supabase.from('property_images')
                                .delete()
                                .eq('property_id', property.id)
                                .eq('storage_path', storagePath);
                            // Delete from Storage
                            await supabase.storage.from('property-images').remove([storagePath]);
                            console.log('[Delete] Removed:', storagePath);
                        }
                    } catch (delErr: any) {
                        console.error('[Delete] Error:', delErr.message);
                    }
                }
            }

            // Upload images (only new local images, not existing remote URLs)
            const newLocalImages = selectedImages.filter(uri =>
                !uri.startsWith('http://') && !uri.startsWith('https://')
            );
            console.log('[Upload] Total selectedImages:', selectedImages.length, 'New local images:', newLocalImages.length);
            if (newLocalImages.length > 0 && property) {
                let uploadSuccess = 0;
                let uploadFailed = 0;

                for (const imageUri of newLocalImages) {
                    try {
                        const ext = imageUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
                        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
                        const fileName = `properties/${property.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
                        console.log('[Upload] Processing:', imageUri);

                        // Fetch the local/blob URI to get the actual file data
                        const response = await fetch(imageUri);
                        const blob = await response.blob();
                        console.log('[Upload] Blob size:', blob.size, 'type:', blob.type);

                        // Upload via Supabase SDK — accepts Blob on all platforms
                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('property-images')
                            .upload(fileName, blob, {
                                contentType: mimeType,
                                upsert: false,
                            });

                        if (uploadError) {
                            uploadFailed++;
                            console.error('[Upload] Storage error:', JSON.stringify(uploadError));
                        } else {
                            console.log('[Upload] Storage OK:', uploadData);
                            const { error: dbError } = await supabase.from('property_images').insert({
                                property_id: property.id,
                                storage_path: fileName,
                            });
                            if (dbError) {
                                console.error('[Upload] DB error:', JSON.stringify(dbError));
                                uploadFailed++;
                            } else {
                                uploadSuccess++;
                                console.log('[Upload] Fully saved:', fileName);
                            }
                        }
                    } catch (imgErr: any) {
                        uploadFailed++;
                        console.error('[Upload] Exception:', imgErr.message);
                    }
                }
                if (uploadFailed > 0) {
                    Alert.alert("Photos", `${uploadSuccess} photo(s) envoyée(s), ${uploadFailed} échec(s).`);
                } else if (uploadSuccess > 0) {
                    console.log('[Upload] All', uploadSuccess, 'photos uploaded successfully');
                }
            }



            Alert.alert("Succès", editProperty ? "Le logement a été modifié." : "Le logement a été ajouté.");
            onSuccess();
            onClose();
            if (!editProperty) resetForm();
        } catch (error: any) {
            console.error("Error saving property:", error);
            Alert.alert("Erreur", error.message || "Une erreur est survenue lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setPostalCode("");
        setAddress("");
        setCity("");
        setStatusText("");
        setPropertyType("Maison");
        setRooms("");
        setBathrooms("");
        setSurface("");
        setRent("");
        setFloor("");
        setAvailableFrom("");
        setDescription("");
        setIsFurnished(null);
        setHasElevator(null);
        setEnergyClass("");

        setSelectedImages([]);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{editProperty ? "Modifier le logement" : "Ajouter un logement"}</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#64748b" />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        {/* Adresse */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Adresse :</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="location-outline" size={18} color="#94a3b8" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="ex : 12 rue du port"
                                    value={address}
                                    onChangeText={setAddress}
                                />
                            </View>
                        </View>

                        {/* Ville + CP */}
                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 2 }]}>
                                <Text style={styles.label}>Ville :</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="business-outline" size={18} color="#94a3b8" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ex : Lille"
                                        value={city}
                                        onChangeText={setCity}
                                    />
                                </View>
                            </View>
                            <View style={[styles.field, { flex: 1, minWidth: 0 }]}>
                                <Text style={styles.label}>CP :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="59000"
                                    value={postalCode}
                                    onChangeText={setPostalCode}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Type de logement - dropdown */}
                        <View style={[styles.field, { marginBottom: 16, zIndex: 20 }]}>
                            <Text style={styles.label}>Type de logement :</Text>
                            <Pressable
                                style={styles.selectButton}
                                onPress={() => setShowPropertyTypePicker(!showPropertyTypePicker)}
                            >
                                <Text style={styles.selectButtonText}>{propertyType}</Text>
                                <Ionicons name={showPropertyTypePicker ? "chevron-up" : "chevron-down"} size={18} color="#64748b" />
                            </Pressable>
                            {showPropertyTypePicker && (
                                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    {PROPERTY_TYPES.map((type) => (
                                        <Pressable
                                            key={type}
                                            style={[
                                                styles.dropdownItem,
                                                propertyType === type && styles.dropdownItemActive,
                                            ]}
                                            onPress={() => {
                                                setPropertyType(type);
                                                setShowPropertyTypePicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                propertyType === type && styles.dropdownItemTextActive,
                                            ]}>{type}</Text>
                                            {propertyType === type && (
                                                <Ionicons name="checkmark" size={16} color="#3153A1" />
                                            )}
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* Pièces + Salles de bain */}
                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Nombre de pièces :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="3"
                                    keyboardType="numeric"
                                    value={rooms}
                                    onChangeText={setRooms}
                                />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Salles de bain :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="1"
                                    keyboardType="numeric"
                                    value={bathrooms}
                                    onChangeText={setBathrooms}
                                />
                            </View>
                        </View>

                        {/* Superficie + Étage */}
                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Superficie (m²) :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="65"
                                    keyboardType="numeric"
                                    value={surface}
                                    onChangeText={setSurface}
                                />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Étage :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="3"
                                    keyboardType="numeric"
                                    value={floor}
                                    onChangeText={setFloor}
                                />
                            </View>
                        </View>

                        {/* Loyer + Disponible à partir du */}
                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>Loyer (€) :</Text>
                                <TextInput
                                    style={styles.inputSmall}
                                    placeholder="850"
                                    keyboardType="numeric"
                                    value={rent}
                                    onChangeText={setRent}
                                />
                            </View>
                            <View style={[styles.field, { flex: 2 }]}>
                                <Text style={styles.label} numberOfLines={1}>Disponible à partir du :</Text>
                                <View style={{ position: 'relative' }}>
                                    <TextInput
                                        style={[styles.inputSmall, { textAlign: 'center', paddingRight: 40 }]}
                                        placeholder="JJ/MM/AAAA"
                                        value={availableFrom}
                                        onChangeText={(text) => {
                                            // Format as DD/MM/YYYY
                                            let cleaned = text.replace(/\D/g, '');
                                            let formatted = cleaned;
                                            if (cleaned.length > 2) {
                                                formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                                            }
                                            if (cleaned.length > 4) {
                                                formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4, 8);
                                            }
                                            setAvailableFrom(formatted.slice(0, 10));
                                        }}
                                        keyboardType="numeric"
                                        maxLength={10}
                                    />
                                    <Pressable
                                        onPress={() => setShowDatePicker(true)}
                                        style={{
                                            position: 'absolute',
                                            right: 8,
                                            top: 8,
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            backgroundColor: '#f8fafc',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 1,
                                            borderColor: '#e2e8f0'
                                        }}
                                    >
                                        <Ionicons name="calendar-outline" size={16} color="#3153A1" />
                                    </Pressable>
                                </View>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={(() => {
                                            if (availableFrom && availableFrom.length === 10) {
                                                const parts = availableFrom.split('/');
                                                const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                                                if (!isNaN(d.getTime())) return d;
                                            }
                                            return new Date();
                                        })()}
                                        mode="date"
                                        display={Platform.OS === "ios" ? "spinner" : "calendar"}
                                        onChange={(event: any, selectedDate?: Date) => {
                                            setShowDatePicker(Platform.OS === "ios");
                                            if (selectedDate) {
                                                const y = selectedDate.getFullYear();
                                                const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                                const d = String(selectedDate.getDate()).padStart(2, '0');
                                                setAvailableFrom(`${d}/${m}/${y}`);
                                            }
                                        }}
                                    />
                                )}
                            </View>
                        </View>

                        {/* Meublé + Ascenseur */}
                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Meublé :</Text>
                                <View style={styles.toggleRowSmall}>
                                    <Pressable
                                        style={[styles.toggleButtonSmall, isFurnished === true && styles.toggleActive]}
                                        onPress={() => setIsFurnished(true)}
                                    >
                                        <Text style={[styles.toggleText, isFurnished === true && styles.toggleActiveText]}>Oui</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.toggleButtonSmall, isFurnished === false && styles.toggleActive]}
                                        onPress={() => setIsFurnished(false)}
                                    >
                                        <Text style={[styles.toggleText, isFurnished === false && styles.toggleActiveText]}>Non</Text>
                                    </Pressable>
                                </View>
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Ascenseur :</Text>
                                <View style={styles.toggleRowSmall}>
                                    <Pressable
                                        style={[styles.toggleButtonSmall, hasElevator === true && styles.toggleActive]}
                                        onPress={() => setHasElevator(true)}
                                    >
                                        <Text style={[styles.toggleText, hasElevator === true && styles.toggleActiveText]}>Oui</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.toggleButtonSmall, hasElevator === false && styles.toggleActive]}
                                        onPress={() => setHasElevator(false)}
                                    >
                                        <Text style={[styles.toggleText, hasElevator === false && styles.toggleActiveText]}>Non</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>

                        {/* Classe énergétique - select pleine largeur */}
                        <View style={[styles.field, { marginBottom: 16, zIndex: 10 }]}>
                            <Text style={styles.label}>Classe énergétique :</Text>
                            <Pressable
                                style={styles.selectButton}
                                onPress={() => setShowEnergyClassPicker(!showEnergyClassPicker)}
                            >
                                <Text style={styles.selectButtonText}>{energyClass || "Sélectionner"}</Text>
                                <Ionicons name={showEnergyClassPicker ? "chevron-up" : "chevron-down"} size={18} color="#64748b" />
                            </Pressable>
                            {showEnergyClassPicker && (
                                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                                    {ENERGY_CLASSES.map((cls) => (
                                        <Pressable
                                            key={cls}
                                            style={[
                                                styles.dropdownItem,
                                                energyClass === cls && styles.dropdownItemActive,
                                            ]}
                                            onPress={() => {
                                                setEnergyClass(cls);
                                                setShowEnergyClassPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                energyClass === cls && styles.dropdownItemTextActive,
                                            ]}>Classe {cls}</Text>
                                            {energyClass === cls && (
                                                <Ionicons name="checkmark" size={16} color="#3153A1" />
                                            )}
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* Description */}
                        <View style={[styles.field, { marginBottom: 24 }]}>
                            <Text style={styles.label}>Description du bien :</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Décrivez le bien..."
                                multiline
                                numberOfLines={4}
                                maxLength={500}
                                value={description}
                                onChangeText={setDescription}
                            />
                            <Text style={styles.charCount}>{description.length}/500 caractères</Text>
                        </View>

                        {/* Photos */}
                        <View style={[styles.field, { marginBottom: 16, marginTop: 8 }]}>
                            <Text style={styles.label}>Photos du bien :</Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                {selectedImages.map((uri, index) => (
                                    <View key={index} style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", position: "relative" }}>
                                        <Image source={{ uri }} style={{ width: 80, height: 80 }} contentFit="cover" />
                                        <Pressable
                                            onPress={() => removeImage(index)}
                                            style={{ position: "absolute", top: 2, right: 2, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" }}
                                        >
                                            <Ionicons name="close" size={12} color="#fff" />
                                        </Pressable>
                                    </View>
                                ))}
                                <Pressable
                                    onPress={pickImages}
                                    style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}
                                >
                                    <Ionicons name="camera-outline" size={24} color="#94a3b8" />
                                    <Text style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, fontFamily: "Montserrat_400Regular" }}>Ajouter</Text>
                                </Pressable>
                            </View>
                        </View>



                        <View style={styles.footer}>
                            <Button
                                onPress={handleSave}
                                disabled={submitting || !isFormValid}
                                style={[styles.saveButton, (!isFormValid && !submitting) && { opacity: 0.5 }]}
                            >
                                <View style={styles.saveButtonContent}>
                                    <Ionicons name="save-outline" size={18} color="#fff" />
                                    <Text style={styles.saveButtonText}>{submitting ? "Enregistrement..." : "Enregistrer"}</Text>
                                </View>
                            </Button>
                        </View>
                    </ScrollView>
                </View>
            </View>


        </Modal >
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "90%",
        padding: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        fontFamily: "Montserrat_700Bold",
        textAlign: "center",
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    form: {
        flex: 1,
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    field: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 8,
        fontFamily: "Montserrat_600SemiBold",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: "#fff",
        height: 44,
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: "#1e293b",
        fontFamily: "Montserrat_400Regular",
    },
    inputSmall: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: "#fff",
        height: 44,
        fontSize: 14,
        color: "#1e293b",
        textAlign: "center",
        fontFamily: "Montserrat_400Regular",
    },
    selectButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        paddingHorizontal: 14,
        backgroundColor: "#fff",
        height: 44,
    },
    selectButtonText: {
        fontSize: 14,
        color: "#1e293b",
        fontFamily: "Montserrat_400Regular",
    },
    dropdownList: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        backgroundColor: "#fff",
        marginTop: 4,
        overflow: "hidden",
        maxHeight: 280,
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    dropdownItemActive: {
        backgroundColor: "rgba(49, 83, 161, 0.05)",
    },
    dropdownItemText: {
        fontSize: 14,
        color: "#374151",
        fontFamily: "Montserrat_400Regular",
    },
    dropdownItemTextActive: {
        color: "#3153A1",
        fontWeight: "600",
    },
    toggleRowSmall: {
        flexDirection: "row",
        gap: 8,
    },
    toggleButtonSmall: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        minWidth: 50,
        alignItems: "center",
    },
    toggleActive: {
        borderColor: "#3153A1",
        backgroundColor: "rgba(49, 83, 161, 0.05)",
    },
    toggleText: {
        fontSize: 13,
        color: "#64748b",
        fontWeight: "500",
        fontFamily: "Montserrat_500Medium",
    },
    toggleActiveText: {
        color: "#3153A1",
        fontWeight: "600",
    },
    textArea: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 12,
        backgroundColor: "#fff",
        minHeight: 100,
        textAlignVertical: "top",
        fontSize: 14,
        color: "#1e293b",
        fontFamily: "Montserrat_400Regular",
    },
    charCount: {
        alignSelf: "flex-end",
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 4,
        marginBottom: 4,
    },
    separator: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginVertical: 20,
    },
    tenantSection: {
        marginBottom: 24,
    },
    tenantHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
        fontFamily: "Montserrat_700Bold",
    },
    tenantActions: {
        flexDirection: "row",
        gap: 8,
    },
    addButton: {
        backgroundColor: "#3153A1",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    deleteButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: "#64748b",
        fontSize: 14,
        fontWeight: "600",
    },
    disabledInput: {
        borderWidth: 1,
        borderColor: "#f1f5f9",
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: "#f8fafc",
        height: 44,
        justifyContent: "center",
    },
    disabledText: {
        fontSize: 13,
        color: "#94a3b8",
        fontFamily: "Montserrat_400Regular",
    },
    footer: {
        marginTop: 10,
        marginBottom: 40,
        alignItems: "center",
    },
    saveButton: {
        width: 160,
        backgroundColor: "#3153A1",
        borderRadius: 10,
        height: 48,
    },
    saveButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    pickerContent: {
        backgroundColor: "#fff",
        borderRadius: 16,
        maxHeight: "70%",
        padding: 20,
    },
    pickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
    },
    tenantList: {
        flexGrow: 0,
    },
    tenantItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    tenantAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#eef2ff",
        alignItems: "center",
        justifyContent: "center",
    },
    tenantName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
    },
    tenantRole: {
        fontSize: 12,
        color: "#64748b",
    },
    emptyText: {
        textAlign: "center",
        color: "#94a3b8",
        padding: 20,
    },
});

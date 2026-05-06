import AjouterBienModal from '@/components/biens/AjouterBienModal';
import NotificationBellButton from '@/components/ui/notification-bell-button';
import ProfileHeaderButton from '@/components/ui/profile-header-button';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

type BienDetail = {
  id: string;
  adresse: string;
  ville: string;
  prix: number;
  surface: number;
  type: string;
  chambres: number;
  cuisines?: number;
  toilettes: number;
  classeEnergie: string;
  visite?: string;
  meuble: boolean;
  description: string;
  images: string[];
  is_for_sale: boolean;
  is_under_renovation: boolean;
};

const screenWidth = Dimensions.get('window').width;

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: '#eef2ff',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon as any} size={16} color="#3153A1" />
      </View>
      <Text
        style={{
          fontSize: 14,
          color: '#1e293b',
          fontWeight: '500',
          flex: 1,
          fontFamily: 'Montserrat_500Medium',
        }}
      >
        {text}
      </Text>
    </View>
  );
}

// --- Main Detail Page ---
export default function BienDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeImage, setActiveImage] = useState(0);
  const [bien, setBien] = useState<BienDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [rawPropertyData, setRawPropertyData] = useState<any>(null);
  const [contactPhone, setContactPhone] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session?.user.id)
          .maybeSingle();
        if (profile?.role) {
          setUserRole(profile.role);
        }
      }
    };
    checkRole();
    if (id) fetchBienDetail();
  }, [id]);

  const handleDelete = async () => {
    const title = 'Confirmer la suppression';
    const message =
      'Êtes-vous sûr de vouloir supprimer ce bien ? Cette action est irréversible.';

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        await executeDelete();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => executeDelete(),
        },
      ]);
    }
  };

  const executeDelete = async () => {
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);

      if (error) throw error;
      router.back();
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Erreur : Impossible de supprimer le bien');
      } else {
        Alert.alert('Erreur', 'Impossible de supprimer le bien');
      }
    }
  };

  const handleToggleSaleStatus = async () => {
    try {
      const newStatus = !bien?.is_for_sale;
      const { error } = await supabase
        .from('properties')
        .update({ is_for_sale: newStatus })
        .eq('id', id);

      if (error) throw error;

      setBien((prev) => (prev ? { ...prev, is_for_sale: newStatus } : prev));
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Erreur : Impossible de mettre à jour le statut de vente');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le statut de vente');
      }
    }
  };

  const handleToggleRenovationStatus = async () => {
    try {
      const newStatus = !bien?.is_under_renovation;
      const { error } = await supabase
        .from('properties')
        .update({ is_under_renovation: newStatus })
        .eq('id', id);

      if (error) throw error;

      setBien((prev) =>
        prev ? { ...prev, is_under_renovation: newStatus } : prev,
      );
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Erreur : Impossible de mettre à jour le statut de vente');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le statut de vente');
      }
    }
  };

  async function fetchBienDetail() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(
          `
                    *,
                    property_images (
                        storage_path
                    ),
                    profiles:owner_id (
                        phone
                    )
                `,
        )
        .eq('id', id)
        .single();

      if (error) throw error;

      const mapped: BienDetail = {
        id: data.id,
        adresse: data.address || 'Adresse non renseignée',
        ville: data.city || 'Ville non renseignée',
        prix: Number(data.monthly_rent) || 0,
        surface: Number(data.surface_m2) || 0,
        type: data.property_type || 'Bien',
        chambres: data.rooms || 0,
        cuisines: undefined,
        toilettes: data.bathrooms || 0,
        classeEnergie: data.energy_class || '',
        visite: undefined,
        meuble: data.is_furnished || false,
        description: data.description || 'Aucune description fournie.',
        images: (data.property_images || []).map((img: any) => {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from('property-images')
            .getPublicUrl(img.storage_path);
          return publicUrl;
        }),
        is_for_sale: data.is_for_sale,
        is_under_renovation: data.is_under_renovation,
      };

      setRawPropertyData({
        id: data.id,
        address: data.address || '',
        city: data.city || '',
        postal_code: data.postal_code || '',
        property_type: data.property_type || '',
        rooms: data.rooms || 0,
        bathrooms: data.bathrooms || 0,
        surface_m2: data.surface_m2 || 0,
        monthly_rent: data.monthly_rent || 0,
        floor_number: data.floor_number || 0,
        is_furnished: data.is_furnished || false,
        has_elevator: data.has_elevator || false,
        energy_class: data.energy_class || '',
        description: data.description || '',
        available_from: data.available_from || null,
        images: (data.property_images || []).map((img: any) => {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from('property-images')
            .getPublicUrl(img.storage_path);
          return publicUrl;
        }),
      });

      setBien(mapped);

      // Set contact phone based on viewer role
      const viewerRole = userRole;
      if (viewerRole === 'owner' || viewerRole === 'agency') {
        // Owner/agency viewing: try to get tenant phone
        const { data: leaseData } = await supabase
          .from('leases')
          .select('id')
          .eq('property_id', data.id)
          .eq('status', 'active')
          .maybeSingle();

        if (leaseData) {
          const { data: tenantLink } = await supabase
            .from('lease_tenants')
            .select('tenant_id, profiles:tenant_id(phone)')
            .eq('lease_id', leaseData.id)
            .limit(1)
            .maybeSingle();

          const tenantProfile = tenantLink?.profiles as any;
          if (tenantProfile?.phone) {
            setContactPhone(tenantProfile.phone);
          }
        }
      } else {
        // Tenant viewing: get owner phone
        const ownerProfile = data.profiles as any;
        if (ownerProfile?.phone) {
          setContactPhone(ownerProfile.phone);
        }
      }
    } catch (error: any) {
      console.error('[BienDetail] Fetch error:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du bien.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <ActivityIndicator size="large" color="#3153A1" />
        <Text
          style={{
            marginTop: 12,
            color: '#6b7280',
            fontFamily: 'Montserrat_500Medium',
          }}
        >
          Chargement du bien...
        </Text>
      </View>
    );
  }

  if (!bien) return null;

  const images = bien.images.length > 0 ? bien.images : [null];

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#1e3a6d', '#3153A1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: 56,
            paddingBottom: 20,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <Image
                source={require('@/assets/images/logo-white.svg')}
                style={{ width: 90, height: 24 }}
                contentFit="contain"
              />
              <Text
                style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: '700',
                  marginTop: 4,
                  fontFamily: 'Montserrat_700Bold',
                }}
              >
                {userRole === 'owner' || userRole === 'agency'
                  ? 'Mes Biens'
                  : 'Recherche de biens'}
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  marginTop: 2,
                  fontFamily: 'Montserrat_400Regular',
                }}
              >
                {userRole === 'owner' || userRole === 'agency'
                  ? 'Gérez vos logements et baux'
                  : 'Recherchez votre futur chez vous'}
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <NotificationBellButton />
              <ProfileHeaderButton />
            </View>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#eef2ff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Ionicons name="arrow-back" size={16} color="#3153A1" />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#1e293b',
                flex: 1,
                fontFamily: 'Montserrat_700Bold',
              }}
              numberOfLines={1}
            >
              {bien.adresse}
            </Text>
          </Pressable>

          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: '100%',
                height: 220,
                backgroundColor: '#c7cdd6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {images[activeImage] ? (
                <Image
                  source={{ uri: images[activeImage] }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <>
                  <Ionicons name="image-outline" size={48} color="#9ca3af" />
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#9ca3af',
                      marginTop: 8,
                      fontFamily: 'Montserrat_400Regular',
                    }}
                  >
                    Aucune photo disponible
                  </Text>
                </>
              )}
            </View>

            {images.length > 1 && (
              <View style={{ flexDirection: 'row', gap: 2, padding: 2 }}>
                {images.map((img, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setActiveImage(i)}
                    style={{
                      flex: 1,
                      height: 80,
                      backgroundColor:
                        activeImage === i ? '#a8b5c9' : '#d1d8e0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: activeImage === i ? 2 : 0,
                      borderColor: '#3153A1',
                      borderRadius: 4,
                    }}
                  >
                    {img ? (
                      <Image
                        source={{ uri: img }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <Ionicons
                        name="image-outline"
                        size={20}
                        color="#9ca3af"
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#1e293b',
                fontFamily: 'Montserrat_700Bold',
              }}
            >
              {bien.adresse}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#6b7280',
                marginTop: 2,
                marginBottom: 12,
                fontFamily: 'Montserrat_400Regular',
              }}
            >
              {bien.ville}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 16,
              }}
            >
              {[
                {
                  icon: 'bed-outline',
                  label: `${bien.chambres} Chambre${bien.chambres > 1 ? 's' : ''}`,
                  show: true,
                },
                {
                  icon: 'restaurant-outline',
                  label: `${bien.cuisines} Cuisine`,
                  show: bien.cuisines !== undefined,
                },
                {
                  icon: 'resize-outline',
                  label: `${bien.surface} m²`,
                  show: true,
                },
                {
                  icon: 'water-outline',
                  label: `${bien.toilettes} Toilette${bien.toilettes > 1 ? 's' : ''}`,
                  show: true,
                },
              ]
                .filter((b) => b.show)
                .map((badge) => (
                  <View
                    key={badge.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f9fafb',
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                    }}
                  >
                    <Ionicons
                      name={badge.icon as any}
                      size={14}
                      color="#6b7280"
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#374151',
                        marginLeft: 4,
                        fontWeight: '500',
                        fontFamily: 'Montserrat_500Medium',
                      }}
                    >
                      {badge.label}
                    </Text>
                  </View>
                ))}
            </View>

            {bien.classeEnergie ? (
              <InfoRow
                icon="speedometer-outline"
                text={`Classe ${bien.classeEnergie}`}
              />
            ) : null}
            {bien.visite ? (
              <InfoRow icon="calendar-outline" text={bien.visite} />
            ) : null}
            <InfoRow
              icon="home-outline"
              text={bien.meuble ? 'Meublé' : 'Non meublé'}
            />
          </View>

          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: '#3153A1',
                  fontFamily: 'Montserrat_700Bold',
                }}
              >
                {bien.prix}€
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: '#9ca3af',
                  marginLeft: 4,
                  fontFamily: 'Montserrat_400Regular',
                }}
              >
                / mois
              </Text>
            </View>

            {userRole !== 'owner' && userRole !== 'agency' && (
              <Pressable
                onPress={() => {
                  if (contactPhone) {
                    Linking.openURL(`tel:${contactPhone}`);
                  } else {
                    Alert.alert(
                      'Information',
                      'Aucun numéro de téléphone renseigné.',
                    );
                  }
                }}
                style={{
                  backgroundColor: '#3153A1',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  marginBottom: 10,
                }}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: '600',
                    fontFamily: 'Montserrat_600SemiBold',
                  }}
                >
                  Contacter
                </Text>
              </Pressable>
            )}

            {(userRole === 'owner' || userRole === 'agency') && (
              <>
                <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                  <Pressable
                    onPress={handleToggleSaleStatus}
                    style={{
                      backgroundColor: '#ffdcbe',
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 32,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: '#c05a01',
                    }}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={18}
                      color="#c05a01"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: '#c05a01',
                        fontSize: 15,
                        fontWeight: '600',
                        fontFamily: 'Montserrat_600SemiBold',
                      }}
                    >
                      {bien.is_for_sale
                        ? 'Supprimer de la vente'
                        : 'Marquer en vente'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleToggleRenovationStatus}
                    style={{
                      backgroundColor: '#fae6b1',
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 32,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: '#ac7e01',
                    }}
                  >
                    <Ionicons
                      name="code-working"
                      size={18}
                      color="#ac7e01"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: '#ac7e01',
                        fontSize: 15,
                        fontWeight: '600',
                        fontFamily: 'Montserrat_600SemiBold',
                      }}
                    >
                      {bien.is_under_renovation
                        ? 'Rénovation terminée'
                        : 'Marquer en rénovation'}
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => setIsEditModalVisible(true)}
                  style={{
                    backgroundColor: '#f0f4ff',
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 32,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#3153A1',
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color="#3153A1"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: '#3153A1',
                      fontSize: 15,
                      fontWeight: '600',
                      fontFamily: 'Montserrat_600SemiBold',
                    }}
                  >
                    Modifier le logement
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDelete}
                  style={{
                    backgroundColor: '#fad6d2',
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 32,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#a13131',
                  }}
                >
                  <Ionicons
                    name="trash-bin"
                    size={18}
                    color="#a13131"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: '#a13131',
                      fontSize: 15,
                      fontWeight: '600',
                      fontFamily: 'Montserrat_600SemiBold',
                    }}
                  >
                    Supprimer le logement
                  </Text>
                </Pressable>
              </>
            )}

            <Text
              style={{
                fontSize: 12,
                color: '#9ca3af',
                textAlign: 'center',
                fontFamily: 'Montserrat_400Regular',
              }}
            >
              {bien.type ? `${bien.type} · ` : ''}
              {bien.surface} m² · {bien.ville}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#eef2ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color="#3153A1"
                />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#1e293b',
                  fontFamily: 'Montserrat_700Bold',
                }}
              >
                Description
              </Text>
            </View>
            <Text
              style={{
                fontSize: 14,
                color: '#374151',
                lineHeight: 22,
                fontFamily: 'Montserrat_400Regular',
              }}
            >
              {bien.description}
            </Text>
          </View>
        </View>
      </ScrollView>

      {userId && (
        <AjouterBienModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onSuccess={() => {
            setIsEditModalVisible(false);
            fetchBienDetail();
          }}
          ownerId={userId}
          editProperty={rawPropertyData}
        />
      )}
    </View>
  );
}

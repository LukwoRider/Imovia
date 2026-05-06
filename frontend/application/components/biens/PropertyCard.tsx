import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import type { Property } from './types';

const CARD_IMAGE_HEIGHT = 160;

type PropertyCardProps = {
  item: Property;
  onPress: () => void;
  isOwnerView?: boolean;
};

export default function PropertyCard({
  item,
  onPress,
  isOwnerView,
}: PropertyCardProps) {
  const images =
    item.images && item.images.length > 0
      ? item.images
      : item.thumbnail
        ? [item.thumbnail]
        : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const cardWidth = Dimensions.get('window').width - 32;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / cardWidth);
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      <View
        style={{
          width: '100%',
          height: CARD_IMAGE_HEIGHT,
          backgroundColor: '#c7cdd6',
        }}
      >
        {images.length > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={{ width: cardWidth, height: CARD_IMAGE_HEIGHT }}
          >
            {images.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{ width: cardWidth, height: CARD_IMAGE_HEIGHT }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="image-outline" size={40} color="#9ca3af" />
            <Text
              style={{
                fontSize: 11,
                color: '#9ca3af',
                marginTop: 4,
                fontFamily: 'Montserrat_400Regular',
              }}
            >
              Aucune photo
            </Text>
          </View>
        )}

        {images.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            {images.map((_, i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    i === activeIndex ? '#3153A1' : 'rgba(255,255,255,0.6)',
                }}
              />
            ))}
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: 2,
            fontFamily: 'Montserrat_600SemiBold',
          }}
          numberOfLines={1}
        >
          {item.adresse}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: '#9ca3af',
            marginBottom: 6,
            fontFamily: 'Montserrat_400Regular',
          }}
        >
          {item.ville}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#3153A1',
                fontFamily: 'Montserrat_700Bold',
              }}
            >
              {item.prix}€
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: '#9ca3af',
                fontFamily: 'Montserrat_400Regular',
              }}
            >
              {' '}
              /mois
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="resize-outline" size={12} color="#9ca3af" />
              <Text style={{ fontSize: 11, color: '#6b7280', marginLeft: 3 }}>
                {item.surface}m²
              </Text>
            </View>
            {item.type ? (
              <View
                style={{
                  backgroundColor: '#eef2ff',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: '#3153A1',
                    fontWeight: '600',
                    fontFamily: 'Montserrat_600SemiBold',
                  }}
                >
                  {item.type}
                </Text>
              </View>
            ) : null}
            {isOwnerView && (
              <>
                {item.is_for_sale && (
                  <View
                    style={{
                      backgroundColor: '#ffdcbe',
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#c05a01',
                        fontWeight: '600',
                        fontFamily: 'Montserrat_600SemiBold',
                      }}
                    >
                      {item.is_for_sale && 'En vente'}
                    </Text>
                  </View>
                )}
                {item.is_under_renovation && (
                  <View
                    style={{
                      backgroundColor: '#fae6b1',
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: '#ac7e01',
                        fontWeight: '600',
                        fontFamily: 'Montserrat_600SemiBold',
                      }}
                    >
                      {item.is_under_renovation && 'En rénovation'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

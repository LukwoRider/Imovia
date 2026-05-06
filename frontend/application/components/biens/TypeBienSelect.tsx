import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PROPERTY_TYPES, TYPE_PROPERTY_TYPES } from './AjouterBienModal';

const TypeBienSelect = ({
  propertyType,
  onChange,
}: {
  propertyType: TYPE_PROPERTY_TYPES | null;
  onChange: (propertyType: TYPE_PROPERTY_TYPES | null) => void;
}) => {
  const [showPropertyTypePicker, setShowPropertyTypePicker] = useState(false);

  return (
    <View style={[styles.field, { marginBottom: 16, zIndex: 20 }]}>
      <Text style={styles.label}>Type de logement :</Text>
      <Pressable
        style={styles.selectButton}
        onPress={() => setShowPropertyTypePicker(!showPropertyTypePicker)}
      >
        <Text style={styles.selectButtonText}>{propertyType}</Text>
        <View style={styles.actionContainer}>
          {propertyType !== null && (
            <Pressable
              onPress={() => {
                onChange(null);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </Pressable>
          )}
          <Ionicons
            name={showPropertyTypePicker ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#64748b"
          />
        </View>
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
                onChange(type);
                setShowPropertyTypePicker(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  propertyType === type && styles.dropdownItemTextActive,
                ]}
              >
                {type}
              </Text>
              {propertyType === type && (
                <Ionicons name="checkmark" size={16} color="#3153A1" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    fontFamily: 'Montserrat_600SemiBold',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    height: 44,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#1e293b',
    fontFamily: 'Montserrat_400Regular',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    overflow: 'hidden',
    maxHeight: 280,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(49, 83, 161, 0.05)',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Montserrat_400Regular',
  },
  dropdownItemTextActive: {
    color: '#3153A1',
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default TypeBienSelect;

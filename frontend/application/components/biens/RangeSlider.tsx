import React, { useEffect } from 'react';
import { View, Text, LayoutChangeEvent, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';

type RangeSliderProps = {
  label: string;
  minValue: number;
  maxValue: number;
  startValue: number;
  endValue: number;
  onRangeChange: (start: number, end: number) => void;
  formatRange: (start: number, end: number) => string;
};

const THUMB_RADIUS = 10;

export default function RangeSlider({
  label,
  minValue,
  maxValue,
  startValue,
  endValue,
  onRangeChange,
  formatRange,
}: RangeSliderProps) {
  const trackWidth = useSharedValue(0);

  const getRatio = (v: number) => (v - minValue) / (maxValue - minValue);

  const startRatio = useSharedValue(getRatio(startValue));
  const endRatio = useSharedValue(getRatio(endValue));

  useEffect(() => {
    startRatio.value = getRatio(startValue);
    endRatio.value = getRatio(endValue);
  }, [startValue, endValue, minValue, maxValue]);

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.value = e.nativeEvent.layout.width;
  };

  const handleRangeChange = (sRatio: number, eRatio: number) => {
    const newStart = Math.round(minValue + sRatio * (maxValue - minValue));
    const newEnd = Math.round(minValue + eRatio * (maxValue - minValue));
    onRangeChange(newStart, newEnd);
  };

  const startCtx = useSharedValue(0);
  const panStart = Gesture.Pan()
    .hitSlop(20)
    .onBegin(() => {
      startCtx.value = startRatio.value * trackWidth.value;
    })
    .onUpdate((e) => {
      if (trackWidth.value === 0) return;
      const newX = startCtx.value + e.translationX;
      const ratio = Math.max(
        0,
        Math.min(newX / trackWidth.value, endRatio.value),
      );
      startRatio.value = ratio;
      scheduleOnRN(handleRangeChange, ratio, endRatio.value);
    });

  const endCtx = useSharedValue(0);
  const panEnd = Gesture.Pan()
    .hitSlop(20)
    .onBegin(() => {
      endCtx.value = endRatio.value * trackWidth.value;
    })
    .onUpdate((e) => {
      if (trackWidth.value === 0) return;
      const newX = endCtx.value + e.translationX;
      const ratio = Math.max(
        startRatio.value,
        Math.min(newX / trackWidth.value, 1),
      );
      endRatio.value = ratio;
      scheduleOnRN(handleRangeChange, startRatio.value, ratio);
    });

  const activeTrackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: startRatio.value * trackWidth.value }],
      width: Math.max(
        0,
        (endRatio.value - startRatio.value) * trackWidth.value,
      ),
    };
  });

  const thumbStartStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: startRatio.value * trackWidth.value - THUMB_RADIUS },
      ],
    };
  });

  const thumbEndStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: endRatio.value * trackWidth.value - THUMB_RADIUS },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {formatRange(startValue, endValue)}
          </Text>
        </View>
      </View>

      <View style={styles.trackContainer} onLayout={handleTrackLayout}>
        <View style={styles.backgroundTrack}>
          <Animated.View style={[styles.activeTrack, activeTrackStyle]} />
        </View>

        <GestureDetector gesture={panStart}>
          <Animated.View style={[styles.thumb, thumbStartStyle]} />
        </GestureDetector>

        <GestureDetector gesture={panEnd}>
          <Animated.View style={[styles.thumb, thumbEndStyle]} />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: 'Montserrat_700Bold',
  },
  badge: {
    backgroundColor: '#f0f2f5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    fontFamily: 'Montserrat_500Medium',
  },
  trackContainer: {
    height: 32,
    justifyContent: 'center',
  },
  backgroundTrack: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  activeTrack: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#3153A1',
    borderRadius: 2,
    left: 0,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_RADIUS * 2,
    height: THUMB_RADIUS * 2,
    borderRadius: THUMB_RADIUS,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#3153A1',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 10,
  },
});

import { Text } from "@/components/ui/text";
import { useRef } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  View,
} from "react-native";

type RangeSliderProps = {
  label: string;
  minValue: number;
  maxValue: number;
  startValue: number;
  endValue: number;
  onRangeChange: (start: number, end: number) => void;
  formatRange: (start: number, end: number) => string;
};

export default function RangeSlider({
  label,
  minValue,
  maxValue,
  startValue,
  endValue,
  onRangeChange,
  formatRange,
}: RangeSliderProps) {
  const trackWidth = useRef(0);
  const activeThumb = useRef<"start" | "end" | null>(null);

  const getPercent = (v: number) => ((v - minValue) / (maxValue - minValue)) * 100;
  const startPercent = getPercent(startValue);
  const endPercent = getPercent(endValue);

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  };

  const updateRangeFromTouch = (e: GestureResponderEvent) => {
    if (trackWidth.current === 0) return;

    const touchX = Math.max(0, Math.min(trackWidth.current, e.nativeEvent.locationX));
    const ratio = Math.max(0, Math.min(1, touchX / trackWidth.current));
    const nextValue = Math.round(minValue + ratio * (maxValue - minValue));

    if (!activeThumb.current) {
      const startX = (startPercent / 100) * trackWidth.current;
      const endX = (endPercent / 100) * trackWidth.current;
      activeThumb.current =
        Math.abs(touchX - startX) <= Math.abs(touchX - endX) ? "start" : "end";
    }

    if (activeThumb.current === "start") {
      onRangeChange(Math.min(nextValue, endValue), endValue);
      return;
    }

    onRangeChange(startValue, Math.max(nextValue, startValue));
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: "#1e293b",
            fontFamily: "Montserrat_700Bold",
          }}
        >
          {label}
        </Text>
        <View
          style={{
            backgroundColor: "#f0f2f5",
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: "#6b7280",
              fontWeight: "500",
              fontFamily: "Montserrat_500Medium",
            }}
          >
            {formatRange(startValue, endValue)}
          </Text>
        </View>
      </View>
      <View
        onLayout={handleTrackLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={updateRangeFromTouch}
        onResponderMove={updateRangeFromTouch}
        onResponderRelease={() => {
          activeThumb.current = null;
        }}
        style={{
          height: 32,
          justifyContent: "center",
        }}
      >
        <View style={{ height: 4, backgroundColor: "#e5e7eb", borderRadius: 2 }}>
          <View
            style={{
              position: "absolute",
              height: 4,
              backgroundColor: "#3153A1",
              borderRadius: 2,
              left: `${startPercent}%`,
              width: `${Math.max(0, endPercent - startPercent)}%`,
            }}
          />
        </View>
        <View
          style={{
            position: "absolute",
            left: `${startPercent}%`,
            marginLeft: -10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#fff",
            borderWidth: 3,
            borderColor: "#3153A1",
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: `${endPercent}%`,
            marginLeft: -10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "#fff",
            borderWidth: 3,
            borderColor: "#3153A1",
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        />
      </View>
    </View>
  );
}

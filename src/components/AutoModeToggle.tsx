import React, { FC } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AutoModeToggleProps {
  isAuto: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// AutoModeToggle
// ---------------------------------------------------------------------------

const AutoModeToggle: FC<AutoModeToggleProps> = ({ isAuto, onToggle, disabled = false }) => {
  return (
    <View style={styles.row} accessibilityLabel="Toggle auto mode">
      <Text style={[styles.label, !isAuto && styles.labelActive]}>Manual</Text>
      <Switch
        value={isAuto}
        onValueChange={onToggle}
        disabled={disabled}
        accessibilityLabel={isAuto ? "Switch to manual mode" : "Switch to auto mode"}
        trackColor={{ false: "#D1D5DB", true: "#2563EB" }}
        thumbColor="#FFFFFF"
      />
      <Text style={[styles.label, isAuto && styles.labelActive]}>Auto</Text>
    </View>
  );
};

export default AutoModeToggle;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  labelActive: {
    color: "#2563EB",
    fontWeight: "700",
  },
});

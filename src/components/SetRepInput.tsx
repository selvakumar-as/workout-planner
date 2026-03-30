import React, { FC, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SetRepInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SetRepInput: FC<SetRepInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  allowDecimal = false,
  placeholder,
}) => {
  const [rawText, setRawText] = useState<string>(
    value !== undefined ? String(value) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const schema = allowDecimal
    ? z.number().min(min).max(max)
    : z.number().int().min(min).max(max);

  const handleChange = (text: string) => {
    setRawText(text);

    if (text === "" || text === "-") {
      setError(null);
      onChange(undefined);
      return;
    }

    const parsed = allowDecimal ? parseFloat(text) : parseInt(text, 10);

    if (isNaN(parsed)) {
      setError("Must be a valid number");
      return;
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      const msg = allowDecimal
        ? `Must be between ${min} and ${max}`
        : `Must be a whole number between ${min} and ${max}`;
      setError(msg);
      // Still call onChange with undefined so parent knows value is invalid
      onChange(undefined);
    } else {
      setError(null);
      onChange(result.data);
    }
  };

  const hasError = error !== null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, hasError && styles.inputError]}
        value={rawText}
        onChangeText={handleChange}
        keyboardType="numeric"
        placeholder={placeholder ?? String(min)}
        placeholderTextColor="#9CA3AF"
        accessibilityLabel={label}
      />
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default SetRepInput;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 3,
  },
});

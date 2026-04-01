import React, { FC } from "react";
import SetRepInput from "./SetRepInput";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RestTimerInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RestTimerInput: FC<RestTimerInputProps> = ({ value, onChange }) => {
  return (
    <SetRepInput
      label="Rest (seconds)"
      value={value}
      onChange={onChange}
      min={0}
      max={600}
      placeholder="e.g. 60"
    />
  );
};

export default RestTimerInput;

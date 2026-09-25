import React from "react";
import Svg, { Path, Circle } from "react-native-svg";

export interface MotorcycleIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function MotorcycleIcon({
  size = 20,
  color = "#71717A",
  strokeWidth = 1.8,
}: MotorcycleIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Rear Wheel */}
      <Circle cx="5.5" cy="16.5" r="3.5" />
      {/* Front Wheel */}
      <Circle cx="18.5" cy="16.5" r="3.5" />
      {/* Handlebars */}
      <Path d="M15 4.5l2 3h2" />
      {/* Headlight */}
      <Path d="M19.5 7.5h1" />
      {/* Main Chassis / Tank Frame */}
      <Path d="M5.5 16.5L9 9.5h4.5l3.5 7" />
      <Path d="M9 9.5l2.5 7" />
      {/* Seat and Tank */}
      <Path d="M10 6.5h3.5" />
      <Path d="M7 11h3.5" />
    </Svg>
  );
}

export default MotorcycleIcon;

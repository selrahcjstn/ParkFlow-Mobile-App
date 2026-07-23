import React from "react";
import { Text, View } from "react-native";

type StepIndicatorProps = {
  currentStep: number;
  steps: { label: string; description: string }[];
};

function StepDash({
  isActive,
  isCompleted,
}: {
  isActive: boolean;
  isCompleted: boolean;
}) {
  return (
    <View
      className={`w-full h-[4px] rounded-full ${
        isCompleted || isActive
          ? "bg-light-primary dark:bg-dark-primary"
          : "bg-light-border dark:bg-dark-border"
      }`}
    />
  );
}

export default function StepIndicator({
  currentStep,
  steps,
}: StepIndicatorProps) {
  return (
    <View className="px-6 pt-3 pb-2">
      {/* Dashes and labels column layout */}
      <View className="flex-row justify-between items-end px-1 gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <View key={index} className="flex-1 items-center">
              {/* Step dash bar */}
              <StepDash
                isActive={isActive}
                isCompleted={isCompleted}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

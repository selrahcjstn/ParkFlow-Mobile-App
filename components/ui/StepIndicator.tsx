import { Check } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

type StepIndicatorProps = {
  currentStep: number;
  steps: { label: string; description: string }[];
};

export default function StepIndicator({
  currentStep,
  steps,
}: StepIndicatorProps) {
  return (
    <View className="px-6 pt-2 pb-4">
      {/* Container for continuous background line + step circles */}
      <View className="relative mb-5 px-8 justify-center">
        {/* Continuous background line running behind the circles */}
        <View className="absolute left-[42px] right-[42px] top-[18px] h-[2.5px] bg-light-border">
          {/* Active progress line running inside the background line */}
          {currentStep > 1 && (
            <View
              className="h-full bg-light-primary"
              style={{
                width: currentStep === 2 ? "50%" : "100%",
              }}
            />
          )}
        </View>

        {/* Flex row of circles overlapping the line */}
        <View className="flex-row justify-between items-center">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;

            return (
              <View key={index} className="items-center z-10">
                {/* Step Circle with solid bg overlapping the line */}
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center border-2 ${
                    isCompleted
                      ? "bg-light-success border-light-success"
                      : isActive
                        ? "bg-light-primary border-light-primary"
                        : "bg-light-surface border-light-border"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      className={`text-[13px] font-heavy ${
                        isActive ? "text-white" : "text-light-muted"
                      }`}
                    >
                      {stepNumber}
                    </Text>
                  )}
                </View>

                {/* Step label below circle */}
                <Text
                  className={`text-[12px] mt-2 text-left ${
                    isActive
                      ? "text-light-text font-heavy"
                      : isCompleted
                        ? "text-light-success font-heavy"
                        : "text-light-muted font-regular"
                  }`}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Active step description */}
      <View className="items-center px-4">
        <Text className="text-light-secondary text-center text-[13px] leading-[18px] font-light">
          {steps[currentStep - 1]?.description}
        </Text>
      </View>
    </View>
  );
}


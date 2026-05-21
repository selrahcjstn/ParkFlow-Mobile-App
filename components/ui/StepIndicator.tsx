import { Body, Caption } from "@/components/ui/Typography";
import { Check } from "lucide-react-native";
import React from "react";
import { View } from "react-native";

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
      {/* Step circles + connecting lines */}
      <View className="flex-row items-center justify-center mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <React.Fragment key={index}>
              {/* Connecting line before (not for first step) */}
              {index > 0 && (
                <View
                  className={`flex-1 h-[2px] mx-1 ${
                    stepNumber <= currentStep
                      ? "bg-light-primary"
                      : "bg-light-border"
                  }`}
                />
              )}

              {/* Step circle */}
              <View className="items-center">
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center ${
                    isCompleted
                      ? "bg-light-success"
                      : isActive
                        ? "bg-light-primary"
                        : "bg-light-border"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Body
                      className={`text-[14px] font-heavy ${
                        isActive ? "text-white" : "text-light-muted"
                      }`}
                    >
                      {stepNumber}
                    </Body>
                  )}
                </View>

                {/* Step label below circle */}
                <Caption
                  className={`text-[11px] mt-1.5 ${
                    isActive
                      ? "text-light-text font-heavy"
                      : isCompleted
                        ? "text-light-success font-heavy"
                        : "text-light-muted font-book"
                  }`}
                >
                  {step.label}
                </Caption>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Active step description */}
      <View className="items-center px-4">
        <Caption className="text-light-muted text-center text-[12px] leading-[16px]">
          {steps[currentStep - 1]?.description}
        </Caption>
      </View>
    </View>
  );
}

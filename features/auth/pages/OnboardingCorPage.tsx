import { AlertModal } from "@/components/shared";
import { AppButton, AppInput } from "@/components/ui";
import AuthLayout from "@/features/auth/components/AuthLayout";
import { onboardingService } from "@/features/auth/services/onboarding.service";
import { useOnboardingStore } from "@/features/auth/store/onboarding.store";
import { useApiMutation } from "@/hooks";
import { formatFileSize } from "@/utils/formatFileSize";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    UploadCloud,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function OnboardingCorPage() {
  const router = useRouter();
  const { run: updateCor, isLoading: submitting } = useApiMutation(
    onboardingService.updateCor,
  );

  const { corSubmission, setCorField, reset } = useOnboardingStore();

  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalVariant, setModalVariant] = useState<
    "error" | "warning" | "info"
  >("info");
  const [modalIcon, setModalIcon] = useState<React.ReactNode>(null);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      variant: "error" | "warning" | "info" = "info",
      icon?: React.ReactNode,
    ) => {
      setModalTitle(title);
      setModalMessage(message);
      setModalVariant(variant);
      setModalIcon(icon ?? <AlertCircle size={28} color="#F59E0B" />);
      setModalVisible(true);
    },
    [],
  );

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      if (asset.size && asset.size > MAX_FILE_BYTES) {
        showAlert(
          "File Too Large",
          "Please upload a file under 10 MB.",
          "warning",
        );
        return;
      }

      setSelectedFile(asset);
      setCorField("corDocumentUrl", asset.uri ?? "");
    } catch {
      showAlert(
        "Upload Failed",
        "Something went wrong. Please try again.",
        "error",
      );
    }
  };

  const handleSubmit = async () => {
    const academicTerm = corSubmission.academicTerm.trim();
    const corDocumentUrl = corSubmission.corDocumentUrl.trim();

    if (!academicTerm || !corDocumentUrl) {
      showAlert(
        "Missing Information",
        "Please upload your document.",
        "warning",
      );
      return;
    }

    try {
      const response = await updateCor({
        academicTerm,
        corDocumentUrl,
      });

      if (!response?.isSuccess) {
        showAlert(
          "Submission Failed",
          response?.message || "Please try again.",
          "error",
        );
        return;
      }

      reset();
      router.replace("/(auth)/pending");
    } catch (error) {
      showAlert("Submission Failed", "Please try again.", "error");
    }
  };

  return (
    <AuthLayout
      background="bg-light-surface"
      header={
        <View className="flex-row items-center justify-between px-4 py-2 bg-light-surface">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-light-background"
          >
            <ChevronLeft size={24} color="#D22730" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text
            numberOfLines={1}
            className="text-light-text text-[17px] font-black text-center flex-1"
          >
            Upload COR
          </Text>

          <View className="w-10" />
        </View>
      }
    >
      <View className="flex-1 bg-light-surface px-6 pt-6 pb-12">
        <Text className="text-light-muted font-regular text-[13px] mb-6">
          Upload your COR or employee ID for verification.
        </Text>

        <AppInput
          label="Academic Term"
          placeholder="e.g. 2026-2027"
          value={corSubmission.academicTerm}
          onChangeText={(v) => setCorField("academicTerm", v)}
        />

        <View className="border-t border-light-border my-6" />

        <TouchableOpacity
          className="flex-row items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-light-border active:bg-light-background"
          onPress={handlePickFile}
          activeOpacity={0.85}
        >
          {selectedFile ? (
            <CheckCircle2 size={18} color="#10B981" strokeWidth={2.5} />
          ) : (
            <UploadCloud size={18} color="#FDB813" strokeWidth={2.5} />
          )}
          <Text className="text-light-accent font-heavy text-base leading-6">
            Upload COR or Employee ID
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View className="items-center mt-2.5">
            <Text
              className="font-light text-[12px] text-light-muted"
              numberOfLines={1}
            >
              {selectedFile.name} · {formatFileSize(selectedFile.size)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedFile(null);
                setCorField("corDocumentUrl", "");
              }}
              className="mt-2 px-3 py-1 rounded-full border border-light-border active:bg-light-background"
              activeOpacity={0.8}
            >
              <Text className="font-heavy text-light-danger text-[12px] leading-4">
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text className="font-light mt-3.5 text-center text-[12px] leading-5 px-2 text-light-muted">
          Employees may upload a valid employee ID instead of COR.
        </Text>

        <View className="mt-8">
          <AppButton
            label="Submit"
            size="lg"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </View>

      <AlertModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalTitle}
        message={modalMessage}
        variant={modalVariant}
        icon={modalIcon}
      />
    </AuthLayout>
  );
}

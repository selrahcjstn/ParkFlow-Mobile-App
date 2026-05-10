import { useState, useCallback } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AppButton, AppInput, AppSelect, ScheduleRow } from "../../components/ui";
import { Upload, FileCheck, FileText } from "lucide-react-native";
import type { SelectOption } from "../../components/ui/AppSelect";

const ROLE_OPTIONS: SelectOption[] = [
  { label: "Student", value: "student" },
  { label: "University Staff", value: "staff" },
  { label: "Non-Academic Personnel", value: "nonacademic" },
];

type Role = "student" | "staff" | "nonacademic" | "";

const DAYS = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

type Schedule = Record<string, { start: string; end: string } | undefined>;

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<Role>("");
  const [schedule, setSchedule] = useState<Schedule>({});
  const [corFile, setCorFile] = useState<string | null>(null);

  const handleScheduleChange = useCallback((
    day: string,
    slot: { start: string; end: string } | undefined
  ) => {
    setSchedule((prev) => ({ ...prev, [day]: slot }));
  }, []);

  const handleUploadCOR = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setCorFile(result.assets[0].name);
      }
    } catch {
      // User cancelled or something went wrong
    }
  };

  return (
    <AuthLayout>
      <CompactHeader />

      {/* Step 1 — credentials and role */}
      {step === 1 && (
        <FormCard
          title="Sign Up"
          back={{
            label: "Back to Sign In",
            onPress: () => router.back(),
          }}
        >
          <AppInput label="MS Email" placeholder="Enter Email" />

          <AppInput
            label="Password"
            placeholder="Enter Password"
            isPassword
          />

          <AppInput
            label="Confirm Password"
            placeholder="Confirm Password"
            isPassword
          />

          <AppSelect
            label="Role"
            placeholder="Pick an Option"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(v) => setRole(v as Role)}
          />

          {role === "student" && (
            <AppInput
              label="Course, Year & Section"
              placeholder="Course / Year / Section"
            />
          )}

          {(role === "staff" || role === "nonacademic") && (
            <AppInput
              label="Office / Department"
              placeholder="Office / Department Name"
            />
          )}

          <AppButton
            label="Next"
            variant="primary"
            size="lg"
            onPress={() => setStep(2)}
          />
        </FormCard>
      )}

      {/* Step 2 — vehicle and contact info */}
      {step === 2 && (
        <FormCard
          title="Sign Up"
          back={{
            label: "Back",
            onPress: () => setStep(1),
          }}
        >
          <AppInput label="Mobile Number" placeholder="Enter Mobile Number" />

          <AppInput
            label="Vehicle Plate Number"
            placeholder="Enter Vehicle Plate Number"
          />

          <AppInput label="ID" placeholder="Enter ID" />

          <AppInput label="Motor Brand" placeholder="e.g. Honda" />

          <AppButton
            label="Next"
            variant="primary"
            size="lg"
            onPress={() => setStep(3)}
          />
        </FormCard>
      )}

      {/* Step 3 — weekly schedule and COR upload */}
      {step === 3 && (
        <FormCard
          title="Schedule Information"
          back={{
            label: "Back",
            onPress: () => setStep(2),
          }}
        >
          {DAYS.map((day) => (
            <ScheduleRow
              key={day}
              day={day}
              value={schedule[day]}
              onChange={handleScheduleChange}
            />
          ))}

          {/* Upload COR — styled as a proper file upload card */}
          <TouchableOpacity
            className={`mt-4 mb-4 rounded-xl border-2 border-dashed py-5 px-4 items-center ${
              corFile
                ? "border-emerald-400 bg-emerald-50"
                : "border-light-border bg-white"
            }`}
            onPress={handleUploadCOR}
            activeOpacity={0.7}
          >
            {corFile ? (
              <View className="items-center gap-2">
                <FileCheck size={28} color="#10B981" strokeWidth={1.8} />
                <Text className="text-light-success text-sm font-bold">
                  COR Uploaded
                </Text>
                <View className="flex-row items-center gap-1 bg-emerald-100 rounded-lg px-3 py-1.5">
                  <FileText size={14} color="#10B981" strokeWidth={2} />
                  <Text className="text-emerald-700 text-xs font-medium" numberOfLines={1}>
                    {corFile}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="items-center gap-2">
                <Upload size={28} color="#1E3A5F" strokeWidth={1.8} />
                <Text className="text-light-accent text-sm font-bold">
                  Upload COR
                </Text>
                <Text className="text-light-muted text-xs">
                  PDF or image files accepted
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <AppButton
            label="Next"
            variant="primary"
            size="lg"
            onPress={() => router.push("/(auth)/pending")}
          />
        </FormCard>
      )}
    </AuthLayout>
  );
}

import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { AuthLayout, CompactHeader, FormCard } from "../../components/layout";
import { AppButton, AppInput, AppSelect, ScheduleRow } from "../../components/ui";
import { Upload, CheckCircle } from "lucide-react-native";
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
  const [corUploaded, setCorUploaded] = useState(false);

  const handleScheduleChange = (
    day: string,
    slot: { start: string; end: string } | undefined
  ) => {
    setSchedule((prev) => ({ ...prev, [day]: slot }));
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
          {/* One row per day of the week */}
          {DAYS.map((day) => (
            <ScheduleRow
              key={day}
              day={day}
              value={schedule[day]}
              onChange={(slot) => handleScheduleChange(day, slot)}
            />
          ))}

          {/* Upload COR button */}
          <TouchableOpacity
            className="flex-row items-center justify-center mt-4 mb-4 gap-2"
            onPress={() => setCorUploaded(true)}
            activeOpacity={0.7}
          >
            {corUploaded ? (
              <CheckCircle size={18} color="#10B981" strokeWidth={2} />
            ) : (
              <Upload size={18} color="#1E3A5F" strokeWidth={2} />
            )}
            <Text
              className={`text-sm font-bold ${
                corUploaded ? "text-light-success" : "text-light-accent"
              }`}
            >
              {corUploaded ? "COR Uploaded" : "Upload COR"}
            </Text>
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

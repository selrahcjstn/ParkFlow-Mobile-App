import { useAuthStore } from "@/features/auth/store/auth.store";
import { CheckCircle2, ShieldCheck, User } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export default function AccountCenterDetails() {
  const { user } = useAuthStore();

  const isStudent = user?.profileType === "student";
  const isPersonnel = user?.profileType === "personnel";

  const email = user?.email || "student.parkflow@university.edu.ph";
  const phoneNumber = user?.phoneNumber || "+63 912 345 6789";
  const studentNum = user?.studentNumber || "2022-10495";
  const course = user?.course || "B.S. Computer Science";
  const section = user?.section || "CS-4A";
  const dept = user?.department || "College of Computer Studies";
  const idCardNum = user?.employeeIdNumber || "EMP-94025";
  const yearLevel = user?.yearLevel || 4;
  const courseYearSection = `${course} ${yearLevel} - ${section}`;

  return (
    <View className="gap-5">
      <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-blue-50 dark:bg-blue-950/20 items-center justify-center">
            <User size={18} color="#3B82F6" strokeWidth={2.2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
            Personal Information
          </Text>
        </View>

        <View className="gap-3.5 mt-1">
          <View className="border-b border-light-border dark:border-dark-border pb-3 gap-1.5">
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
              Full Name
            </Text>
            <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
              {user?.name || "Juan dela Cruz"}
            </Text>
          </View>

          <View className="border-b border-light-border dark:border-dark-border pb-3 gap-1.5">
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
              Email Address
            </Text>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px] mr-1">
                {email}
              </Text>
              <CheckCircle2 size={13} color="#10B981" strokeWidth={2.5} />
            </View>
          </View>

          <View className="border-b border-light-border dark:border-dark-border pb-3 gap-1.5">
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
              Phone Number
            </Text>
            <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
              {phoneNumber}
            </Text>
          </View>

          <View className="pb-0.5 gap-1.5">
            <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
              Account Classification
            </Text>
            <View className="flex-row items-center gap-1 bg-light-background dark:bg-dark-surfaceMuted px-2.5 py-1 rounded-pill border border-light-border dark:border-dark-border self-start">
              <ShieldCheck size={12} color="#D22730" strokeWidth={2.2} />
              <Text className="text-light-accent dark:text-dark-text font-heavy text-[11px] uppercase tracking-wider">
                {user?.profileType || "Student"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="bg-light-surface dark:bg-dark-surface rounded-card border border-light-border dark:border-dark-border p-5 shadow-soft">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-9 h-9 rounded-button bg-purple-50 dark:bg-purple-950/20 items-center justify-center">
            <ShieldCheck size={18} color="#8B5CF6" strokeWidth={2.2} />
          </View>
          <Text className="text-light-text dark:text-dark-text font-black text-[15px] tracking-tight">
            {isPersonnel ? "Employment Details" : isStudent ? "Academic Credentials" : "Campus Credentials"}
          </Text>
        </View>

        {isPersonnel ? (
          <View className="gap-3.5 mt-1">
            <View className="border-b border-light-border dark:border-dark-border pb-3 gap-1.5">
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
                Employee ID Number
              </Text>
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                {idCardNum}
              </Text>
            </View>
            <View className="pb-0.5 gap-1.5">
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
                Department
              </Text>
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                {dept}
              </Text>
            </View>
          </View>
        ) : (
          <View className="gap-3.5 mt-1">
            <View className="border-b border-light-border dark:border-dark-border pb-3 gap-1.5">
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
                Student Number
              </Text>
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                {studentNum}
              </Text>
            </View>
            <View className="pb-0.5 gap-1.5">
              <Text className="text-light-muted dark:text-dark-muted font-regular text-[13px]">
                Course, Year & Section
              </Text>
              <Text className="text-light-text dark:text-dark-text font-heavy text-[13px]">
                {courseYearSection}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

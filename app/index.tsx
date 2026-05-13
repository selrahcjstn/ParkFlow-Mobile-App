import { Roles } from "@/constants/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { Redirect } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const { token, user, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

  // not logged in
  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  // wait for user
  if (!user) {
    return null;
  }

  // student
  if (user.role === Roles.Student) return <Redirect href="/(tabs)/home" />;

  // guard
  if (
    user.role === Roles.UniversityStaff ||
    user.role === Roles.NonAcademicPersonell
  ) {
    return <Redirect href="/(guard)/guardDashboard" />;
  }

  return null;
}

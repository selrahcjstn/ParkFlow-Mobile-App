import { DashboardHeader, DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";

export default function ScheduleTab() {
  return (
    <DashboardLayout>
      <DashboardHeader title="Schedule" />
      <ContentWrapper>
        <TabPlaceholderContent
          title="Schedule"
          message="Manage your campus parking schedule here."
        />
      </ContentWrapper>
    </DashboardLayout>
  );
}

import { DashboardHeader, DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";

export default function AccountTab() {
  return (
    <DashboardLayout>
      <DashboardHeader title="Account" />
      <ContentWrapper>
        <TabPlaceholderContent
          title="Account"
          message="Profile and account settings will appear here."
        />
      </ContentWrapper>
    </DashboardLayout>
  );
}

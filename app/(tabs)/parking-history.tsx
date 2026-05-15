import { DashboardHeader, DashboardLayout } from "@/components/layout";
import ContentWrapper from "@/components/layout/ContentWrapper";
import TabPlaceholderContent from "@/components/layout/TabPlaceholderContent";

export default function ParkingHistoryTab() {
  return (
    <DashboardLayout>
      <DashboardHeader title="Parking History" />
      <ContentWrapper>
        <TabPlaceholderContent
          title="Parking History"
          message="View your past parking sessions and fees here."
        />
      </ContentWrapper>
    </DashboardLayout>
  );
}

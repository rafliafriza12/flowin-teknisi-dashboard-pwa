import DashboardPageTemplate from "@/components/templates/pages/dashboard";
import PrivateLayout from "./(pages)/(private)/layout";
const DashboardHome = () => {
  return (
    <PrivateLayout>
      <DashboardPageTemplate />
    </PrivateLayout>
  );
};

export default DashboardHome;

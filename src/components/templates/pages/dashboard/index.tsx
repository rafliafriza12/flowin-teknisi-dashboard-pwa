import DirectContent from "@/components/organisms/dashboard/DirectContent";
import HeaderAndStats from "@/components/organisms/dashboard/HeaderAndStats";
import VisitorInformations from "@/components/organisms/dashboard/VisitorInformations";

const DashboardPageTemplate = () => {
  return (
    <div className="w-full flex flex-col gap-4">
      <HeaderAndStats />
      <VisitorInformations />
      <DirectContent />
    </div>
  );
};

export default DashboardPageTemplate;

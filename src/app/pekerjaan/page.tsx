import PekerjaanListTemplate from "@/components/templates/pages/pekerjaan";
import PrivateLayout from "@/app/(pages)/(private)/layout";

const PekerjaanPage = () => {
  return (
    <PrivateLayout>
      <PekerjaanListTemplate />
    </PrivateLayout>
  );
};

export default PekerjaanPage;

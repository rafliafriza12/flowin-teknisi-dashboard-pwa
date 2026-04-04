import PekerjaanDetailTemplate from "@/components/templates/pages/pekerjaan/PekerjaanDetailTemplate";
import PrivateLayout from "@/app/(pages)/(private)/layout";

interface PekerjaanDetailPageProps {
  params: Promise<{ id: string }>;
}

const PekerjaanDetailPage = async ({ params }: PekerjaanDetailPageProps) => {
  const { id } = await params;

  return (
    <PrivateLayout>
      <PekerjaanDetailTemplate id={id} />
    </PrivateLayout>
  );
};

export default PekerjaanDetailPage;

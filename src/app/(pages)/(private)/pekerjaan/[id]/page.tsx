import PekerjaanDetailTemplate from "@/components/templates/pages/pekerjaan/PekerjaanDetailTemplate";

interface PekerjaanDetailPageProps {
  params: Promise<{ id: string }>;
}

const PekerjaanDetailPage = async ({ params }: PekerjaanDetailPageProps) => {
  const { id } = await params;

  return <PekerjaanDetailTemplate id={id} />;
};

export default PekerjaanDetailPage;

import Image from "next/image";

interface BumiLogoProps {
  variant?: "normal" | "white";
  className?: string;
}

const BumiLogo: React.FC<BumiLogoProps> = ({ className }) => {
  return (
    <Image
      src="/img/logo.png"
      alt="Flowin Logo"
      width={120}
      height={48}
      className={className ?? "w-28 h-auto"}
    />
  );
};

export default BumiLogo;

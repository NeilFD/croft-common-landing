import logo from "@/assets/crazy-bear-logo.png";

interface Props {
  className?: string;
  alt?: string;
}

const CrazyBearLogo = ({ className = "h-8 w-auto", alt = "Crazy Bear" }: Props) => (
  <img src={logo} alt={alt} className={className} loading="eager" />
);

export default CrazyBearLogo;

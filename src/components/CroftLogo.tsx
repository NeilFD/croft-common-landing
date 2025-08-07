import croftLogo from '../assets/croft-logo.png';

const CroftLogo = () => {
  return (
    <img 
      src={croftLogo} 
      alt="Croft Common Logo" 
      className="w-12 h-12 object-contain"
    />
  );
};

export default CroftLogo;
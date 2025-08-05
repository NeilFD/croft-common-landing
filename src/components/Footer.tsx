const Footer = () => {
  return (
    <footer className="bg-void text-background py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-brutalist text-2xl mb-6">CROFT COMMON</h3>
            <p className="font-industrial text-sm text-background/70 leading-relaxed">
              Stokes Croft, Bristol
              <br />
              Hospitality without the fuss
            </p>
          </div>
          
          <div>
            <h4 className="font-industrial text-sm uppercase tracking-wide mb-4 text-background/90">
              CONTACT
            </h4>
            <div className="space-y-2 text-sm font-industrial text-background/70">
              <div>hello@croftcommon.co.uk</div>
              <div>0117 xxx xxxx</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-industrial text-sm uppercase tracking-wide mb-4 text-background/90">
              HOURS
            </h4>
            <div className="space-y-2 text-sm font-industrial text-background/70">
              <div>MON—FRI: 8AM—LATE</div>
              <div>SAT—SUN: 9AM—LATE</div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-12 pt-8 flex justify-between items-center">
          <div className="font-industrial text-xs text-background/50">
            © 2024 CROFT COMMON
          </div>
          <div className="w-8 h-1 bg-accent-pink"></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import { Outlet } from "react-router-dom";
import { PropertyProvider } from "@/contexts/PropertyContext";
import { PropertyKey } from "@/data/brand";
import CBFooter from "@/components/crazybear/CBFooter";
import CBTopNav from "@/components/crazybear/CBTopNav";

const PropertyLayout = ({ property }: { property: PropertyKey }) => {
  return (
    <PropertyProvider property={property}>
      <div className="relative min-h-screen bg-background text-foreground flex flex-col">
        <div className="relative">
          <CBTopNav tone="dark" />
          {/* spacer so content sits below the absolute nav */}
          <div className="h-24 md:h-28" aria-hidden="true" />
        </div>
        <main className="flex-1">
          <Outlet />
        </main>
        <CBFooter />
      </div>
    </PropertyProvider>
  );
};

export default PropertyLayout;

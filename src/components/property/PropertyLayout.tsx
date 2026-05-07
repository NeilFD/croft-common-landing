import { Outlet } from "react-router-dom";
import PropertyNavShell from "./PropertyNavShell";
import { PropertyProvider } from "@/contexts/PropertyContext";
import { countryNav, townNav } from "@/data/navigation";
import { PropertyKey } from "@/data/brand";
import CBFooter from "@/components/crazybear/CBFooter";

const PropertyLayout = ({ property }: { property: PropertyKey }) => {
  const items = property === "country" ? countryNav : townNav;
  return (
    <PropertyProvider property={property}>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <PropertyNavShell property={property} items={items} />
        <main className="flex-1">
          <Outlet />
        </main>
        <CBFooter />
      </div>
    </PropertyProvider>
  );
};

export default PropertyLayout;

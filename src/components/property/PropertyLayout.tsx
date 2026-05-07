import { Outlet } from "react-router-dom";
import PropertyNavShell from "./PropertyNavShell";
import { PropertyProvider } from "@/contexts/PropertyContext";
import { countryNav, townNav } from "@/data/navigation";
import { PropertyKey } from "@/data/brand";

const PropertyLayout = ({ property }: { property: PropertyKey }) => {
  const items = property === "country" ? countryNav : townNav;
  return (
    <PropertyProvider property={property}>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <PropertyNavShell property={property} items={items} />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="border-t border-border bg-black text-white/70 py-10 px-6 text-xs tracking-[0.2em] uppercase">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:justify-between gap-4">
            <span>&copy; {new Date().getFullYear()} Crazy Bear</span>
            <span>Country - Stadhampton &nbsp;&middot;&nbsp; Town - Beaconsfield</span>
          </div>
        </footer>
      </div>
    </PropertyProvider>
  );
};

export default PropertyLayout;

import { Outlet } from "react-router-dom";
import { PropertyProvider } from "@/contexts/PropertyContext";
import { PropertyKey } from "@/data/brand";
import CBFooter from "@/components/crazybear/CBFooter";
import CBTopNav from "@/components/crazybear/CBTopNav";

const PropertyLayout = ({ property }: { property: PropertyKey }) => {
  return (
    <PropertyProvider property={property}>
      {/* Brand 2026: data-property scope wraps nav + main + footer so the
          property palette can tint chrome (top accent bar, footer rules,
          hover states) — never the global B&W shell. */}
      <div
        data-property={property}
        className="cb-property-scope relative min-h-screen bg-background text-foreground flex flex-col"
      >
        {/* Nav is fixed (legibility-primitive strip + scroll solidification),
            so the hero below renders straight at the top of the page. */}
        <CBTopNav />
        <main className="flex-1">
          <Outlet />
        </main>
        <CBFooter />
      </div>
    </PropertyProvider>
  );
};

export default PropertyLayout;

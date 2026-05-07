import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import CrazyBearLogo from "@/components/CrazyBearLogo";
import { NavItem } from "@/data/navigation";
import { PROPERTIES, PropertyKey } from "@/data/brand";

interface Props {
  property: PropertyKey;
  items: NavItem[];
}

const PropertyNavShell = ({ property, items }: Props) => {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const location = useLocation();
  const config = PROPERTIES[property];
  const otherKey: PropertyKey = property === "country" ? "town" : "country";
  const other = PROPERTIES[otherKey];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black text-white">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <Link to={config.basePath} className="flex items-center gap-3">
          <CrazyBearLogo tone="light" className="h-9 w-9" />
          <span className="hidden sm:block font-serif text-lg leading-tight">
            <span className="block">{config.name}</span>
            <span className="block text-[9px] tracking-[0.3em] uppercase opacity-70">
              {config.location}
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {items.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <div
                key={item.path}
                className="relative"
                onMouseEnter={() => setHovered(item.path)}
                onMouseLeave={() => setHovered(null)}
              >
                <Link
                  to={item.path}
                  className={`text-xs tracking-[0.25em] uppercase hover:opacity-70 ${
                    active ? "opacity-100" : "opacity-90"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && hovered === item.path && (
                  <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3">
                    <div className="min-w-[180px] border border-white/10 bg-black py-2 shadow-xl">
                      {item.children.map((c) => (
                        <Link
                          key={c.path}
                          to={c.path}
                          className="block px-4 py-2 text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center">
          <Link
            to={other.basePath}
            className="border border-white/40 px-3 py-2 text-[10px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-colors"
          >
            Switch to {other.name.replace("Crazy Bear ", "")}
          </Link>
        </div>

        <button
          aria-label="Open menu"
          className="lg:hidden p-2"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black text-white">
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
            <Link to={config.basePath} onClick={() => setOpen(false)}>
              <CrazyBearLogo tone="light" className="h-9 w-9" />
            </Link>
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="px-6 py-8 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
            {items.map((item) => (
              <div key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className="block font-serif text-3xl"
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="mt-2 ml-1 space-y-2">
                    {item.children.map((c) => (
                      <Link
                        key={c.path}
                        to={c.path}
                        onClick={() => setOpen(false)}
                        className="block text-xs tracking-[0.25em] uppercase opacity-70"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-6 border-t border-white/10">
              <Link
                to={other.basePath}
                onClick={() => setOpen(false)}
                className="block text-xs tracking-[0.3em] uppercase opacity-80"
              >
                Switch to {other.name}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default PropertyNavShell;

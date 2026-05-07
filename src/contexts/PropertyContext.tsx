import { createContext, useContext, ReactNode } from "react";
import { PROPERTIES, PropertyKey } from "@/data/brand";

type Ctx = {
  property: PropertyKey;
  config: typeof PROPERTIES[PropertyKey];
};

const PropertyContext = createContext<Ctx | null>(null);

export const PropertyProvider = ({
  property,
  children,
}: {
  property: PropertyKey;
  children: ReactNode;
}) => (
  <PropertyContext.Provider value={{ property, config: PROPERTIES[property] }}>
    {children}
  </PropertyContext.Provider>
);

export const useProperty = () => {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider");
  return ctx;
};

export const useOptionalProperty = () => useContext(PropertyContext);

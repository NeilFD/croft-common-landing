export interface HeroImage {
  src: string;
  type?: string;
  overlay?: string;
  backgroundPosition?: string;
  backgroundSize?: string;
}

export const homeHeroImages: HeroImage[] = [
  { src: '/lovable-uploads/554a5ea5-4c34-4b71-971b-a896a47f8927.png', type: 'dark', overlay: 'bg-void/30' },
  { src: '/lovable-uploads/2cf25417-28ae-479d-b6b8-19e126392333.png', type: 'warm', overlay: 'bg-void/20' },
  { src: '/lovable-uploads/64b7fab3-00a9-4045-9318-590eb75f1336.png', type: 'warm', overlay: 'bg-void/30' }
];

export const cafeHeroImages: HeroImage[] = [
  { src: '/lovable-uploads/0a0894f9-a169-4747-9282-2150f198561c.png', type: 'dark', overlay: 'bg-void/35', backgroundPosition: '50% 45%' },
  { src: '/lovable-uploads/544efa64-6a2b-4db8-ba10-4da2954a97da.png', type: 'warm', overlay: '', backgroundPosition: 'center center' },
  { src: '/lovable-uploads/e6f7674f-71d0-4ec4-8782-a283ed5ba5b5.png', type: 'dark', overlay: 'bg-void/25', backgroundPosition: '55% center' },
  { src: '/lovable-uploads/9110aec8-9e43-43ad-b701-6d4948d1f48b.png', type: 'warm', overlay: '', backgroundPosition: 'center center' },
  { src: '/lovable-uploads/0726808b-f108-44ac-bc6c-12c7eead462a.png', type: 'dark', overlay: 'bg-void/30', backgroundPosition: 'center 60%' },
  { src: '/lovable-uploads/e5c78d77-a685-4c5c-ab4a-2968bde2a0de.png', type: 'warm', overlay: 'bg-void/20', backgroundPosition: '65% center' },
];

export const cocktailHeroImages: HeroImage[] = [
  { src: '/lovable-uploads/8dc68acd-38ac-4910-a909-716d78b1d187.png', type: 'warm', overlay: 'bg-void/30' },
  { src: '/lovable-uploads/19074a8e-e1ee-4793-8c75-c60bd7818a99.png', type: 'dark', overlay: '' },
  { src: '/lovable-uploads/ada4b655-67e6-4bbe-8e52-ea2d407da312.png', type: 'warm', overlay: 'bg-void/25' },
  { src: '/lovable-uploads/0c4a9d3f-d5a3-4a01-85fb-ed3f272a821f.png', type: 'dark', overlay: '' },
  { src: '/lovable-uploads/644b4e2a-eb1b-4d76-a734-f012e7d69379.png', type: 'dark', overlay: '' },
  { src: '/lovable-uploads/4a785c1a-4ea4-4874-b47e-24c5c2611368.png', type: 'dark', overlay: '' },
];

export const beerHeroImages: HeroImage[] = [
  { src: '/lovable-uploads/a6fcbd2e-334d-49e3-9b5d-d7dd0e87d852.png', type: 'dark', overlay: 'bg-void/20', backgroundSize: 'bg-cover' },
  { src: '/lovable-uploads/3a5090a3-760f-4496-8672-bd8724569325.png', type: 'dark', overlay: '', backgroundSize: 'bg-cover' },
  { src: '/lovable-uploads/9ef0b073-9f25-420b-8d75-fb90540706d3.png', type: 'dark', overlay: '', backgroundSize: 'bg-cover' },
  { src: '/lovable-uploads/25105870-85fb-442c-9d85-ee7e218df672.png', type: 'warm', overlay: '', backgroundSize: 'bg-cover' },
  { src: '/lovable-uploads/1b15e13f-fb17-4f03-a1d9-9a7c2a2611b3.png', type: 'dark', overlay: 'bg-void/25', backgroundSize: 'bg-cover' },
  { src: '/lovable-uploads/a7f9a44b-d4bc-48db-bf2c-7440227a4b1e.png', type: 'warm', overlay: '', backgroundSize: 'bg-cover' },
];

export const hallHeroImages: HeroImage[] = [
  { src: '/lovable-uploads/4d7c9143-3421-4c65-9601-29c65667740a.png', type: 'dark', overlay: '' },
  { src: '/lovable-uploads/834974e6-ab56-4571-946b-b3b09c2ee678.png', type: 'dark', overlay: '' },
  { src: '/lovable-uploads/b64216a3-dd09-4428-a328-02343a5f2a23.png', type: 'dark', overlay: 'bg-void/25' },
  { src: '/lovable-uploads/fdbc71f5-00d7-4da2-af28-8626b224ec5b.png', type: 'light', overlay: 'bg-void/15' },
  { src: '/lovable-uploads/5d770f71-d0ac-45ef-b72f-b853c4020425.png', type: 'mixed', overlay: 'bg-void/25' },
  { src: '/lovable-uploads/90bb8b43-c5a1-41ba-ac44-1ea3c8109e07.png', type: 'mixed', overlay: '' },
];

export const kitchenHeroImages: HeroImage[] = [
  { src: '/lovable-uploads/7a67832c-682c-437c-80c0-30edc2a10f56.png', type: 'dark', overlay: 'bg-void/30' },
  { src: '/lovable-uploads/5101ed7f-1323-4112-82b4-a09d6d501a36.png', type: 'industrial', overlay: '' },
  { src: '/lovable-uploads/8ea5b295-7d10-4aeb-a64c-b646f4046ee2.png', type: 'warm', overlay: 'bg-void/20' },
  { src: '/lovable-uploads/75f518f0-7918-463a-9e00-c016e4271205.png', type: 'mixed', overlay: 'bg-void/25' },
  { src: '/lovable-uploads/0d977d16-788f-4f60-9f33-fd2086b66430.png', type: 'industrial', overlay: '' },
  { src: '/lovable-uploads/d267ef73-2a5d-4bdd-9f73-63f8c364077f.png', type: 'dark', overlay: 'bg-void/30' },
];

export const communityHeroImages: HeroImage[] = [
  { src: '/lovable-uploads/2a013145-1125-485a-bc81-556ddb550540.png' },
  { src: '/lovable-uploads/dc15ca32-0829-46a6-9db5-897ebaafaff9.png' },
  { src: '/lovable-uploads/ff58d7a5-7fae-4492-9f4f-02cf1c93e8a1.png' },
  { src: '/lovable-uploads/a20baf5a-8e8f-41ea-82f5-1801dbd32dd7.png' },
  { src: '/lovable-uploads/2c2e175f-be6b-4df7-a725-47d558a35cd8.png' },
  { src: '/lovable-uploads/4bafb73c-74e5-4bf4-ba9e-34097a0137cf.png' },
];

export const commonRoomHeroImages: HeroImage[] = [
  { src: '/lovable-uploads/322fb5be-0402-4d55-8a72-b5e9c3253eef.png' },
];

export const getAllHeroImageUrls = (): string[] => {
  const all = [
    ...homeHeroImages,
    ...cafeHeroImages,
    ...cocktailHeroImages,
    ...beerHeroImages,
    ...hallHeroImages,
    ...kitchenHeroImages,
    ...communityHeroImages,
    ...commonRoomHeroImages,
  ].map((i) => i.src);
  return Array.from(new Set(all));
};

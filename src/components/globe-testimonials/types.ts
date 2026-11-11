export type GlobeReview = {
  id: string;
  name: string;
  role: string;
  company: string;
  city: string;
  countryCode: string;
  lat: number;
  lng: number;
  rating: number; // 1–5
  text: string;
  avatarUrl: string;
  accentColor: string; // CSS color for pin / avatar ring
};

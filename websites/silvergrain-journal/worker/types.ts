export type Bindings = { DB: D1Database; BUCKET: R2Bucket; JOURNAL_OWNER_EMAIL?: string };
export type Run = { text: string; bold?: boolean; italic?: boolean; underline?: boolean };
export type Paragraph = { kind: "p" | "h2" | "quote"; runs: Run[] };
export type Frame = {
  id: string; asset: string; page: number; x: number; y: number; w: number; h: number;
  caption: string; overlay: string; alt: string; overlayAt: "top" | "center" | "bottom";
};
export type Entry = {
  id: string; title: string; deck: string; category: string; location: string; date: string;
  cover: string; coverCaption: string; coverAlt: string; coverOverlay?: string;
  coverOverlayAt?: Frame["overlayAt"]; order: number; columns: number;
  align: "justify" | "left" | "center" | "right"; pages: number; body: Paragraph[]; frames: Frame[];
};
export type Asset = {
  id: string; name: string; kind: "image" | "video"; width: number; height: number;
  url: string; thumb: string; alt: string;
};
export type StoredEntry = { id: string; revision: number; draft: string; live: string | null };
export type EditEntry = { id: string; revision: number; draft: Entry; published: boolean; pending: boolean; sample: boolean };
export type Contacts = { instagram: string; whatsapp: string; telegram: string; email: string; phone: string };
export type Letter = { id: number; sender: string; email: string; body: string; received: number };

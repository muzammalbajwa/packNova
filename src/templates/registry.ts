import type { ComponentType } from "react";

export const TEMPLATE_IDS = ["editorial", "cinematic", "industrial", "eco"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  blurb: string;
}

/** Light-weight metadata (safe for the picker page: no template code is imported). */
export const TEMPLATE_META: readonly TemplateMeta[] = [
  { id: "editorial", name: "Editorial Light", blurb: "Ivory paper, serif headlines and thin rules, laid out like a magazine." },
  { id: "cinematic", name: "Midnight Cinematic", blurb: "Dark, full-bleed 3D with giant headlines and captions over the box." },
  { id: "industrial", name: "Industrial Blueprint", blurb: "A spec-sheet look: visible grid, hard borders, mono type and dimension lines." },
  { id: "eco", name: "Playful Eco", blurb: "Friendly rounded shapes, lime stickers and bouncy chips on deep green." },
];

export interface TemplateModule {
  Home: ComponentType;
  ConfiguratorPage: ComponentType;
}

/**
 * Each template is loaded on demand, so a page only ships the CSS and JS of the template it renders
 * (the three.js chunk is shared and lazy). Add a template: a folder in src/templates, an entry here.
 */
export const TEMPLATE_LOADERS: Record<TemplateId, () => Promise<TemplateModule>> = {
  editorial: () => import("./editorial"),
  cinematic: () => import("./cinematic"),
  industrial: () => import("./industrial"),
  eco: () => import("./eco"),
};

export const isTemplateId = (v: string): v is TemplateId => (TEMPLATE_IDS as readonly string[]).includes(v);

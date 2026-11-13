import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HubPage from "@/catalog/HubPage";
import { pageMetadata } from "@/catalog/seo";
import { GROUPS, GROUP_BY_ID, type GroupId } from "@/content/catalog";

export const dynamicParams = false;
export const generateStaticParams = () => GROUPS.map((g) => ({ group: g.id }));

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }): Promise<Metadata> {
  const { group } = await params;
  const g = GROUP_BY_ID[group as GroupId];
  return g ? pageMetadata(g.seo.title, g.seo.description, g.href) : {};
}

export default async function Page({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  if (!(group in GROUP_BY_ID)) notFound();
  return <HubPage group={group as GroupId} />;
}

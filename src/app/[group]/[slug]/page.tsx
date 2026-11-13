import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage from "@/catalog/CategoryPage";
import { pageMetadata } from "@/catalog/seo";
import { PAGES, getPage } from "@/content/catalog";

export const dynamicParams = false;
export const generateStaticParams = () => PAGES.map((p) => ({ group: p.group, slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ group: string; slug: string }> }): Promise<Metadata> {
  const { group, slug } = await params;
  const p = getPage(group, slug);
  return p ? pageMetadata(p.seo.title, p.seo.description, p.href) : {};
}

export default async function Page({ params }: { params: Promise<{ group: string; slug: string }> }) {
  const { group, slug } = await params;
  const page = getPage(group, slug);
  if (!page) notFound();
  return <CategoryPage page={page} />;
}

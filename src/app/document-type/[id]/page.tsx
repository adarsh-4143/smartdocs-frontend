import DocumentTypeDetailClient from "./DocumentTypeDetailClient";

export async function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({
    id: String(i + 1),
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return <DocumentTypeDetailClient />;
}

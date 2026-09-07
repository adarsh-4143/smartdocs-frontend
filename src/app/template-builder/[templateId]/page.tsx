import TemplateBuilderClient from "./TemplateBuilderClient";

export async function generateStaticParams() {
  return Array.from({ length: 100 }, (_, i) => ({
    templateId: String(i + 1),
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  await params;
  return <TemplateBuilderClient />;
}

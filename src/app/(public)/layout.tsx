import { DemoBanner, SiteFooter } from "@/components/public/Chrome";
import { getMenu } from "@/lib/menu/data";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const { settings } = await getMenu();
  return (
    <>
      <DemoBanner settings={settings} />
      <main>{children}</main>
      <SiteFooter settings={settings} />
    </>
  );
}

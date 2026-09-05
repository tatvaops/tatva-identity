import { ForumsHubView } from "@/features/identiti/forums-view";
import { listForumLinks, listIdentitiBrands } from "@/lib/data/identiti";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";

export default async function ForumsPage() {
  const session = await getAuthContext();
  const [service, product, links] = await Promise.all([
    listIdentitiBrands("service_brand"),
    listIdentitiBrands("product_brand"),
    listForumLinks(),
  ]);
  return (
    <>
      <QueryNotice configured={service.meta.configured} error={service.meta.error ?? product.meta.error} />
      <ForumsHubView brands={[...service.data, ...product.data]} links={links} signedIn={Boolean(session.userId)} />
    </>
  );
}

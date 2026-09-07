import { getSearchDiscovery } from "@/lib/data/discovery";

export async function GET() {
  const data = await getSearchDiscovery();
  return Response.json(data);
}

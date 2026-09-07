import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/data/query";
import { getConnectionState, type ConnectionState } from "@/lib/data/network";
import { viewerFromNetwork, type ViewerRelation } from "@/lib/domain/visibility";

export async function viewerIsRecruiter() {
  const supabase = await createServerSupabase();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("viewer_is_recruiter");
  if (error) return false;
  return Boolean(data);
}

export async function viewerRelationFor(
  profileId: string,
  connectionState?: ConnectionState,
): Promise<{ relation: ViewerRelation; connectionState: ConnectionState }> {
  const session = await getAuthContext();
  const isOwner = session.userId === profileId;
  const state =
    connectionState ??
    (session.userId && !isOwner ? await getConnectionState(session.userId, profileId) : "connect");
  const isRecruiter = session.userId ? await viewerIsRecruiter() : false;
  return {
    relation: viewerFromNetwork({ isOwner, connectionState: state, isRecruiter }),
    connectionState: state,
  };
}

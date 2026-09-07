export type NotificationPrefKey =
  | "notifyConnections"
  | "notifyMessages"
  | "notifyApplications"
  | "notifySocial"
  | "notifyOrganisation"
  | "always";

const KIND_PREF: Record<string, NotificationPrefKey> = {
  connection: "notifyConnections",
  follow: "notifyConnections",
  message: "notifyMessages",
  enquiry: "notifyMessages",
  application: "notifyApplications",
  comment: "notifySocial",
  reaction: "notifySocial",
  recommendation: "notifySocial",
  recommendation_request: "notifySocial",
  mention: "notifySocial",
  organisation: "notifyOrganisation",
  org_invite: "notifyOrganisation",
  invite: "notifyOrganisation",
};

export function notificationPrefForKind(kind: string): NotificationPrefKey {
  return KIND_PREF[kind] ?? "always";
}

export function shouldDeliverNotification(
  kind: string,
  prefs: Partial<Record<Exclude<NotificationPrefKey, "always">, boolean>>,
) {
  const key = notificationPrefForKind(kind);
  if (key === "always") return true;
  return prefs[key] !== false;
}

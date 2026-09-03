export const LOCALES = ["en", "hi", "kn", "ta", "te", "mr", "bn", "gu"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "tatva-locale";

const en = {
  skip: "Skip to content",
  home: "Home",
  network: "Network",
  jobs: "Jobs",
  gigs: "Gigs",
  messages: "Messages",
  notifications: "Notifications",
  profile: "Profile",
  search: "Search",
  post: "Post",
  business: "Business",
  insights: "Insights",
  saved: "Saved",
  graph: "Work graph",
  jobsLead: "Permanent and contract roles. Not the same as gigs.",
  gigsLead: "Immediate work — date, shift, location and pay first. Not a job listing.",
  nearbyGigs: "Nearest first when distance is known.",
  language: "Language",
};

const hi: typeof en = {
  skip: "सामग्री पर जाएँ",
  home: "होम",
  network: "नेटवर्क",
  jobs: "नौकरियाँ",
  gigs: "गिग्स",
  messages: "संदेश",
  notifications: "सूचनाएँ",
  profile: "प्रोफ़ाइल",
  search: "खोज",
  post: "पोस्ट",
  business: "व्यवसाय",
  insights: "जानकारी",
  saved: "सेव्ड",
  graph: "कार्य ग्राफ़",
  jobsLead: "स्थायी और अनुबंध भूमिकाएँ। गिग्स से अलग।",
  gigsLead: "तुरंत काम — तारीख, शिफ्ट, जगह और भुगतान पहले। नौकरी सूची नहीं।",
  nearbyGigs: "दूरी पता हो तो पास वाले पहले।",
  language: "भाषा",
};

const dictionaries: Record<AppLocale, typeof en> = {
  en,
  hi,
  kn: en,
  ta: en,
  te: en,
  mr: en,
  bn: en,
  gu: en,
};

export function parseLocale(value?: string | null): AppLocale {
  return LOCALES.includes(value as AppLocale) ? (value as AppLocale) : "en";
}

export function getDictionary(locale?: string | null) {
  return dictionaries[parseLocale(locale)];
}

export const localeLabels: Record<AppLocale, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  ta: "தமிழ்",
  te: "తెలుగు",
  mr: "मराठी",
  bn: "বাংলা",
  gu: "ગુજરાતી",
};

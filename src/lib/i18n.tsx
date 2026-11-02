import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export const LANGS = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिन्दी" },
  { code: "ne", label: "नेपाली" },
] as const;
export type Lang = (typeof LANGS)[number]["code"];

const D = {
  home: ["Home", "হোম", "होम", "गृह"],
  categories: ["Categories", "বিভাগ", "श्रेणियाँ", "वर्गहरू"],
  upload: ["Upload", "আপলোড", "अपलोड", "अपलोड"],
  saved: ["Saved", "সংরক্ষিত", "सहेजे गए", "सुरक्षित"],
  profile: ["Profile", "প্রোফাইল", "प्रोफ़ाइल", "प्रोफाइल"],
  language: ["Language", "ভাষা", "भाषा", "भाषा"],
  breaking: ["Breaking", "ব্রেকিং", "ब्रेकिंग", "ताजा"],
  latest: ["Latest News", "সর্বশেষ খবর", "ताज़ा ख़बरें", "ताजा समाचार"],
  noNews: ["No news yet.", "এখনও কোনো খবর নেই।", "अभी कोई ख़बर नहीं।", "अहिले कुनै समाचार छैन।"],
  caughtUp: ["You're all caught up", "আপনি সব খবর দেখে ফেলেছেন", "आपने सारी ख़बरें देख लीं", "तपाईंले सबै समाचार हेर्नुभयो"],
  allCats: ["← All categories", "← সব বিভাগ", "← सभी श्रेणियाँ", "← सबै वर्गहरू"],
  loadMore: ["Load more", "আরও দেখুন", "और देखें", "थप हेर्नुहोस्"],
  signIn: ["Sign in", "সাইন ইন", "साइन इन", "साइन इन"],
  uploadNews: ["Upload News", "খবর আপলোড", "ख़बर अपलोड करें", "समाचार अपलोड"],
  signInUpload: ["Sign in to publish your own news story.", "নিজের খবর প্রকাশ করতে সাইন ইন করুন।", "अपनी ख़बर प्रकाशित करने के लिए साइन इन करें।", "आफ्नो समाचार प्रकाशित गर्न साइन इन गर्नुहोस्।"],
  signInProfile: ["Sign in to see your profile.", "প্রোফাইল দেখতে সাইন ইন করুন।", "प्रोफ़ाइल देखने के लिए साइन इन करें।", "प्रोफाइल हेर्न साइन इन गर्नुहोस्।"],
  headline: ["Headline", "শিরোনাম", "शीर्षक", "शीर्षक"],
  whatHappened: ["What happened?", "কী ঘটেছে?", "क्या हुआ?", "के भयो?"],
  category: ["Category", "বিভাগ", "श्रेणी", "वर्ग"],
  addPhoto: ["Add photo", "ছবি যোগ করুন", "फ़ोटो जोड़ें", "फोटो थप्नुहोस्"],
  addVideo: ["Add video", "ভিডিও যোগ করুন", "वीडियो जोड़ें", "भिडियो थप्नुहोस्"],
  fullStory: ["Full story", "পুরো খবর", "पूरी ख़बर", "पूरा समाचार"],
  storyPh: ["Tell the full story. Who, what, where, when…", "পুরো ঘটনা লিখুন। কে, কী, কোথায়, কখন…", "पूरी कहानी लिखें। कौन, क्या, कहाँ, कब…", "पूरा कुरा लेख्नुहोस्। को, के, कहाँ, कहिले…"],
  publish: ["Publish News", "খবর প্রকাশ করুন", "ख़बर प्रकाशित करें", "समाचार प्रकाशित गर्नुहोस्"],
  publishing: ["Publishing…", "প্রকাশ হচ্ছে…", "प्रकाशित हो रही है…", "प्रकाशित हुँदैछ…"],
  liveNote: ["Your story goes live immediately. Please share only true, respectful news.", "আপনার খবর সঙ্গে সঙ্গে প্রকাশিত হবে। শুধু সত্য ও সম্মানজনক খবর দিন।", "आपकी ख़बर तुरंत प्रकाशित होगी। कृपया केवल सच्ची और सम्मानजनक ख़बर ही साझा करें।", "तपाईंको समाचार तुरुन्तै प्रकाशित हुन्छ। कृपया सत्य र सम्मानजनक समाचार मात्र दिनुहोस्।"],
  myNews: ["My News", "আমার খবর", "मेरी ख़बरें", "मेरा समाचार"],
  published: ["stories published", "টি খবর প্রকাশিত", "ख़बरें प्रकाशित", "समाचार प्रकाशित"],
  noPosts: ["You haven't published any news yet.", "আপনি এখনও কোনো খবর প্রকাশ করেননি।", "आपने अभी तक कोई ख़बर प्रकाशित नहीं की।", "तपाईंले अहिलेसम्म कुनै समाचार प्रकाशित गर्नुभएको छैन।"],
  All: ["All", "সব", "सभी", "सबै"],
  Local: ["Local", "স্থানীয়", "स्थानीय", "स्थानीय"],
  "West Bengal": ["West Bengal", "পশ্চিমবঙ্গ", "पश्चिम बंगाल", "पश्चिम बंगाल"],
  National: ["National", "জাতীয়", "राष्ट्रीय", "राष्ट्रिय"],
  Politics: ["Politics", "রাজনীতি", "राजनीति", "राजनीति"],
  Sports: ["Sports", "খেলা", "खेल", "खेलकुद"],
  Entertainment: ["Entertainment", "বিনোদন", "मनोरंजन", "मनोरञ्जन"],
  Business: ["Business", "ব্যবসা", "व्यापार", "व्यापार"],
  Health: ["Health", "স্বাস্থ্য", "स्वास्थ्य", "स्वास्थ्य"],
} as const;
export type TKey = keyof typeof D;
const IDX: Record<Lang, number> = { en: 0, bn: 1, hi: 2, ne: 3 };

export function translate(lang: Lang, key: string): string {
  const row = (D as Record<string, readonly string[]>)[key];
  return row ? (row[IDX[lang]] ?? row[0]!) : key;
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: TKey | string) => string };
const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => translate("en", k) });
const KEY = "dk-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const s = localStorage.getItem(KEY) as Lang | null;
    if (s && s in IDX) setLangState(s);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l: Lang) => { localStorage.setItem(KEY, l); setLangState(l); }, []);
  const t = useCallback((k: string) => translate(lang, k), [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useT = () => useContext(LangCtx);

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export const LANGS = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिन्दी" },
  { code: "ne", label: "नेपाली" },
] as const;
export type Lang = (typeof LANGS)[number]["code"];

const D = {
  youtubeLivePlayerTitle: ["YouTube Live", "YouTube Live", "YouTube Live", "YouTube Live"],
  youtubeLiveTitle: [
    "Share a YouTube Live stream",
    "YouTube Live স্ট্রিম শেয়ার করুন",
    "YouTube Live स्ट्रीम साझा करें",
    "YouTube Live स्ट्रিম साझा गर्नुहोस्",
  ],
  youtubeLiveDescription: [
    "Start your broadcast on YouTube, then paste its public link here. Anyone can watch it on this page.",
    "YouTube-এ সম্প্রচার শুরু করে তার পাবলিক লিংক এখানে দিন। সবাই এই পেজে দেখতে পারবেন।",
    "YouTube पर प्रसारण शुरू करें और उसका सार्वजनिक लिंक यहाँ डालें। सभी इसे इस पेज पर देख सकते हैं।",
    "YouTube मा प्रसारण सुरु गरेर त्यसको सार्वजनिक लिङ्क यहाँ राख्नुहोस्। सबैले यो पृष्ठमा हेर्न सक्छन्।",
  ],
  youtubeLiveUrlPlaceholder: [
    "Paste a public YouTube Live URL",
    "একটি পাবলিক YouTube Live URL পেস্ট করুন",
    "सार्वजनिक YouTube Live URL पेस्ट करें",
    "सार्वजनिक YouTube Live URL टाँस्नुहोस्",
  ],
  publishYouTubeLive: [
    "Share stream with everyone",
    "সবার সঙ্গে স্ট্রিম শেয়ার করুন",
    "सबके साथ स्ट्रीम साझा करें",
    "सबैसँग स्ट्रिम साझा गर्नुहोस्",
  ],
  replaceYouTubeLive: [
    "Replace my stream",
    "আমার স্ট্রিম বদলান",
    "मेरी स्ट्रीम बदलें",
    "मेरो स्ट्रिम बदल्नुहोस्",
  ],
  removeYouTubeLive: [
    "Remove my stream",
    "আমার স্ট্রিম সরান",
    "मेरी स्ट्रीम हटाएँ",
    "मेरो स्ट्रिम हटाउनुहोस्",
  ],
  noYouTubeLive: [
    "No YouTube Live streams shared yet.",
    "এখনও কোনো YouTube Live স্ট্রিম শেয়ার করা হয়নি।",
    "अभी तक कोई YouTube Live स्ट्रीम साझा नहीं की गई है।",
    "अहिलेसम्म कुनै YouTube Live स्ट्रिम साझा गरिएको छैन।",
  ],
  sharedYouTubeLive: [
    "Shared YouTube Live streams",
    "শেয়ার করা YouTube Live স্ট্রিম",
    "साझा की गई YouTube Live स्ट्रीम",
    "साझा गरिएका YouTube Live स्ट्रिमहरू",
  ],
  youtubeEmbedNote: [
    "The stream must be public and allow embedding. Start or schedule the broadcast on YouTube before sharing its link.",
    "স্ট্রিমটি পাবলিক হতে হবে এবং এমবেড করার অনুমতি থাকতে হবে। লিংক শেয়ারের আগে YouTube-এ সম্প্রচার শুরু বা সময়সূচি নির্ধারণ করুন।",
    "स्ट्रीम सार्वजनिक होनी चाहिए और एम्बेड की अनुमति होनी चाहिए। लिंक साझा करने से पहले YouTube पर प्रसारण शुरू करें या शेड्यूल करें।",
    "स्ट्रिम सार्वजनिक र एम्बेड गर्न मिल्ने हुनुपर्छ। लिङ्क साझा गर्नुअघि YouTube मा प्रसारण सुरु वा तालिका बनाउनुहोस्।",
  ],
  invalidYoutubeLiveUrl: [
    "Enter a valid public YouTube video or Live URL.",
    "একটি বৈধ পাবলিক YouTube ভিডিও বা Live URL দিন।",
    "एक मान्य सार्वजनिक YouTube वीडियो या Live URL दर्ज करें।",
    "वैध सार्वजनिक YouTube भिडियो वा Live URL प्रविष्ट गर्नुहोस्।",
  ],
  signInToShareLive: [
    "Sign in to share a YouTube Live stream.",
    "YouTube Live স্ট্রিম শেয়ার করতে সাইন ইন করুন।",
    "YouTube Live स्ट्रीम साझा करने के लिए साइन इन करें।",
    "YouTube Live स्ट्रिम साझा गर्न साइन इन गर्नुहोस्।",
  ],
  home: ["Home", "হোম", "होम", "गृह"],
  categories: ["Categories", "বিভাগ", "श्रेणियाँ", "वर्गहरू"],
  upload: ["Upload", "আপলোড", "अपलोड", "अपलोड"],
  saved: ["Saved", "সংরক্ষিত", "सहेजे गए", "सुरक्षित"],
  profile: ["Profile", "প্রোফাইল", "प्रोफ़ाइल", "प्रोफाइल"],
  search: ["Search", "খুঁজুন", "खोजें", "खोज्नुहोस्"],
  language: ["Language", "ভাষা", "भाषा", "भाषा"],
  breaking: ["Breaking", "ব্রেকিং", "ब्रेकिंग", "ताजा"],
  latest: ["Latest News", "সর্বশেষ খবর", "ताज़ा ख़बरें", "ताजा समाचार"],
  noNews: ["No news yet.", "এখনও কোনো খবর নেই।", "अभी कोई ख़बर नहीं।", "अहिले कुनै समाचार छैन।"],
  newsLoadError: [
    "Couldn't load the news. Check your connection and try again.",
    "খবর লোড করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
    "ख़बरें लोड नहीं हो सकीं। कनेक्शन जाँचें और फिर कोशिश करें।",
    "समाचार लोड भएन। आफ्नो जडान जाँचेर फेरि प्रयास गर्नुहोस्।",
  ],
  retry: ["Try again", "আবার চেষ্টা করুন", "फिर कोशिश करें", "फेरि प्रयास गर्नुहोस्"],
  caughtUp: [
    "You're all caught up",
    "আপনি সব খবর দেখে ফেলেছেন",
    "आपने सारी ख़बरें देख लीं",
    "तपाईंले सबै समाचार हेर्नुभयो",
  ],
  allCats: ["← All categories", "← সব বিভাগ", "← सभी श्रेणियाँ", "← सबै वर्गहरू"],
  loadMore: ["Load more", "আরও দেখুন", "और देखें", "थप हेर्नुहोस्"],
  signIn: ["Sign in", "সাইন ইন", "साइन इन", "साइन इन"],
  uploadNews: ["Upload News", "খবর আপলোড", "ख़बर अपलोड करें", "समाचार अपलोड"],
  signInUpload: [
    "Sign in to publish your own news story.",
    "নিজের খবর প্রকাশ করতে সাইন ইন করুন।",
    "अपनी ख़बर प्रकाशित करने के लिए साइन इन करें।",
    "आफ्नो समाचार प्रकाशित गर्न साइन इन गर्नुहोस्।",
  ],
  signInProfile: [
    "Sign in to see your profile.",
    "প্রোফাইল দেখতে সাইন ইন করুন।",
    "प्रोफ़ाइल देखने के लिए साइन इन करें।",
    "प्रोफाइल हेर्न साइन इन गर्नुहोस्।",
  ],
  headline: ["Headline", "শিরোনাম", "शीर्षक", "शीर्षक"],
  whatHappened: ["What happened?", "কী ঘটেছে?", "क्या हुआ?", "के भयो?"],
  category: ["Category", "বিভাগ", "श्रेणी", "वर्ग"],
  addPhotos: ["Add photos", "ছবি যোগ করুন", "फ़ोटो जोड़ें", "फोटो थप्नुहोस्"],
  addVideo: ["Add video", "ভিডিও যোগ করুন", "वीडियो जोड़ें", "भिडियो थप्नुहोस्"],
  generateAIImage: ["Generate AI image", "AI ছবি তৈরি করুন", "AI छवि बनाएँ", "AI तस्बिर बनाउनुहोस्"],
  generatingAIImage: ["Generating image…", "ছবি তৈরি হচ্ছে…", "छवि बनाई जा रही है…", "तस्बिर बनाउँदै…"],
  aiImageHelp: [
    "Generated images are labeled as AI illustrations.",
    "তৈরি করা ছবিতে AI ইলাস্ট্রেশন লেবেল থাকবে।",
    "बनाई गई छवियों पर AI चित्रण का लेबल होगा।",
    "बनाइएका तस्बिरमा AI चित्रण लेबल हुनेछ।",
  ],
  aiIllustration: ["AI illustration", "AI ইলাস্ট্রেশন", "AI चित्रण", "AI चित्रण"],
  enterHeadlineForAIImage: [
    "Enter a headline of at least 5 characters first.",
    "প্রথমে অন্তত ৫ অক্ষরের শিরোনাম লিখুন।",
    "पहले कम से कम 5 अक्षरों का शीर्षक लिखें।",
    "पहिले कम्तीमा ५ अक्षरको शीर्षक लेख्नुहोस्।",
  ],
  fullStory: ["Full story", "পুরো খবর", "पूरी ख़बर", "पूरा समाचार"],
  storyPh: [
    "Tell the full story. Who, what, where, when…",
    "পুরো ঘটনা লিখুন। কে, কী, কোথায়, কখন…",
    "पूरी कहानी लिखें। कौन, क्या, कहाँ, कब…",
    "पूरा कुरा लेख्नुहोस्। को, के, कहाँ, कहिले…",
  ],
  publish: ["Publish News", "খবর প্রকাশ করুন", "ख़बर प्रकाशित करें", "समाचार प्रकाशित गर्नुहोस्"],
  publishing: ["Publishing…", "প্রকাশ হচ্ছে…", "प्रकाशित हो रही है…", "प्रकाशित हुँदैछ…"],
  liveNote: [
    "Your story goes live immediately. Please share only true, respectful news.",
    "আপনার খবর সঙ্গে সঙ্গে প্রকাশিত হবে। শুধু সত্য ও সম্মানজনক খবর দিন।",
    "आपकी ख़बर तुरंत प्रकाशित होगी। कृपया केवल सच्ची और सम्मानजनक ख़बर ही साझा करें।",
    "तपाईंको समाचार तुरुन्तै प्रकाशित हुन्छ। कृपया सत्य र सम्मानजनक समाचार मात्र दिनुहोस्।",
  ],
  goLive: ["Go Live", "লাইভে যান", "लाइव जाएँ", "लाइभ जानुहोस्"],
  watchLive: ["Watch live", "লাইভ দেখুন", "लाइव देखें", "लाइभ हेर्नुहोस्"],
  startBroadcast: ["Start broadcast", "সম্প্রচার শুরু করুন", "प्रसारण शुरू करें", "प्रसारण सुरु गर्नुहोस्"],
  checkingSignIn: [
    "Checking sign-in…",
    "সাইন-ইন যাচাই হচ্ছে…",
    "साइन-इन जाँचा जा रहा है…",
    "साइन-इन जाँच हुँदैछ…",
  ],
  signInToBroadcast: [
    "Sign in to start a broadcast.",
    "সম্প্রচার শুরু করতে সাইন-ইন করুন।",
    "प्रसारण शुरू करने के लिए साइन-इन करें।",
    "प्रसारण सुरु गर्न साइन-इन गर्नुहोस्।",
  ],
  shareScreen: [
    "Share screen or tab",
    "স্ক্রিন বা ট্যাব শেয়ার করুন",
    "स्क्रीन या टैब साझा करें",
    "स्क्रिन वा ट्याब साझा गर्नुहोस्",
  ],
  stopSharingScreen: [
    "Stop screen sharing",
    "স্ক্রিন শেয়ার বন্ধ করুন",
    "स्क्रीन साझा करना बंद करें",
    "स्क्रिन साझेदारी रोक्नुहोस्",
  ],
  screenShareHelp: [
    "Choose the browser tab playing your live video. Enable tab audio in the browser picker if you want viewers to hear it.",
    "আপনার লাইভ ভিডিও চালানো ব্রাউজার ট্যাবটি বেছে নিন। দর্শকদের অডিও শোনাতে ব্রাউজার পিকারে ট্যাব অডিও চালু করুন।",
    "अपना लाइव वीडियो चलाने वाला ब्राउज़र टैब चुनें। दर्शकों को आवाज़ सुनाने के लिए ब्राउज़र पिकर में टैब ऑडियो चालू करें।",
    "तपाईंको लाइभ भिडियो चलिरहेको ब्राउजर ट्याब छान्नुहोस्। दर्शकलाई आवाज सुनाउन ब्राउजर पिकरमा ट्याब अडियो खोल्नुहोस्।",
  ],
  waitingForBroadcaster: [
    "Waiting for a broadcaster…",
    "সম্প্রচারকের অপেক্ষায়…",
    "प्रसारक की प्रतीक्षा में…",
    "प्रसारकलाई पर्खँदै…",
  ],
  socialLiveTitle: [
    "Share a YouTube or Facebook Live link",
    "YouTube বা Facebook Live লিংক শেয়ার করুন",
    "YouTube या Facebook Live लिंक साझा करें",
    "YouTube वा Facebook Live लिङ्क साझा गर्नुहोस्",
  ],
  socialLiveDescription: [
    "Public links appear here for everyone. Only you can replace or remove your link. Embedding depends on the platform and stream privacy settings.",
    "সবার জন্য এখানে পাবলিক লিংক দেখা যাবে। শুধু আপনিই নিজের লিংক বদলাতে বা সরাতে পারবেন। এমবেড প্ল্যাটফর্ম ও স্ট্রিমের গোপনীয়তা সেটিংসের ওপর নির্ভর করে।",
    "सार्वजनिक लिंक यहाँ सभी को दिखेंगे। केवल आप अपना लिंक बदल या हटा सकते हैं। एम्बेड प्लेटफ़ॉर्म और स्ट्रीम की गोपनीयता सेटिंग पर निर्भर करता है।",
    "सार्वजनिक लिङ्कहरू यहाँ सबैले देख्न सक्छन्। तपाईंले मात्र आफ्नो लिङ्क बदल्न वा हटाउन सक्नुहुन्छ। एम्बेड प्लेटफर्म र स्ट्रिमको गोपनीयता सेटिङमा निर्भर हुन्छ।",
  ],
  socialLiveUrlPlaceholder: [
    "Paste a public YouTube Live or Facebook Live URL",
    "একটি পাবলিক YouTube Live বা Facebook Live URL পেস্ট করুন",
    "सार्वजनिक YouTube Live या Facebook Live URL पेस्ट करें",
    "सार्वजनिक YouTube Live वा Facebook Live URL टाँस्नुहोस्",
  ],
  publishSocialLive: [
    "Share link with everyone",
    "সবার সঙ্গে লিংক শেয়ার করুন",
    "सबके साथ लिंक साझा करें",
    "सबैसँग लिङ्क साझा गर्नुहोस्",
  ],
  replaceSocialLive: ["Replace my link", "আমার লিংক বদলান", "मेरा लिंक बदलें", "मेरो लिङ्क बदल्नुहोस्"],
  removeSocialLive: ["Remove my link", "আমার লিংক সরান", "मेरा लिंक हटाएँ", "मेरो लिङ्क हटाउनुहोस्"],
  noSocialLive: [
    "No social live links shared yet.",
    "এখনও কোনো সোশ্যাল লাইভ লিংক শেয়ার করা হয়নি।",
    "अभी तक कोई सोशल लाइव लिंक साझा नहीं किया गया है।",
    "अहिलेसम्म कुनै सामाजिक लाइभ लिङ्क साझा गरिएको छैन।",
  ],
  sharedSocialLive: [
    "Shared social live streams",
    "শেয়ার করা সোশ্যাল লাইভ",
    "साझा किए गए सोशल लाइव",
    "साझा गरिएका सामाजिक लाइभ",
  ],
  socialEmbedNote: [
    "If the player does not load, the broadcaster may have disabled embedding or the stream may be private.",
    "প্লেয়ার লোড না হলে সম্প্রচারক এমবেড বন্ধ করে রাখতে পারেন বা স্ট্রিমটি ব্যক্তিগত হতে পারে।",
    "यदि प्लेयर लोड नहीं होता है, तो प्रसारक ने एम्बेड बंद किया हो सकता है या स्ट्रीम निजी हो सकती है।",
    "प्लेयर लोड नभएमा प्रसारकले एम्बेड बन्द गरेको वा स्ट्रिम निजी हुन सक्छ।",
  ],
  invalidSocialLiveUrl: [
    "Enter a valid public YouTube Live or Facebook Live URL.",
    "একটি বৈধ পাবলিক YouTube Live বা Facebook Live URL দিন।",
    "एक मान्य सार्वजनिक YouTube Live या Facebook Live URL दर्ज करें।",
    "वैध सार्वजनिक YouTube Live वा Facebook Live URL प्रविष्ट गर्नुहोस्।",
  ],
  myNews: ["My News", "আমার খবর", "मेरी ख़बरें", "मेरा समाचार"],
  published: ["stories published", "টি খবর প্রকাশিত", "ख़बरें प्रकाशित", "समाचार प्रकाशित"],
  noPosts: [
    "You haven't published any news yet.",
    "আপনি এখনও কোনো খবর প্রকাশ করেননি।",
    "आपने अभी तक कोई ख़बर प्रकाशित नहीं की।",
    "तपाईंले अहिलेसम्म कुनै समाचार प्रकाशित गर्नुभएको छैन।",
  ],
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
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(KEY, l);
    setLangState(l);
  }, []);
  const t = useCallback((k: string) => translate(lang, k), [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useT = () => useContext(LangCtx);

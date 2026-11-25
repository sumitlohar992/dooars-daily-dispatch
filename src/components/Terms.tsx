import { useEffect, useState } from "react";

const KEY = "dk-terms-2026-11";

export function TermsText() {
  const h = "mt-4 font-display font-extrabold text-primary";
  return (
    <div className="text-sm leading-relaxed">
      <p className="text-xs text-muted-foreground">Last Updated: November 2026</p>
      <p className="mt-2">
        Welcome to Dooars Khabar! By using our news app or website, you agree to these rules.
      </p>
      <h3 className={h}>1. Account & Age</h3>
      <p>
        You must be at least 13 years old to use this app. You are responsible for keeping your
        login account and password safe.
      </p>
      <h3 className={h}>2. News Content Disclaimer</h3>
      <p>
        We work hard to provide true and accurate news, but we cannot guarantee that every story or
        user submission is 100% accurate at all times. Opinions expressed by contributors or guest
        writers belong to them, not the app.
      </p>
      <h3 className={h}>3. Rules for User Content (Posting & Comments)</h3>
      <p>
        When you post news tips, articles, photos, or comments, you grant us permission to publish
        and display your content on our platform.
      </p>
      <p>
        <b>Prohibited:</b> No fake news, hate speech, violent content, harassment, or copyright
        infringement. We reserve the right to delete any post or block any user who breaks these
        rules.
      </p>
      <h3 className={h}>4. Partner Program & Payouts (For Creators)</h3>
      <p>
        If you join our Revenue Sharing program, you must follow our Monetization Policy. Using
        bots, fake views, or click-farms will lead to instant account ban and loss of earnings.
      </p>
      <h3 className={h}>5. Ownership & Copyright</h3>
      <p>
        Our logo, app design, and original news content belong to Dooars Khabar. You may share
        article links, but you cannot copy-paste and sell our full content without permission.
      </p>
      <h3 className={h}>6. Liability Limit</h3>
      <p>
        We are not responsible for decisions, losses, or actions you take based on the news stories
        read on this app.
      </p>
      <h3 className={h}>7. Changes & Contact</h3>
      <p>We may update these terms from time to time.</p>
      <p>Governing Law: Governed by the laws of West Bengal, India.</p>
      <p>
        Contact Email:{" "}
        <a className="text-primary underline" href="mailto:sumitlohar992@gmail.com">
          sumitlohar992@gmail.com
        </a>
      </p>
    </div>
  );
}

export function TermsGate() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background">
      <div className="bg-brand px-5 py-4 text-primary-foreground">
        <h2 className="font-display text-xl font-black">Terms and Conditions</h2>
        <p className="text-xs opacity-80">Please read and accept to continue</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="mx-auto max-w-xl pt-4">
          <TermsText />
        </div>
      </div>
      <div className="border-t bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          onClick={() => {
            localStorage.setItem(KEY, new Date().toISOString());
            setShow(false);
          }}
          className="mx-auto block h-12 w-full max-w-xl rounded-full bg-primary font-bold text-primary-foreground"
        >
          I agree — continue
        </button>
      </div>
    </div>
  );
}

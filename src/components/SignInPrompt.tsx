import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

export function SignInPrompt({ message }: { message: string }) {
  return (
    <div className="m-4 rounded-2xl border bg-card p-8 text-center shadow-card">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-soft text-primary">
        <LogIn className="h-6 w-6" />
      </div>
      <p className="mt-4 font-semibold">{message}</p>
      <Link
        to="/auth"
        className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
      >
        Sign in
      </Link>
    </div>
  );
}

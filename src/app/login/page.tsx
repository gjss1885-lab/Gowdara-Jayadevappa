import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log In" };

// LoginForm reads the ?redirect_to= query param via useSearchParams, which
// Next.js requires to be wrapped in Suspense so the rest of the page can
// still be prerendered instead of the whole route falling back to
// client-only rendering.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

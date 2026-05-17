import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");
  const githubOAuthConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={async () => {
          "use server";
          if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
            throw new Error("GitHub OAuth is not configured.");
          }
          await signIn("github", { redirectTo: "/dashboard" });
        }}
        className="w-full max-w-md rounded-2xl border bg-white/70 p-8 backdrop-blur dark:bg-white/5"
      >
        <h1 className="text-2xl font-semibold">Welcome to CodePilot AI</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Sign in with GitHub to start automated PR reviews.</p>
        {!githubOAuthConfigured ? (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            GitHub OAuth is not configured. Set <code>GITHUB_CLIENT_ID</code> and <code>GITHUB_CLIENT_SECRET</code> in <code>.env</code>, then restart the dev server.
          </p>
        ) : null}
        <button
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
          type="submit"
          disabled={!githubOAuthConfigured}
        >
          Continue with GitHub
        </button>
      </form>
    </main>
  );
}

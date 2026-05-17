import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    desc: "For solo developers and indie teams",
    features: ["50 PR reviews / month", "Repository sync", "AI score + findings", "Email notifications"],
  },
  {
    name: "Growth",
    price: "$99",
    desc: "For scaling product teams",
    features: ["300 PR reviews / month", "Team workspace", "Priority review queue", "Advanced analytics"],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "$299",
    desc: "For org-wide engineering teams",
    features: ["Unlimited PR reviews", "SLA + dedicated support", "Custom policy rules", "Enterprise onboarding"],
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="glass rounded-3xl p-8 md:p-12">
        <h1 className="text-5xl">Pricing That Scales With Your Team</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">Choose a plan that matches your PR volume and review depth needs.</p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`rounded-2xl border p-6 ${plan.highlighted ? "glass ring-2 ring-cyan-500/40" : "glass"}`}>
            <h2 className="text-2xl">{plan.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{plan.desc}</p>
            <p className="mt-4 text-4xl">{plan.price}</p>
            <p className="text-xs text-slate-500">per month</p>

            <ul className="mt-5 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <Check size={14} className="text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/login" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-white dark:bg-white dark:text-slate-900">
              Start {plan.name}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

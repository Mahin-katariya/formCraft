"use client";

import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="bg-page font-sans min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-border-card bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-4.5 h-4.5 text-white">
                <path d="M160.8 96.5c14 17 31 30.9 49.5 42.2c25.9 15.8 56.2 27.1 89.8 27.1c34.1 0 56.4-9.5 76.1-18.6l.2-.1c19-8.8 36.7-17 59.6-17c35.3 0 66.3 20.3 82.4 38.1c8 8.8 13.8 17.6 17.4 24.2c1.8 3.3 3.1 6.1 3.9 8.2c.4 1 .7 1.8 .8 2.3l.2 .6 0 .2 0 .1 0 0 0 0s0 0-39.9 12.1l39.9-12.1c4.1 13.4-.6 27.8-11.6 35.8L384 288l-66.7 53.3L256 448l-56-64-64 32-48-80L0 304l96-112 32-48 32.8-40.5zM256 192a32 32 0 1 0 0-64 32 32 0 1 0 0 64z" />
              </svg>
            </div>
            <span className="font-bold text-heading text-lg tracking-tight">
              PigeonForm
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-sm font-bold text-body hover:text-heading transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/auth"
              className="pill-button dark-btn px-5 py-2 font-bold text-sm"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl font-bold text-heading mb-3 tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-base text-body max-w-lg mx-auto">
          Start free. Upgrade when you need more.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Free */}
          <div className="bg-surface rounded-2xl border border-border-card p-7 flex flex-col">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-body uppercase tracking-widest mb-2">
                Free
              </h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-heading">$0</span>
                <span className="text-sm text-body">/mo</span>
              </div>
              <p className="text-xs text-body">Perfect for trying things out</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <PricingFeature>3 forms</PricingFeature>
              <PricingFeature>100 responses / month</PricingFeature>
              <PricingFeature>10 fields per form</PricingFeature>
              <PricingFeature>Basic analytics</PricingFeature>
              <PricingFeature>CSV export</PricingFeature>
            </ul>
            <Link
              href="/auth"
              className="pill-button text-center font-bold text-sm px-6 py-3 border border-border-card text-body hover:text-heading transition-colors"
            >
              Get started
            </Link>
          </div>

          {/* Pro — highlighted */}
          <div className="bg-surface rounded-2xl border-2 border-accent p-7 flex flex-col relative shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-accent px-3 py-0.5 rounded-full">
              Most popular
            </span>
            <div className="mb-6">
              <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-2">
                Pro
              </h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-heading">$19</span>
                <span className="text-sm text-body">/mo</span>
              </div>
              <p className="text-xs text-body">For growing teams & creators</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <PricingFeature>Unlimited forms</PricingFeature>
              <PricingFeature>10,000 responses / month</PricingFeature>
              <PricingFeature>Unlimited fields</PricingFeature>
              <PricingFeature>Conditional logic</PricingFeature>
              <PricingFeature>Advanced analytics</PricingFeature>
              <PricingFeature>Priority support</PricingFeature>
            </ul>
            <Link
              href="/auth"
              className="pill-button dark-btn text-center font-bold text-sm px-6 py-3"
            >
              Start free trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-surface rounded-2xl border border-border-card p-7 flex flex-col">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-body uppercase tracking-widest mb-2">
                Enterprise
              </h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-heading">Custom</span>
              </div>
              <p className="text-xs text-body">For large organizations</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <PricingFeature>Everything in Pro</PricingFeature>
              <PricingFeature>Unlimited responses</PricingFeature>
              <PricingFeature>SSO & team management</PricingFeature>
              <PricingFeature>Custom branding</PricingFeature>
              <PricingFeature>Dedicated support</PricingFeature>
              <PricingFeature>SLA guarantee</PricingFeature>
            </ul>
            <a
              href="mailto:hello@pigeonform.com"
              className="pill-button text-center font-bold text-sm px-6 py-3 border border-border-card text-body hover:text-heading transition-colors"
            >
              Contact sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-card bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-3 h-3 text-white">
                <path d="M160.8 96.5c14 17 31 30.9 49.5 42.2c25.9 15.8 56.2 27.1 89.8 27.1c34.1 0 56.4-9.5 76.1-18.6l.2-.1c19-8.8 36.7-17 59.6-17c35.3 0 66.3 20.3 82.4 38.1c8 8.8 13.8 17.6 17.4 24.2c1.8 3.3 3.1 6.1 3.9 8.2c.4 1 .7 1.8 .8 2.3l.2 .6 0 .2 0 .1 0 0 0 0s0 0-39.9 12.1l39.9-12.1c4.1 13.4-.6 27.8-11.6 35.8L384 288l-66.7 53.3L256 448l-56-64-64 32-48-80L0 304l96-112 32-48 32.8-40.5zM256 192a32 32 0 1 0 0-64 32 32 0 1 0 0 64z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-heading">PigeonForm</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xs text-body hover:text-heading transition-colors">
              Home
            </Link>
            <Link href="/auth" className="text-xs text-body hover:text-heading transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-body">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent mt-0.5 shrink-0">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
      </svg>
      {children}
    </li>
  );
}

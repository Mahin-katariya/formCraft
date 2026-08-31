"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  return (
    <div className="bg-page font-sans min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-border-card bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md">
              <DoveIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-heading text-lg tracking-tight">
              PigeonForm
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-body hover:text-heading transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-body hover:text-heading transition-colors">
              How it works
            </a>
            <Link href="/pricing" className="text-sm font-medium text-body hover:text-heading transition-colors">
              Pricing
            </Link>
          </div>
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

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="animate-fade-in-up">
          <span className="inline-block text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-widest mb-6">
            Now in beta
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-heading leading-tight mb-5 tracking-tight">
            Build forms that people
            <br />
            <span className="font-serif italic text-accent">actually enjoy</span> filling out
          </h1>
          <p className="text-lg text-body max-w-xl mx-auto mb-10 leading-relaxed">
            Create beautiful, smart forms with conditional logic, real-time
            analytics, and instant sharing. No coding required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth"
              className="pill-button dark-btn px-8 py-3.5 font-bold text-sm"
            >
              Get started free
            </Link>
            <a
              href="#features"
              className="pill-button px-8 py-3.5 font-bold text-sm border border-border-card text-body hover:text-heading transition-colors"
            >
              See features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-3">
            Everything you need to collect data
          </h2>
          <p className="text-sm text-body max-w-lg mx-auto">
            From simple contact forms to complex surveys with branching logic.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={<FieldsIcon />}
            title="10 field types"
            description="Text, email, phone, URL, date, number, rating, single select, multi select, and more."
          />
          <FeatureCard
            icon={<BranchIcon />}
            title="Conditional logic"
            description="Show or hide fields based on previous answers. Build smart, dynamic forms."
          />
          <FeatureCard
            icon={<ChartIcon />}
            title="Real-time analytics"
            description="Track visits, completions, drop-offs, and per-field answer distributions."
          />
          <FeatureCard
            icon={<ShareIcon />}
            title="Instant sharing"
            description="Publish with one click and share via a clean, unique link. No embed needed."
          />
          <FeatureCard
            icon={<ShieldIcon />}
            title="Validation built-in"
            description="Required fields, format checks, and response limits — all enforced server-side."
          />
          <FeatureCard
            icon={<DownloadIcon />}
            title="CSV export"
            description="Download all your responses as a spreadsheet with one click. Your data, your way."
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-surface border-y border-border-card">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-3">
              Three steps. That&apos;s it.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Create"
              description="Add fields, set requirements, and configure conditional logic with the visual editor."
            />
            <StepCard
              number="2"
              title="Share"
              description="Publish your form and copy the link. Send it anywhere — email, social, Slack."
            />
            <StepCard
              number="3"
              title="Analyze"
              description="Watch responses roll in. View analytics, field distributions, and export to CSV."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-4">
          Ready to build your first form?
        </h2>
        <p className="text-sm text-body mb-8 max-w-md mx-auto">
          Join PigeonForm and start collecting responses in minutes. Free forever
          for small teams.
        </p>
        <Link
          href="/auth"
          className="pill-button dark-btn px-8 py-3.5 font-bold text-sm inline-block"
        >
          Get started free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-card bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center">
              <DoveIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-heading">PigeonForm</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-xs text-body hover:text-heading transition-colors">
              Pricing
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border-card p-6 hover:shadow-md transition-all duration-300">
      <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mb-4 text-accent">
        {icon}
      </div>
      <h3 className="text-base font-bold text-heading mb-1.5">{title}</h3>
      <p className="text-sm text-body leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-md">
        {number}
      </div>
      <h3 className="text-lg font-bold text-heading mb-2">{title}</h3>
      <p className="text-sm text-body leading-relaxed max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );
}

function DoveIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className={className}>
      <path d="M160.8 96.5c14 17 31 30.9 49.5 42.2c25.9 15.8 56.2 27.1 89.8 27.1c34.1 0 56.4-9.5 76.1-18.6l.2-.1c19-8.8 36.7-17 59.6-17c35.3 0 66.3 20.3 82.4 38.1c8 8.8 13.8 17.6 17.4 24.2c1.8 3.3 3.1 6.1 3.9 8.2c.4 1 .7 1.8 .8 2.3l.2 .6 0 .2 0 .1 0 0 0 0s0 0-39.9 12.1l39.9-12.1c4.1 13.4-.6 27.8-11.6 35.8L384 288l-66.7 53.3L256 448l-56-64-64 32-48-80L0 304l96-112 32-48 32.8-40.5zM256 192a32 32 0 1 0 0-64 32 32 0 1 0 0 64z" />
    </svg>
  );
}

function FieldsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d=".99 5.24A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25l.01 9.5A2.25 2.25 0 0 1 16.76 17H3.26A2.25 2.25 0 0 1 1 14.75l-.01-9.5Zm8.26 9.52v-3.5l-2.25.01a.75.75 0 0 1 0-1.5l2.25-.01v-3.5a.75.75 0 0 1 1.5 0v3.5l2.25-.01a.75.75 0 0 1 0 1.5l-2.25.01v3.5a.75.75 0 0 1-1.5 0Z" clipRule="evenodd" />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M5.404 14.596A6.5 6.5 0 1 1 16.5 10a1.25 1.25 0 0 1-2.5 0 4 4 0 1 0-.571 2.06A2.75 2.75 0 0 0 18 10a6.5 6.5 0 0 0-6.5-6.5 6.5 6.5 0 0 0-6.096 11.096ZM10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" clipRule="evenodd" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM10 6a1.5 1.5 0 0 0-1.5 1.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 10 6ZM4.5 10A1.5 1.5 0 0 0 3 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 4.5 10Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .799l6.733 3.37a2.5 2.5 0 1 1-.671 1.341l-6.733-3.37a2.5 2.5 0 1 1 0-3.475l6.733-3.37A2.52 2.52 0 0 1 13 4.5Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.59 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.564 2 12.163 2 7c0-.538.035-1.069.104-1.589a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.75Zm4.196 5.954a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
      <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
    </svg>
  );
}

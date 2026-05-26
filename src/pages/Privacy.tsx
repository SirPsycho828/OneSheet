import { LandingNav } from "../components/layout/LandingNav";

export function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNav />
      <main className="flex-1 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-6">
            Privacy Policy
          </h1>
          <div className="prose prose-gray max-w-none text-muted-foreground leading-relaxed space-y-4">
            <p>
              <strong>Last updated: May 2025</strong>
            </p>
            <p>
              OneSheet ("we", "us", or "our") is committed to protecting your
              personal information. This Privacy Policy explains what data we
              collect, how we use it, and your rights with respect to that data.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Data We Collect
            </h2>
            <p>
              We collect information you provide directly, such as your email
              address, name, and resume content. We use Firebase (Google) for
              authentication and database storage. When you upgrade to Pro, we
              use Stripe to process payments. We do not store your payment card
              information on our servers.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              How We Use Your Data
            </h2>
            <p>
              Your data is used solely to provide the OneSheet service: storing
              and rendering your resume, generating PDFs, and serving your public
              profile page. We do not sell your data or use it for advertising.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Third-Party Services
            </h2>
            <p>
              OneSheet relies on Firebase (authentication and storage) and
              Stripe (payment processing). These services have their own privacy
              policies. We encourage you to review them.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Your Rights
            </h2>
            <p>
              You may request deletion of your account and all associated data
              at any time by contacting us. Upon request, we will delete your
              account and resume data within 30 days.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Contact
            </h2>
            <p>
              Questions about this policy? Email us at{" "}
              <a
                href="mailto:privacy@onesheet.cv"
                className="text-primary hover:underline"
              >
                privacy@onesheet.cv
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

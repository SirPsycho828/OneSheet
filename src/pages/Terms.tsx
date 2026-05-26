import { LandingNav } from "../components/layout/LandingNav";

export function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNav />
      <main className="flex-1 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-6">
            Terms of Service
          </h1>
          <div className="prose prose-gray max-w-none text-muted-foreground leading-relaxed space-y-4">
            <p>
              <strong>Last updated: May 2025</strong>
            </p>
            <p>
              By using OneSheet ("the Service"), you agree to these Terms of
              Service. Please read them carefully.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Acceptable Use
            </h2>
            <p>
              You may use OneSheet to create and share professional resume
              content. You agree not to use the Service to post content that is
              unlawful, harmful, defamatory, or that infringes the rights of
              others. We reserve the right to remove content or suspend accounts
              that violate this policy.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Your Content
            </h2>
            <p>
              You retain ownership of the resume content you create on OneSheet.
              By making your profile public, you grant OneSheet a limited
              license to display and serve that content to visitors of your
              public profile URL.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Paid Plans
            </h2>
            <p>
              Pro plan subscriptions are billed monthly via Stripe. You may
              cancel at any time; your Pro features will remain active until the
              end of the current billing period. Refunds are handled on a
              case-by-case basis. Contact us within 7 days of a charge if you
              believe there was an error.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Limitation of Liability
            </h2>
            <p>
              OneSheet is provided "as is" without warranties of any kind. We
              are not liable for any loss of data, revenue, or other damages
              arising from your use of the Service. Our total liability for any
              claim is limited to the amount you paid us in the 12 months
              preceding the claim.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. We will notify you of
              material changes via email or an in-app notice. Continued use of
              the Service after changes take effect constitutes acceptance.
            </p>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-2">
              Contact
            </h2>
            <p>
              Questions? Email us at{" "}
              <a
                href="mailto:hello@onesheet.cv"
                className="text-primary hover:underline"
              >
                hello@onesheet.cv
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

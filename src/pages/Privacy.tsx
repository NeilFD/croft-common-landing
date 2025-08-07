import PageLayout from '@/components/PageLayout';

const Privacy = () => {
  return (
    <PageLayout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <h1 className="font-brutalist text-4xl md:text-5xl mb-8 text-center">
            PRIVACY POLICY
          </h1>
          
          <div className="space-y-8 font-industrial leading-relaxed">
            <section>
              <h2 className="font-brutalist text-2xl mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                When you subscribe to our newsletter or use our services, we may collect:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your name and email address</li>
                <li>Information about your interactions with our website</li>
                <li>Technical information such as IP address and browser type</li>
                <li>Event participation and booking information</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">
                We use your information to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Send you our newsletter and updates about events</li>
                <li>Provide access to The Common Room exclusive content</li>
                <li>Improve our services and user experience</li>
                <li>Communicate with you about your bookings or inquiries</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">3. Legal Basis for Processing</h2>
              <p className="mb-4">
                We process your personal data based on:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your consent when you subscribe to our newsletter</li>
                <li>Legitimate interests in providing and improving our services</li>
                <li>Contractual necessity when you make bookings</li>
                <li>Legal obligations where required</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">4. Data Sharing</h2>
              <p className="mb-4">
                We do not sell your personal data. We may share your information with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Service providers who help us operate our business (email service providers, analytics)</li>
                <li>Legal authorities when required by law</li>
                <li>Professional advisors in connection with legal or business matters</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">5. Your Rights</h2>
              <p className="mb-4">
                Under GDPR and UK data protection law, you have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request restriction of processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">6. Data Retention</h2>
              <p>
                We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, 
                or as required by law. Newsletter subscribers' data is retained until they unsubscribe.
              </p>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">7. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal data against 
                unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">8. Cookies</h2>
              <p>
                Our website uses essential cookies to function properly. We do not use tracking or advertising cookies 
                without your explicit consent.
              </p>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">9. Third-Party Services</h2>
              <p className="mb-4">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email service providers for newsletter delivery</li>
                <li>Analytics services to improve our website</li>
                <li>Payment processors for transactions</li>
              </ul>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">10. International Transfers</h2>
              <p>
                Some of our service providers may be located outside the UK/EU. We ensure appropriate safeguards 
                are in place for any international data transfers.
              </p>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">11. Updates to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. Any changes will be posted on this page 
                with an updated effective date.
              </p>
            </section>

            <section>
              <h2 className="font-brutalist text-2xl mb-4">12. Contact Us</h2>
              <div className="bg-surface p-6 rounded-lg">
                <p className="mb-2"><strong>Data Controller:</strong> Croft Common Ltd</p>
                <p className="mb-2"><strong>Address:</strong> 22 Stokes Croft, Bristol BS1 3PR</p>
                <p className="mb-2"><strong>Email:</strong> privacy@croftcommon.co.uk</p>
                <p className="mb-4">
                  If you have any questions about this privacy policy or wish to exercise your rights, 
                  please contact us using the details above.
                </p>
                <p className="text-sm text-foreground/70">
                  You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) 
                  if you believe your data protection rights have been breached.
                </p>
              </div>
            </section>

            <section className="text-center pt-8 border-t border-surface">
              <p className="text-sm text-foreground/70">
                <strong>Effective Date:</strong> January 1, 2024<br />
                <strong>Last Updated:</strong> January 1, 2024
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Privacy;
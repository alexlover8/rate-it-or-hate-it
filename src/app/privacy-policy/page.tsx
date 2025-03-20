// src/app/privacy-policy/page.tsx
export const metadata = {
    title: "Privacy Policy - Rate It or Hate It",
    description: "Learn about how Rate It or Hate It collects, uses, and protects your data.",
  };
  
  export default function PrivacyPolicy() {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4">
          Rate It or Hate It (“we”, “us”, “our”) values your privacy. This Privacy Policy explains how we collect, use, and share your information when you access and use our website and services.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Information We Collect</h2>
        <p className="mb-4">
          We may collect personal data such as your name and email address during registration, as well as information about your interactions on our site. We also gather aggregated usage data to improve our services.
        </p>
        <h2 className="text-2xl font-semibold mb-2">How We Use Your Information</h2>
        <p className="mb-4">
          Your information is used to personalize your experience, provide customer support, and enhance our platform. We also use aggregated data for analytics and research to help drive our monetization efforts.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Your Rights</h2>
        <p className="mb-4">
          You have the right to access, update, or delete your personal data. For any concerns, please contact us at support@rateithateit.com.
        </p>
        <p className="mt-6">
          Note that this policy is subject to change. Please review it periodically.
        </p>
      </main>
    );
  }
  
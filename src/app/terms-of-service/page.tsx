// src/app/terms-of-service/page.tsx
export const metadata = {
    title: "Terms of Service - Rate It or Hate It",
    description: "Read the terms that govern your use of Rate It or Hate It.",
  };
  
  export default function TermsOfService() {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="mb-4">
          Welcome to Rate It or Hate It. By using our website and services, you agree to these Terms of Service. If you do not agree, please refrain from using our platform.
        </p>
        <h2 className="text-2xl font-semibold mb-2">User Responsibilities</h2>
        <p className="mb-4">
          You agree to use our platform in a lawful manner and to respect the rights of others. Any misuse of our services is prohibited.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Content Ownership</h2>
        <p className="mb-4">
          All user-generated content remains your property. However, by submitting content, you grant us a non-exclusive, worldwide license to use, display, and distribute it on our platform.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Limitation of Liability</h2>
        <p className="mb-4">
          We are not liable for any direct, indirect, or incidental damages resulting from your use of our services.
        </p>
        <p className="mt-6">
          These terms may be updated periodically. It is your responsibility to review them regularly.
        </p>
      </main>
    );
  }
  
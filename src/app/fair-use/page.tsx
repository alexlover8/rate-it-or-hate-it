// src/app/fair-use/page.tsx
export const metadata = {
    title: "Fair Use Policy - Rate It or Hate It",
    description: "Read our Fair Use Policy regarding the acceptable use of content on our platform.",
  };
  
  export default function FairUsePolicy() {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Fair Use Policy</h1>
        <p className="mb-4">
          Our Fair Use Policy outlines the guidelines for using content on Rate It or Hate It. This ensures that the content is used in a way that is fair and respectful.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Usage Guidelines</h2>
        <p className="mb-4">
          You may use the content on our site for personal, non-commercial purposes. Any mass reproduction or commercial use of content without prior permission is prohibited.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Reporting Violations</h2>
        <p className="mb-4">
          If you believe that any content violates our Fair Use Policy, please report it immediately so that we can investigate.
        </p>
        <p className="mt-6">
          This policy is subject to periodic review. For questions, contact support@rateithateit.com.
        </p>
      </main>
    );
  }
  
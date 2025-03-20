// src/app/cookie-policy/page.tsx
export const metadata = {
    title: "Cookie Policy - Rate It or Hate It",
    description: "Understand how Rate It or Hate It uses cookies to improve your experience.",
  };
  
  export default function CookiePolicy() {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
        <p className="mb-4">
          We use cookies to enhance your browsing experience, analyze traffic, and improve our services. This policy explains the types of cookies we use and how you can control them.
        </p>
        <h2 className="text-2xl font-semibold mb-2">What Are Cookies?</h2>
        <p className="mb-4">
          Cookies are small text files stored on your device that help our site remember your preferences and track your activity.
        </p>
        <h2 className="text-2xl font-semibold mb-2">How We Use Cookies</h2>
        <p className="mb-4">
          We use cookies for authentication, to analyze site usage, and to personalize content and ads. These cookies do not collect personal data unless you voluntarily provide it.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Your Choices</h2>
        <p className="mb-4">
          You can disable cookies via your browser settings; however, this may affect your user experience and some functionalities of our site.
        </p>
        <p className="mt-6">
          For more information, or if you have any concerns, please contact support@rateithateit.com.
        </p>
      </main>
    );
  }
  
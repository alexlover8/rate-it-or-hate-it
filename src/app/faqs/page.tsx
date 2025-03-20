// src/app/faqs/page.tsx
export const metadata = {
    title: "FAQs - Rate It or Hate It",
    description: "Frequently Asked Questions about Rate It or Hate It.",
  };
  
  export default function FAQs() {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions (FAQs)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">General Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">What is Rate It or Hate It?</h3>
              <p>
                Rate It or Hate It is a community-driven platform where users express their opinions by rating items as “Rate It,” “Meh,” or “Hate It.”
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">Who can use the platform?</h3>
              <p>
                Anyone can browse the site. To add items or vote, you need to register and log in.
              </p>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Account & Privacy</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">How do I create an account?</h3>
              <p>
                Click the "Sign Up" button on the homepage and follow the registration process.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">How is my data protected?</h3>
              <p>
                We employ robust security measures to safeguard your data. For details, please refer to our Privacy Policy.
              </p>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Usage & Content</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">Can I edit or delete my posts?</h3>
              <p>
                Yes, you can edit or delete your posts via your profile page.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-medium">What if I see inappropriate content?</h3>
              <p>
                Please use our report feature to notify us, and we will review the content promptly.
              </p>
            </div>
          </div>
        </section>
        
        <p className="mt-6">
          For further questions, contact support@rateithateit.com.
        </p>
      </main>
    );
  }
  
import { useState } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="py-16 bg-primary-50 border-t border-primary-100">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-primary-200 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-primary-700" />
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary-900">
            Join Our Community
          </h2>
          <p className="text-sm md:text-base text-primary-600 mt-3 mb-8">
            Subscribe for wellness tips, new arrivals, and exclusive offers. Get 10% off your first order.
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-sage-700 animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Thank you for subscribing! Check your email for the discount code.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 bg-white border border-primary-200 rounded-sm px-4 py-3 text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-sm font-medium text-sm tracking-wide hover:bg-primary-700 transition-colors"
              >
                Subscribe
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

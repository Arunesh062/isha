import { ArrowRight } from 'lucide-react';

interface PromoBannerProps {
  onNavigate: (page: string) => void;
}

export default function PromoBanner({ onNavigate }: PromoBannerProps) {
  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="relative rounded-sm overflow-hidden bg-gradient-to-br from-sage-800 to-sage-950">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8 md:p-12 lg:p-16 text-white">
              <span className="text-accent-300 text-sm tracking-[0.15em] uppercase font-medium">
                Limited Time Offer
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mt-3 leading-tight">
                Wellness Bundle Sale
              </h2>
              <p className="text-sage-100 mt-4 text-sm md:text-base leading-relaxed max-w-md">
                Save up to 25% on selected herbal supplements, natural foods, and body care products. Bring home the goodness of nature at special prices.
              </p>
              <div className="flex items-center gap-6 mt-6">
                <div>
                  <div className="font-serif text-3xl font-bold text-accent-300">25%</div>
                  <div className="text-xs text-sage-200 uppercase tracking-wide">Up to Off</div>
                </div>
                <div className="w-px h-12 bg-sage-600" />
                <div>
                  <div className="font-serif text-3xl font-bold text-accent-300">Free</div>
                  <div className="text-xs text-sage-200 uppercase tracking-wide">Shipping above ₹999</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('shop:food-wellness')}
                className="group inline-flex items-center gap-2 bg-white text-sage-800 px-7 py-3.5 rounded-sm font-medium text-sm tracking-wide hover:bg-accent-300 transition-all duration-200 hover:gap-3 mt-8"
              >
                Shop the Sale
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            <div className="relative h-64 md:h-96">
              <img
                src="https://images.pexels.com/photos/6694156/pexels-photo-6694156.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Natural wellness products"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-sage-950/40 to-transparent md:bg-gradient-to-r md:from-sage-950/20 md:to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

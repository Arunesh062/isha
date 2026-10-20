import { useEffect, useState } from 'react';
import { ArrowRight, Leaf } from 'lucide-react';

interface HeroProps {
  onShopNow: () => void;
}

const slides = [
  {
    eyebrow: 'Inspired by Yogic Wisdom',
    title: 'Holistic Living,\nRooted in Tradition',
    description: 'Discover natural foods, yoga essentials, body care, and sacred items — crafted with care for your wellbeing.',
    cta: 'Shop All Products',
    ctaTarget: 'shop:all',
    image: 'https://images.pexels.com/photos/4457921/pexels-photo-4457921.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    eyebrow: 'New Arrivals',
    title: 'Pure Copper\nFor Daily Wellness',
    description: 'Handcrafted copper vessels that bring the ancient wisdom of Ayurveda into your everyday life.',
    cta: 'Explore Copperware',
    ctaTarget: 'shop:copperware',
    image: 'https://images.pexels.com/photos/33888100/pexels-photo-33888100.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    eyebrow: 'Natural & Chemical-Free',
    title: 'Body Care\nFrom the Earth',
    description: 'Nourish your skin with organic, chemical-free products made from natural ingredients and essential oils.',
    cta: 'Shop Body Care',
    ctaTarget: 'shop:body-care',
    image: 'https://images.pexels.com/photos/14438270/pexels-photo-14438270.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
];

export default function Hero({ onShopNow }: HeroProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative h-[500px] sm:h-[560px] md:h-[640px] overflow-hidden">
      {/* Background images */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/70 via-primary-900/50 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full container-custom flex items-center">
        <div className="max-w-xl text-white animate-fade-up" key={current}>
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-5 h-5 text-accent-300" />
            <span className="text-accent-200 text-sm tracking-[0.15em] uppercase font-medium">
              {slide.eyebrow}
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight whitespace-pre-line mb-4">
            {slide.title}
          </h1>
          <p className="text-base sm:text-lg text-cream/90 mb-8 max-w-md leading-relaxed">
            {slide.description}
          </p>
          <button
            onClick={() => onShopNow()}
            className="group inline-flex items-center gap-2 bg-white text-primary-900 px-7 py-3.5 rounded-sm font-medium text-sm tracking-wide hover:bg-accent-300 transition-all duration-200 hover:gap-3"
          >
            {slide.cta}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-accent-300' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

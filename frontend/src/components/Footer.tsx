import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const linkColumns = [
    {
      title: 'Shop',
      links: [
        { label: 'Food & Wellness', target: 'shop:food-wellness' },
        { label: 'Yoga & Meditation', target: 'shop:yoga' },
        { label: 'Body Care', target: 'shop:body-care' },
        { label: 'Copperware', target: 'shop:copperware' },
        { label: 'Sacred & Spiritual', target: 'shop:sacred' },
        { label: 'Books & Wisdom', target: 'shop:books' },
      ],
    },
    {
      title: 'Customer Support',
      links: [
        { label: 'Track Your Order', target: 'orders' },
        { label: 'Shipping & Delivery', target: 'shipping' },
        { label: 'Returns & Refunds', target: 'returns' },
        { label: 'FAQs', target: 'faq' },
        { label: 'Contact Us', target: 'contact' },
        { label: 'Store Locator', target: 'stores' },
      ],
    },
    {
      title: 'About',
      links: [
        { label: 'About Isha Life', target: 'about' },
        { label: 'Our Story', target: 'story' },
        { label: 'Blog', target: 'blog' },
        { label: 'Privacy Policy', target: 'privacy' },
        { label: 'Terms of Service', target: 'terms' },
        { label: 'Bulk Orders', target: 'bulk' },
      ],
    },
  ];

  return (
    <footer className="bg-primary-950 text-cream">
      {/* Main footer */}
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-xs">
                <span className="font-serif text-white text-xl font-bold">I</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-2xl font-bold text-cream leading-none">Isha</span>
                  <span className="text-[9px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-700">Demo</span>
                </div>
                <div className="text-[10px] tracking-[0.2em] text-primary-300 uppercase">Life</div>
              </div>
            </div>
            <p className="text-sm text-primary-200 leading-relaxed max-w-sm mb-6">
              Bringing yogic wisdom into your everyday life. From natural foods and yoga essentials to body care and sacred items — crafted with care for your holistic wellbeing.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-primary-200">
                <Phone className="w-4 h-4 mt-0.5 text-accent-400 shrink-0" />
                <span>8010 479480 (Mon–Sat, 10AM–5PM IST)</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-primary-200">
                <Mail className="w-4 h-4 mt-0.5 text-accent-400 shrink-0" />
                <span>support@ishalife.com</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-primary-200">
                <MapPin className="w-4 h-4 mt-0.5 text-accent-400 shrink-0" />
                <span>Isha Life Wellness Center, Coimbatore, Tamil Nadu, India</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-primary-200">
                <Clock className="w-4 h-4 mt-0.5 text-accent-400 shrink-0" />
                <span>Online support: Mon–Sat, 10:00 AM – 5:00 PM IST</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-primary-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
                  aria-label="Social media"
                >
                  <Icon className="w-4 h-4 text-cream" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {linkColumns.map((col) => (
            <div key={col.title}>
              <h4 className="font-serif text-base font-semibold text-cream mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => onNavigate(link.target)}
                      className="text-sm text-primary-200 hover:text-accent-300 transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Unofficial Demo Disclaimer Box */}
          <div className="lg:col-span-5 pt-4">
            <div className="bg-primary-900/70 border border-primary-800 rounded-sm p-4 text-xs text-primary-200 leading-relaxed">
              <strong className="text-cream font-medium">Independent Demonstration Notice:</strong> This website is an independent, unofficial technology and e-commerce demonstration project. It is not affiliated with, endorsed by, sponsored by, or authorized to represent Isha Life, Isha Foundation, or their affiliates. All trademarks, product names, and brand references are the property of their respective owners.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-800">
        <div className="container-custom py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-300">
            © {new Date().getFullYear()} Isha Life Demonstration (Unofficial). All rights reserved. For Conscious Living.
          </p>
          <div className="flex items-center gap-4 text-xs text-primary-300">
            <span>Secure Payments</span>
            <span className="w-1 h-1 rounded-full bg-primary-500" />
            <span>COD Available</span>
            <span className="w-1 h-1 rounded-full bg-primary-500" />
            <span>Pan-India Shipping</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

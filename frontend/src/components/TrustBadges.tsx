import { ShieldCheck, Sprout, HandHeart, Recycle } from 'lucide-react';

const badges = [
  {
    icon: ShieldCheck,
    title: '100% Authentic',
    description: 'Genuine products from trusted sources',
  },
  {
    icon: Sprout,
    title: 'Inspired by Yogic Wisdom',
    description: 'Rooted in ancient traditions',
  },
  {
    icon: HandHeart,
    title: 'Traditional Craftsmanship',
    description: 'Handcrafted by skilled artisans',
  },
  {
    icon: Recycle,
    title: 'Eco Friendly',
    description: 'Sustainable & natural materials',
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-white border-y border-primary-100">
      <div className="container-custom py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-sage-50 flex items-center justify-center shrink-0">
                <badge.icon className="w-6 h-6 text-sage-600" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-primary-900 leading-tight">
                  {badge.title}
                </h3>
                <p className="text-xs text-primary-500 mt-1">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

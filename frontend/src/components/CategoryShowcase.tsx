import { ArrowRight } from 'lucide-react';
import { useCatalogue } from '@/store/CatalogueContext';

interface CategoryShowcaseProps {
  onNavigate: (page: string) => void;
}

export default function CategoryShowcase({ onNavigate }: CategoryShowcaseProps) {
  const { categories } = useCatalogue();

  return (
    <section className="py-16 md:py-20">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">Explore our curated collections for holistic living</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => onNavigate(`shop:${cat.id}`)}
              className={`group relative overflow-hidden rounded-sm shadow-sm hover:shadow-xl transition-all duration-300 ${
                idx === 0 ? 'md:col-span-2 md:row-span-2 aspect-square md:aspect-auto' : 'aspect-square'
              }`}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-primary-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-left">
                <h3 className={`font-serif font-semibold text-white leading-tight ${
                  idx === 0 ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'
                }`}>
                  {cat.name}
                </h3>
                <p className={`text-white/70 text-xs md:text-sm mt-1 ${idx === 0 ? 'max-w-xs' : 'hidden md:block line-clamp-1'}`}>
                  {cat.description}
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-accent-200 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Shop Now <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

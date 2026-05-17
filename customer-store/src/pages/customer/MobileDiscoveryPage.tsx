import { useState, useEffect } from 'react';
import { MobileAiAssistant } from '../../components/customer/MobileAiAssistant';
import { VariantBottomSheet } from '../../components/customer/VariantBottomSheet';
import type { Product } from '../../types';
import { Timer, Zap, ChevronRight, Plus } from 'lucide-react';

// Mock Data
const HERO_BANNERS = [
  { id: 1, title: 'Summer Collection', subtitle: 'Up to 50% Off', bg: 'bg-gradient-to-r from-orange-400 to-rose-400' },
  { id: 2, title: 'New Arrivals', subtitle: 'Explore the latest trends', bg: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
  { id: 3, title: 'Flash Deals', subtitle: 'Ends in 24 hours', bg: 'bg-gradient-to-r from-purple-500 to-pink-500' },
];

const CATEGORIES = [
  { id: '1', name: 'Electronics' },
  { id: '2', name: 'Fashion' },
  { id: '3', name: 'Home & Kitchen' },
  { id: '4', name: 'Beauty' },
  { id: '5', name: 'Sports' },
  { id: '6', name: 'Toys' },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    sku: 'p1',
    name: 'Wireless Noise-Cancelling Headphones Pro',
    description: 'High quality sound with active noise cancellation.',
    selling_price: 12999,
    category: 'Electronics',
    images: [{ id: 1, media_type: 'image', media_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' }],
    stock_quantity: 15,
  },
  {
    id: 2,
    sku: 'p2',
    name: 'Minimalist Cotton T-Shirt',
    description: '100% pure cotton, highly breathable.',
    selling_price: 899,
    category: 'Fashion',
    images: [{ id: 2, media_type: 'image', media_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80' }],
    stock_quantity: 5,
  },
  {
    id: 3,
    sku: 'p3',
    name: 'Smart Fitness Watch Series 6',
    description: 'Track your health and activities all day.',
    selling_price: 4500,
    category: 'Electronics',
    images: [{ id: 3, media_type: 'image', media_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80' }],
    stock_quantity: 50,
  },
  {
    id: 4,
    sku: 'p4',
    name: 'Classic Leather Sneakers',
    description: 'Comfortable everyday wear with durable leather.',
    selling_price: 2499,
    category: 'Fashion',
    images: [{ id: 4, media_type: 'image', media_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80' }],
    stock_quantity: 2,
  },
];

export const MobileDiscoveryPage: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  // Native Countdown Timer Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickAdd = (product: Product) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  return (
    <div className="pb-8">
      {/* Horizontal Category Pills */}
      <div className="pt-4 pb-2 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none snap-x">
          <button className="snap-start shrink-0 px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-semibold whitespace-nowrap">
            For You
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className="snap-start shrink-0 px-5 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium whitespace-nowrap shadow-sm"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Promotional Hero Banners (Horizontal Scroll) */}
      <div className="mt-4 px-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory">
          {HERO_BANNERS.map((banner) => (
            <div
              key={banner.id}
              className={`snap-center shrink-0 w-[85vw] max-w-[320px] h-40 rounded-2xl ${banner.bg} p-6 flex flex-col justify-center relative overflow-hidden shadow-md`}
            >
              <div className="relative z-10">
                <p className="text-white/80 font-medium text-sm mb-1">{banner.subtitle}</p>
                <h2 className="text-white font-bold text-2xl leading-tight w-2/3">{banner.title}</h2>
                <button className="mt-3 bg-white text-gray-900 px-4 py-1.5 rounded-full text-xs font-bold w-fit shadow-sm">
                  Shop Now
                </button>
              </div>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assessment Engine Block */}
      <MobileAiAssistant />

      {/* Flash Sales Block */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-500 w-5 h-5 fill-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">Flash Sales</h2>
          </div>

          {/* Native Countdown Timer */}
          <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
            <Timer className="w-3.5 h-3.5 text-red-500" />
            <div className="flex items-center gap-1 text-red-600 font-bold text-xs tabular-nums">
              <span className="bg-white px-1.5 rounded shadow-sm">{String(timeLeft.hours).padStart(2, '0')}</span>:
              <span className="bg-white px-1.5 rounded shadow-sm">{String(timeLeft.minutes).padStart(2, '0')}</span>:
              <span className="bg-white px-1.5 rounded shadow-sm">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Dual-Column Product Feed */}
        <div className="grid grid-cols-2 gap-3">
          {MOCK_PRODUCTS.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative group overflow-hidden">
              {/* Automated Inventory Badges */}
              {product.stock_quantity < 10 && (
                <div className="absolute top-2 left-2 z-10 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Only {product.stock_quantity} left
                </div>
              )}

              {/* Product Imagery Placeholder */}
              <div className="aspect-square bg-gray-50 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center">
                {product.images?.[0]?.media_url ? (
                  <img src={product.images[0].media_url} alt={product.name} className="object-cover w-full h-full mix-blend-multiply" />
                ) : (
                  <div className="text-gray-300 text-xs">No Image</div>
                )}

                {/* Quick Add Action (Ripple effect handled by browser mostly for touch) */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleQuickAdd(product); }}
                  className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-white p-2 rounded-full shadow-lg active:scale-95 transition-transform"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium truncate">{product.category}</p>
                <h3 className="text-sm font-bold text-gray-800 leading-tight line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-base font-black text-gray-900">
                    ₹{product.selling_price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 mb-4 px-4">
         <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
            View All Products
            <ChevronRight size={16} />
         </button>
      </div>

      {/* Variant Drawer Context */}
      <VariantBottomSheet
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

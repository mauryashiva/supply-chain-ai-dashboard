import { useState, useEffect, useCallback } from 'react';
import { catalogService } from '../../services';
import { useInventorySocket } from '../../hooks/useInventorySocket';
import { useCartStore } from '../../store/useCartStore';
import { MobileAiAssistant } from '../../components/customer/MobileAiAssistant';
import { VariantBottomSheet } from '../../components/customer/VariantBottomSheet';
import type { Product } from '../../types';
import { Timer, Zap, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock Data for non-dynamic elements
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

export const MobileDiscoveryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  const syncPrices = useCartStore((state) => state.syncPrices);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    try {
      const response = await catalogService.getProducts();
      const latestData = response.data;
      setProducts(latestData);
      syncPrices(latestData);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [syncPrices]);

  useInventorySocket(fetchProducts);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
          {loading ? (
            <div className="col-span-2 flex justify-center py-10">
              <div className="h-8 w-8 border-2 border-gray-300 rounded-full border-t-blue-500 animate-spin"></div>
            </div>
          ) : (
            products.map((product) => (
            <div key={product.id} onClick={() => navigate(`/product/${product.id}`)} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative group overflow-hidden cursor-pointer">
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
            ))
          )}
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

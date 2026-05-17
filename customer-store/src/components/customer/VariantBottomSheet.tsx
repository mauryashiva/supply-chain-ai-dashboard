import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { Product } from '../../types';
import { useGlobalState } from '../../context/useGlobalState';

interface VariantBottomSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const SIZES = ['S', 'M', 'L', 'XL'];
const CONFIGS = [
  { id: 'standard', name: 'Standard Pack', priceIncrement: 0 },
  { id: 'premium', name: 'Premium Pack', priceIncrement: 150 },
  { id: 'bulk', name: 'Bulk Case', priceIncrement: 800 },
];

export const VariantBottomSheet: React.FC<VariantBottomSheetProps> = ({ product, isOpen, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedConfig, setSelectedConfig] = useState<string>('standard');
  const { addToCart } = useGlobalState();

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const currentConfig = CONFIGS.find(c => c.id === selectedConfig);
  const basePrice = product ? product.selling_price : 0;
  const finalPrice = basePrice + (currentConfig?.priceIncrement || 0);

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        product,
        quantity: 1,
        variant: selectedConfig,
        size: selectedSize,
      });
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Bottom Sheet Modal */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-w-md mx-auto transition-transform duration-300 ease-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="p-5 pb-safe">
          {/* Handle bar for dragging visual */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6"></div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{product?.name || 'Select Options'}</h2>
              <p className="text-lg font-semibold text-blue-600 mt-1">₹{finalPrice.toFixed(2)}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Size Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-3">Select Size</label>
              <div className="flex gap-3">
                {SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedSize === size
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Configuration Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-3">Configuration</label>
              <div className="space-y-3">
                {CONFIGS.map(config => (
                  <button
                    key={config.id}
                    onClick={() => setSelectedConfig(config.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      selectedConfig === config.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-sm font-medium ${selectedConfig === config.id ? 'text-blue-900' : 'text-gray-700'}`}>
                      {config.name}
                    </span>
                    <div className="flex items-center gap-3">
                      {config.priceIncrement > 0 && (
                        <span className="text-xs text-gray-500">+₹{config.priceIncrement}</span>
                      )}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        selectedConfig === config.id ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {selectedConfig === config.id && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Bottom CTA */}
          <div className="mt-8">
            <button
              onClick={handleAddToCart}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-colors flex items-center justify-center gap-2"
            >
              Add to Cart - ₹{finalPrice.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

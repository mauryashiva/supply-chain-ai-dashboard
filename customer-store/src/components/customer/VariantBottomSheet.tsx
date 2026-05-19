import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';

interface VariantBottomSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VariantBottomSheet: React.FC<VariantBottomSheetProps> = ({ product, isOpen, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      if (product?.variants && product.variants.length > 0) {
        setSelectedVariantId(product.variants[0].id);
      } else {
        setSelectedVariantId(null);
      }
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300); // match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, product]);

  if (!isOpen && !isAnimating) return null;

  const hasVariants = product?.variants && product.variants.length > 0;
  const selectedVariant = hasVariants ? product.variants!.find(v => v.id === selectedVariantId) : undefined;

  const basePrice = product ? product.selling_price : 0;
  const finalPrice = selectedVariant?.price_override ?? basePrice;

  const handleAddToCart = () => {
    if (product) {
      addItem(product, selectedVariant);
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
            {!hasVariants ? (
              <div className="py-4 text-gray-500 text-sm text-center">
                Standard configuration
              </div>
            ) : (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-3">Select Variant</label>
                <div className="space-y-3">
                  {product.variants!.map(variant => {
                    const isSelected = selectedVariantId === variant.id;
                    const variantOut = variant.stock_quantity <= 0;

                    const configParts = [];
                    if (variant.ram) configParts.push(`${variant.ram} RAM`);
                    if (variant.storage) configParts.push(`${variant.storage} Storage`);
                    if (variant.color) configParts.push(variant.color);
                    if (variant.screen_size) configParts.push(`${variant.screen_size}"`);
                    const label = configParts.length > 0 ? configParts.join(" • ") : variant.sku;

                    return (
                      <button
                        key={variant.id}
                        disabled={variantOut}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${variantOut ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                      >
                        <div className="flex flex-col items-start">
                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'} ${variantOut ? 'line-through text-gray-400' : ''}`}>
                            {label}
                          </span>
                          {variantOut && <span className="text-[10px] text-red-500 font-bold mt-1">OUT OF STOCK</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                            ₹{(variant.price_override ?? basePrice).toFixed(2)}
                          </span>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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

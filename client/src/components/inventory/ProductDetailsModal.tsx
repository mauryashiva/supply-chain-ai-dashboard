import React from "react";
import dayjs from "dayjs";
import {
  Package,
  Tag,
  Building,
  Hash,
  BarChart,
  DollarSign,
  Bell,
  Calendar,
  Percent, // --- CHANGE 1: Import the Percent icon ---
} from "lucide-react";
import type { Product } from "@/types";
import { StockStatusBadge } from "./InventoryComponents";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { ModalLayout } from "@/layouts/ModalLayout";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

// Helper component for displaying detail items
const DetailItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}> = ({ icon: Icon, label, value }) => (
  <div>
    <dt className="text-xs font-medium text-zinc-400 flex items-center gap-2">
      <Icon size={14} className="text-zinc-500" />
      {label}
    </dt>
    <dd className="mt-1.5 text-sm font-semibold text-white">
      {value || <span className="text-zinc-500">N/A</span>}
    </dd>
  </div>
);

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!isOpen || !product) return null;

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== "number") return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return dayjs(dateString).format("DD MMM YYYY, h:mm A");
  };

  const stockValue = (product.cost_price || 0) * product.stock_quantity;

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      size="max-w-3xl"
    >
      <div>
        <div className="flex flex-col md:flex-row items-start gap-8">
          {product.images && product.images.length > 0 && (
            <div className="w-full md:w-1/3">
              <Carousel
                showThumbs={false}
                showStatus={false}
                infiniteLoop={true}
                className="rounded-lg overflow-hidden border border-zinc-800"
              >
                {product.images.map((media) => (
                  <div key={media.id} className="aspect-square bg-black">
                    {media.media_type === "image" ? (
                      <img
                        src={media.media_url}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        src={media.media_url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          <div
            className={
              product.images && product.images.length > 0
                ? "w-full md:w-2/3"
                : "w-full"
            }
          >
            <p className="text-sm font-mono text-zinc-400 mb-6 -mt-2">
              SKU: {product.sku}
            </p>

            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5 bg-zinc-800/50 p-4 rounded-lg">
              <DetailItem
                icon={Package}
                label="Stock Quantity"
                value={`${product.stock_quantity} units`}
              />
              <DetailItem
                icon={BarChart}
                label="Status"
                value={<StockStatusBadge status={product.status} />}
              />
              <DetailItem
                icon={Tag}
                label="Category"
                value={product.category}
              />
              <DetailItem
                icon={DollarSign}
                label="Cost Price"
                value={formatCurrency(product.cost_price)}
              />
              <DetailItem
                icon={DollarSign}
                label="Selling Price"
                value={formatCurrency(product.selling_price)}
              />
              {/* --- CHANGE 2: Added a DetailItem to display the GST Rate --- */}
              <DetailItem
                icon={Percent}
                label="GST Rate"
                value={
                  typeof product.gst_rate === "number"
                    ? `${product.gst_rate}%`
                    : "N/A"
                }
              />
              <DetailItem
                icon={Hash}
                label="Stock Value (Cost)"
                value={formatCurrency(stockValue)}
              />
              <DetailItem
                icon={Bell}
                label="Reorder Level"
                value={`${product.reorder_level || "N/A"} units`}
              />
              <DetailItem
                icon={Building}
                label="Supplier"
                value={product.supplier}
              />
              <DetailItem
                icon={Calendar}
                label="Last Restocked"
                value={formatDate(product.last_restocked)}
              />
            </dl>
          </div>
        </div>

        {product.description && (
          <div className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              AI Generated Description
            </h3>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </ModalLayout>
  );
};

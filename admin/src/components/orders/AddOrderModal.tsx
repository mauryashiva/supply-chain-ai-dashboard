import React, { useState, useMemo, useEffect, type FormEvent } from "react";
import { PackagePlus, Trash2, TrendingUp } from "lucide-react";
import type {
  Order,
  OrderCreate,
  Product,
  PaymentStatus,
  ShippingProvider,
  PaymentMethod,
  OrderStatus,
  DiscountType,
} from "@/types";
// 1. Updated Import: Using the centralized orderService
import { orderService } from "@/services/api";
import { QuickAddProductModal } from "./QuickAddProductModal";
import { ModalLayout } from "@/layouts/ModalLayout";

// Helper function to format numbers as Indian Rupees (₹)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderAdded: (newOrder: Order) => void;
  products: Product[];
  onProductAdded: (newProduct: Product) => void;
}

const INITIAL_FORM_STATE = {
  customer_name: "",
  customer_email: "",
  phone_number: "",
  shipping_address: "",
  payment_status: "Unpaid" as PaymentStatus,
  payment_method: "COD" as PaymentMethod,
  status: "Pending" as OrderStatus,
  shipping_provider: "Self-Delivery" as ShippingProvider,
  items: [] as { product_id: number; quantity: number }[],
  tracking_id: "",
  vehicle_id: "",
  discount_value: 0,
  discount_type: "fixed" as DiscountType,
  shipping_charges: 0,
};

export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderAdded,
  products,
  onProductAdded,
}) => {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [typedProductName, setTypedProductName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormState(INITIAL_FORM_STATE);
      setError(null);
    }
  }, [isOpen]);

  const orderTotals = useMemo(() => {
    const subtotal = formState.items.reduce((acc, item) => {
      const product = products.find((p) => p.id === item.product_id);
      return acc + (product?.selling_price || 0) * item.quantity;
    }, 0);

    let discountAmount = 0;
    const discountValue = Number(formState.discount_value) || 0;
    if (formState.discount_type === "percentage") {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }
    if (discountAmount > subtotal) discountAmount = subtotal;

    const totalGst = formState.items.reduce((acc, item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product || !product.selling_price || product.gst_rate === null)
        return acc;

      const itemTotalPrice = product.selling_price * item.quantity;
      let itemDiscount = 0;
      if (subtotal > 0 && discountAmount > 0) {
        itemDiscount = (itemTotalPrice / subtotal) * discountAmount;
      }

      const taxableValue = itemTotalPrice - itemDiscount;
      const itemGst = taxableValue * ((product.gst_rate || 0) / 100);
      return acc + itemGst;
    }, 0);

    const shipping = Number(formState.shipping_charges) || 0;
    const totalAmount = subtotal - discountAmount + totalGst + shipping;

    return { subtotal, discountAmount, totalGst, shipping, totalAmount };
  }, [
    formState.items,
    formState.discount_value,
    formState.discount_type,
    formState.shipping_charges,
    products,
  ]);

  const availableProducts = useMemo(() => {
    const addedProductIds = formState.items.map((item) => item.product_id);
    return products.filter((p) => !addedProductIds.includes(p.id));
  }, [products, formState.items]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    const numberFields = ["discount_value", "shipping_charges", "vehicle_id"];

    if (name === "phone_number") {
      const numericValue = value.replace(/[^+\d]/g, "");
      setFormState((prev) => ({ ...prev, [name]: numericValue }));
    } else if (numberFields.includes(name)) {
      setFormState((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseFloat(value) || 0,
      }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || itemQuantity <= 0) {
      setError("Please select a product and enter a valid quantity.");
      return;
    }
    const productId = parseInt(selectedProductId, 10);
    if (isNaN(productId)) {
      setError("Invalid product selected.");
      return;
    }

    const existingItem = formState.items.find(
      (item) => item.product_id === productId,
    );

    if (existingItem) {
      setFormState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + itemQuantity }
            : item,
        ),
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          { product_id: productId, quantity: itemQuantity },
        ],
      }));
    }

    setSelectedProductId("");
    setItemQuantity(1);
    setError(null);
  };

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stock_quantity) {
      setError(`Only ${product.stock_quantity} units available.`);
      newQuantity = product.stock_quantity;
    } else {
      setError(null);
    }

    if (newQuantity < 1) newQuantity = 1;

    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    }));
  };

  const handleRemoveItem = (productIdToRemove: number) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.product_id !== productIdToRemove),
    }));
  };

  const handleOpenQuickAdd = () => {
    const nameInput = document.querySelector(
      'input[name="product-search"]',
    ) as HTMLInputElement;
    setTypedProductName(nameInput ? nameInput.value : "");
    setIsQuickAddOpen(true);
  };

  // 2. Updated handleSubmit logic to use orderService
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formState.items.length === 0) {
      setError("An order must have at least one item.");
      return;
    }
    setLoading(true);
    setError(null);

    const payload: OrderCreate = {
      customer_name: formState.customer_name,
      customer_email: formState.customer_email,
      phone_number: formState.phone_number || undefined,
      shipping_address: formState.shipping_address,
      payment_method: formState.payment_method,
      payment_status: formState.payment_status,
      status: formState.status,
      shipping_provider: formState.shipping_provider,
      tracking_id: formState.tracking_id || undefined,
      vehicle_id: Number(formState.vehicle_id) || undefined,
      discount_value: Number(formState.discount_value) || undefined,
      discount_type:
        formState.discount_value > 0 ? formState.discount_type : undefined,
      shipping_charges: Number(formState.shipping_charges) || undefined,
      items: formState.items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      })),
    };

    try {
      // 3. Updated API call to the centralized orderService
      const response = await orderService.createOrder(payload);
      onOrderAdded(response.data);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyles =
    "w-full bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all";
  const labelStyles =
    "block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1";
  const fieldsetStyles =
    "border border-gray-200 dark:border-zinc-700 p-4 rounded-xl transition-colors";
  const legendStyles =
    "px-2 text-sm font-bold text-gray-500 dark:text-zinc-400";

  return (
    <>
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onProductAdded={onProductAdded}
        setSelectedProductId={setSelectedProductId}
        initialProductName={typedProductName}
      />
      <ModalLayout
        isOpen={isOpen}
        onClose={onClose}
        title="Add New Order"
        size="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <fieldset className={fieldsetStyles}>
                <legend className={legendStyles}>Customer Details</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyles}>Customer Name</label>
                    <input
                      name="customer_name"
                      value={formState.customer_name}
                      onChange={handleChange}
                      required
                      className={inputStyles}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Customer Email</label>
                    <input
                      name="customer_email"
                      type="email"
                      value={formState.customer_email}
                      onChange={handleChange}
                      required
                      className={inputStyles}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Phone Number</label>
                    <input
                      name="phone_number"
                      type="tel"
                      value={formState.phone_number}
                      onChange={handleChange}
                      placeholder="e.g., +91XXXXXXXXXX"
                      className={inputStyles}
                      maxLength={15}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className={labelStyles}>Shipping Address</label>
                  <textarea
                    name="shipping_address"
                    value={formState.shipping_address}
                    onChange={handleChange}
                    required
                    className={inputStyles}
                    rows={2}
                  ></textarea>
                </div>
              </fieldset>

              <fieldset className={fieldsetStyles}>
                <legend className={legendStyles}>Order Items</legend>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_auto_auto] gap-2 items-end">
                  <div>
                    <label className={labelStyles}>Search or Add Product</label>
                    <input
                      list="products-list"
                      name="product-search"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      placeholder="Type product ID or name..."
                      className={inputStyles}
                    />
                    <datalist id="products-list">
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} -{" "}
                          {p.stock_quantity > 0
                            ? `${p.stock_quantity} in stock`
                            : "OUT OF STOCK"}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className={labelStyles}>Qty</label>
                    <input
                      type="number"
                      value={itemQuantity}
                      onChange={(e) =>
                        setItemQuantity(parseInt(e.target.value) || 1)
                      }
                      min="1"
                      className={inputStyles}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenQuickAdd}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg h-10 transition-colors"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 h-10 transition-all active:scale-95"
                  >
                    <PackagePlus size={16} /> Add
                  </button>
                </div>

                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {formState.items.length > 0 ? (
                    formState.items.map((item) => {
                      const product = products.find(
                        (p) => p.id === item.product_id,
                      );
                      return (
                        <div
                          key={item.product_id}
                          className="flex justify-between items-center bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 p-3 rounded-xl text-sm"
                        >
                          <span className="font-semibold text-gray-700 dark:text-zinc-200">
                            {product?.name}
                          </span>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.product_id,
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-16 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md p-1 text-center font-mono dark:text-white"
                              min="1"
                              max={product?.stock_quantity}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="text-red-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-400 dark:text-zinc-500 text-xs py-4 italic">
                      No items added yet.
                    </p>
                  )}
                </div>
              </fieldset>
            </div>

            <div className="space-y-4">
              <fieldset className={fieldsetStyles}>
                <legend className={legendStyles}>Fulfillment & Payment</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyles}>Discount</label>
                    <input
                      type="number"
                      name="discount_value"
                      value={formState.discount_value}
                      onChange={handleChange}
                      min="0"
                      className={inputStyles}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Type</label>
                    <select
                      name="discount_type"
                      value={formState.discount_type}
                      onChange={handleChange}
                      className={inputStyles}
                    >
                      <option value="fixed">Fixed (₹)</option>
                      <option value="percentage">Percent (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyles}>Shipping (₹)</label>
                    <input
                      type="number"
                      name="shipping_charges"
                      value={formState.shipping_charges}
                      onChange={handleChange}
                      min="0"
                      className={inputStyles}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Order Status</label>
                    <select
                      name="status"
                      value={formState.status}
                      onChange={handleChange}
                      className={inputStyles}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyles}>Payment Status</label>
                    <select
                      name="payment_status"
                      value={formState.payment_status}
                      onChange={handleChange}
                      className={inputStyles}
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyles}>Payment Method</label>
                    <select
                      name="payment_method"
                      value={formState.payment_method}
                      onChange={handleChange}
                      disabled={formState.payment_status === "COD"}
                      className={`${inputStyles} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className={labelStyles}>Shipping Provider</label>
                    <select
                      name="shipping_provider"
                      value={formState.shipping_provider}
                      onChange={handleChange}
                      className={inputStyles}
                    >
                      <option value="Self-Delivery">Self-Delivery</option>
                      <option value="BlueDart">BlueDart</option>
                      <option value="Delhivery">Delhivery</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyles}>Vehicle ID</label>
                    <input
                      type="number"
                      name="vehicle_id"
                      value={formState.vehicle_id}
                      onChange={handleChange}
                      className={inputStyles}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="border border-dashed border-gray-300 dark:border-zinc-600 p-5 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/30 transition-colors">
                <legend className="px-2 text-sm font-bold text-gray-600 dark:text-zinc-400 flex items-center gap-2">
                  <TrendingUp size={14} /> Order Summary
                </legend>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                    <dt>Subtotal</dt>
                    <dd className="font-mono font-bold">
                      {formatCurrency(orderTotals.subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center text-red-500 dark:text-red-400">
                    <dt>Discount</dt>
                    <dd className="font-mono font-bold">
                      -{formatCurrency(orderTotals.discountAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                    <dt>Total GST</dt>
                    <dd className="font-mono font-bold">
                      +{formatCurrency(orderTotals.totalGst)}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 dark:text-zinc-400">
                    <dt>Shipping</dt>
                    <dd className="font-mono font-bold">
                      +{formatCurrency(orderTotals.shipping)}
                    </dd>
                  </div>
                  <div className="border-t border-gray-200 dark:border-zinc-700 my-2"></div>
                  <div className="flex justify-between items-center text-lg font-black text-gray-900 dark:text-white">
                    <dt>Grand Total</dt>
                    <dd className="font-mono text-cyan-600 dark:text-cyan-400">
                      {formatCurrency(orderTotals.totalAmount)}
                    </dd>
                  </div>
                </dl>
              </fieldset>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center">
                {error}
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formState.items.length === 0}
              className="px-8 py-2.5 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
              {loading ? "Processing..." : "Confirm & Create Order"}
            </button>
          </div>
        </form>
      </ModalLayout>
    </>
  );
};

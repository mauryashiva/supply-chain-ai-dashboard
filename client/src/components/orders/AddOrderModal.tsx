import React, { useState, useMemo, useEffect, type FormEvent } from "react";
import { PackagePlus, Trash2, TrendingUp } from "lucide-react"; // Import Phone icon if needed elsewhere, not strictly required here
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
import { createOrder } from "@/services/api";
import { QuickAddProductModal } from "./QuickAddProductModal";
import { ModalLayout } from "@/layouts/ModalLayout";

// Helper to format currency
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

// --- UPDATED INITIAL_FORM_STATE ---
const INITIAL_FORM_STATE = {
  customer_name: "",
  customer_email: "",
  phone_number: "", // Added phone number
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

  // Order Totals calculation (no change)
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

  // Available products calculation (no change)
  const availableProducts = useMemo(() => {
    const addedProductIds = formState.items.map((item) => item.product_id);
    return products.filter((p) => !addedProductIds.includes(p.id));
  }, [products, formState.items]);

  // --- UPDATED handleChange ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const numberFields = ["discount_value", "shipping_charges", "vehicle_id"];

    if (name === "phone_number") {
      // Allow only digits (and maybe '+')
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

  // Item handling functions (handleAddItem, handleQuantityChange, handleRemoveItem - no changes)
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
      (item) => item.product_id === productId
    );
    if (existingItem) {
      setFormState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + itemQuantity }
            : item
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
    if (newQuantity < 1) {
      newQuantity = 1;
    }
    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ),
    }));
  };
  const handleRemoveItem = (productIdToRemove: number) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.product_id !== productIdToRemove),
    }));
  };

  // Quick Add handling (no change)
  const handleOpenQuickAdd = () => {
    const nameInput = document.querySelector(
      'input[name="product-search"]'
    ) as HTMLInputElement;
    setTypedProductName(nameInput ? nameInput.value : "");
    setIsQuickAddOpen(true);
  };

  // --- UPDATED handleSubmit ---
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
      phone_number: formState.phone_number || undefined, // Include phone number
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
      const response = await createOrder(payload);
      onOrderAdded(response.data);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

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
              {/* --- CUSTOMER DETAILS FIELDSET (Updated Grid & Phone Field) --- */}
              <fieldset className="border border-zinc-700 p-4 rounded-lg">
                <legend className="px-2 text-sm text-zinc-400">
                  Customer Details
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {" "}
                  {/* Changed to 3 cols */}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Customer Name
                    </label>
                    <input
                      name="customer_name"
                      value={formState.customer_name}
                      onChange={handleChange}
                      required
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Customer Email
                    </label>
                    <input
                      name="customer_email"
                      type="email"
                      value={formState.customer_email}
                      onChange={handleChange}
                      required
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    {" "}
                    {/* Phone Number Input */}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Phone Number {/* Removed (Optional) */}
                    </label>
                    <input
                      name="phone_number"
                      type="tel"
                      value={formState.phone_number}
                      onChange={handleChange}
                      placeholder="e.g., +91XXXXXXXXXX"
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                      maxLength={15}
                    />
                  </div>
                </div>
                {/* Shipping Address (spans full width) */}
                <div className="mt-4 md:col-span-3">
                  {" "}
                  {/* Span full width */}
                  <label className="block text-xs text-zinc-400 mb-1">
                    Shipping Address
                  </label>
                  <textarea
                    name="shipping_address"
                    value={formState.shipping_address}
                    onChange={handleChange}
                    required
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    rows={2}
                  ></textarea>
                </div>
              </fieldset>

              {/* Order Items Fieldset (no change) */}
              <fieldset className="border border-zinc-700 p-4 rounded-lg">
                <legend className="px-2 text-sm text-zinc-400">
                  Order Items
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_auto_auto] gap-2 items-end">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Search or Add Product
                    </label>
                    <input
                      list="products-list"
                      name="product-search"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      placeholder="Type or select a product..."
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />
                    <datalist id="products-list">
                      {availableProducts.map((p) => (
                        <option
                          key={p.id}
                          value={p.id}
                          disabled={p.stock_quantity === 0}
                        >
                          {" "}
                          {p.name} -{" "}
                          {p.stock_quantity > 0
                            ? `${p.stock_quantity} units`
                            : "OUT OF STOCK"}{" "}
                          ({p.status}){" "}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={itemQuantity}
                      onChange={(e) =>
                        setItemQuantity(parseInt(e.target.value) || 1)
                      }
                      min="1"
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenQuickAdd}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-2 rounded-lg h-10"
                    title="Create a new product from typed name"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 self-end h-10"
                  >
                    {" "}
                    <PackagePlus size={16} /> Add Item{" "}
                  </button>
                </div>
                <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-2">
                  {formState.items.length > 0 ? (
                    formState.items.map((item) => {
                      const product = products.find(
                        (p) => p.id === item.product_id
                      );
                      return (
                        <div
                          key={item.product_id}
                          className="flex justify-between items-center bg-zinc-800 p-2 rounded-md text-sm"
                        >
                          {" "}
                          <span>{product?.name}</span>{" "}
                          <div className="flex items-center gap-4">
                            {" "}
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.product_id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 bg-zinc-700 border-zinc-600 rounded-md p-1 text-center font-mono"
                              min="1"
                              max={product?.stock_quantity}
                            />{" "}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="text-red-500 hover:text-red-400"
                              title="Remove Item"
                            >
                              {" "}
                              <Trash2 size={14} />{" "}
                            </button>{" "}
                          </div>{" "}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-zinc-500 text-sm">
                      No items added yet.
                    </p>
                  )}
                </div>
              </fieldset>
            </div>

            <div className="space-y-4">
              {/* Fulfillment & Payment Fieldset (no change) */}
              <fieldset className="border border-zinc-700 p-4 rounded-lg">
                <legend className="px-2 text-sm text-zinc-400">
                  Fulfillment & Payment
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    {" "}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Discount Value
                    </label>{" "}
                    <input
                      type="number"
                      name="discount_value"
                      value={formState.discount_value}
                      onChange={handleChange}
                      min="0"
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />{" "}
                  </div>
                  <div>
                    {" "}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Discount Type
                    </label>{" "}
                    <select
                      name="discount_type"
                      value={formState.discount_type}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    >
                      {" "}
                      <option value="fixed">Fixed (₹)</option>{" "}
                      <option value="percentage">Percentage (%)</option>{" "}
                    </select>{" "}
                  </div>
                  <div>
                    {" "}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Shipping Charges (₹)
                    </label>{" "}
                    <input
                      type="number"
                      name="shipping_charges"
                      value={formState.shipping_charges}
                      onChange={handleChange}
                      min="0"
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />{" "}
                  </div>
                  <div>
                    {" "}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Order Status
                    </label>{" "}
                    <select
                      name="status"
                      value={formState.status}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    >
                      {" "}
                      <option value="Pending">Pending</option>{" "}
                      <option value="Processing">Processing</option>{" "}
                      <option value="Shipped">Shipped</option>{" "}
                      <option value="In Transit">In Transit</option>{" "}
                      <option value="Delivered">Delivered</option>{" "}
                      <option value="Cancelled">Cancelled</option>{" "}
                      <option value="Returned">Returned</option>{" "}
                    </select>{" "}
                  </div>
                  <div>
                    {" "}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Payment Status
                    </label>{" "}
                    <select
                      name="payment_status"
                      value={formState.payment_status}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    >
                      {" "}
                      <option value="Unpaid">Unpaid</option>{" "}
                      <option value="Paid">Paid</option>{" "}
                      <option value="Pending">Pending</option>{" "}
                      <option value="COD">COD</option>{" "}
                      <option value="Refunded">Refunded</option>{" "}
                    </select>{" "}
                  </div>
                  <div>
                    {" "}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Payment Method
                    </label>{" "}
                    <select
                      name="payment_method"
                      value={formState.payment_method}
                      onChange={handleChange}
                      disabled={formState.payment_status === "COD"}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2 disabled:opacity-50"
                    >
                      {" "}
                      <option value="Credit Card">Credit Card</option>{" "}
                      <option value="Debit Card">Debit Card</option>{" "}
                      <option value="UPI">UPI</option>{" "}
                      <option value="Net Banking">Net Banking</option>{" "}
                      <option value="Wallet">Wallet</option>{" "}
                      <option value="COD">COD</option>{" "}
                    </select>{" "}
                  </div>
                  <div>
                    {" "}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Shipping Provider
                    </label>{" "}
                    <select
                      name="shipping_provider"
                      value={formState.shipping_provider}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    >
                      {" "}
                      <option value="Self-Delivery">Self-Delivery</option>{" "}
                      <option value="BlueDart">BlueDart</option>{" "}
                      <option value="Delhivery">Delhivery</option>{" "}
                      <option value="DTDC">DTDC</option>{" "}
                    </select>{" "}
                  </div>
                  <div>
                    {" "}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Tracking ID
                    </label>{" "}
                    <input
                      name="tracking_id"
                      value={formState.tracking_id}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />{" "}
                  </div>
                  <div>
                    {" "}
                    <label className="block text-xs text-zinc-400 mb-1">
                      Vehicle ID
                    </label>{" "}
                    <input
                      type="number"
                      name="vehicle_id"
                      value={formState.vehicle_id}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />{" "}
                  </div>
                </div>
              </fieldset>

              {/* Order Summary Fieldset (no change) */}
              <fieldset className="border border-dashed border-zinc-600 p-4 rounded-lg">
                <legend className="px-2 text-sm text-zinc-400 flex items-center gap-2">
                  {" "}
                  <TrendingUp size={14} /> Order Summary{" "}
                </legend>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    {" "}
                    <dt className="text-zinc-400">Subtotal</dt>{" "}
                    <dd className="font-mono">
                      {formatCurrency(orderTotals.subtotal)}
                    </dd>{" "}
                  </div>
                  <div className="flex justify-between items-center text-red-400">
                    {" "}
                    <dt>Discount</dt>{" "}
                    <dd className="font-mono">
                      -{formatCurrency(orderTotals.discountAmount)}
                    </dd>{" "}
                  </div>
                  <div className="flex justify-between items-center">
                    {" "}
                    <dt className="text-zinc-400">Total GST</dt>{" "}
                    <dd className="font-mono">
                      +{formatCurrency(orderTotals.totalGst)}
                    </dd>{" "}
                  </div>
                  <div className="flex justify-between items-center">
                    {" "}
                    <dt className="text-zinc-400">Shipping</dt>{" "}
                    <dd className="font-mono">
                      +{formatCurrency(orderTotals.shipping)}
                    </dd>{" "}
                  </div>
                  <div className="border-t border-zinc-700 my-2"></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    {" "}
                    <dt>Total Amount</dt>{" "}
                    <dd className="font-mono text-cyan-400">
                      {formatCurrency(orderTotals.totalAmount)}
                    </dd>{" "}
                  </div>
                </dl>
              </fieldset>
            </div>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              {" "}
              Cancel{" "}
            </button>
            <button
              type="submit"
              disabled={loading || formState.items.length === 0}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {" "}
              {loading ? "Creating..." : "Create Order"}{" "}
            </button>
          </div>
        </form>
      </ModalLayout>
    </>
  );
};

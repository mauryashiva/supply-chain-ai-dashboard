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
import { createOrder } from "@/services/api";
import { QuickAddProductModal } from "./QuickAddProductModal";
import { ModalLayout } from "@/layouts/ModalLayout";

// Helper function to format numbers as Indian Rupees (₹)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

// Props interface for the AddOrderModal component
interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderAdded: (newOrder: Order) => void; // Callback when an order is successfully created
  products: Product[]; // The master list of all available products
  onProductAdded: (newProduct: Product) => void; // Callback to add a *new* product to the master list
}

// Defines the initial, empty state for a new order form
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

/**
 * This is the main modal component for creating a new order.
 * It includes customer details, item selection, payment, and a summary.
 */
export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderAdded,
  products,
  onProductAdded,
}) => {
  // Holds all the data for the new order being created
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  // Stores any error messages for display
  const [error, setError] = useState<string | null>(null);
  // Manages the loading state for the form submission
  const [loading, setLoading] = useState(false);
  // Tracks the currently selected product from the dropdown/datalist (as its ID)
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  // Tracks the quantity for the *next* item to be added
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  // Toggles the visibility of the QuickAddProductModal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  // Stores the text from the search input to pre-fill the quick add modal
  const [typedProductName, setTypedProductName] = useState("");

  // Effect to reset the form to its initial state whenever the modal is (re)opened
  useEffect(() => {
    if (isOpen) {
      setFormState(INITIAL_FORM_STATE);
      setError(null);
    }
  }, [isOpen]);

  // Calculate all order totals reactively whenever form state or products change
  const orderTotals = useMemo(() => {
    // 1. Calculate Subtotal (sum of all item prices * quantities)
    const subtotal = formState.items.reduce((acc, item) => {
      const product = products.find((p) => p.id === item.product_id);
      return acc + (product?.selling_price || 0) * item.quantity;
    }, 0);

    // 2. Calculate Discount Amount (handles both 'fixed' and 'percentage')
    let discountAmount = 0;
    const discountValue = Number(formState.discount_value) || 0;
    if (formState.discount_type === "percentage") {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }
    // Cap discount at the subtotal amount
    if (discountAmount > subtotal) discountAmount = subtotal;

    // 3. Calculate Total GST.
    // This is complex: discount is applied proportionally *before* calculating GST on each item.
    const totalGst = formState.items.reduce((acc, item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product || !product.selling_price || product.gst_rate === null)
        return acc;

      const itemTotalPrice = product.selling_price * item.quantity;
      let itemDiscount = 0;

      // Calculate this item's share of the total discount
      if (subtotal > 0 && discountAmount > 0) {
        itemDiscount = (itemTotalPrice / subtotal) * discountAmount;
      }

      // Taxable value is the price after the proportional discount
      const taxableValue = itemTotalPrice - itemDiscount;
      const itemGst = taxableValue * ((product.gst_rate || 0) / 100);
      return acc + itemGst;
    }, 0);

    // 4. Get Shipping Charges
    const shipping = Number(formState.shipping_charges) || 0;

    // 5. Calculate Final Total Amount
    const totalAmount = subtotal - discountAmount + totalGst + shipping;

    return { subtotal, discountAmount, totalGst, shipping, totalAmount };
  }, [
    formState.items,
    formState.discount_value,
    formState.discount_type,
    formState.shipping_charges,
    products,
  ]);

  // Memoized list of products that have *not* already been added to this order
  const availableProducts = useMemo(() => {
    const addedProductIds = formState.items.map((item) => item.product_id);
    return products.filter((p) => !addedProductIds.includes(p.id));
  }, [products, formState.items]);

  // A generic handler for most form inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const numberFields = ["discount_value", "shipping_charges", "vehicle_id"];

    if (name === "phone_number") {
      // Special case: sanitize phone number to only allow digits and '+'
      const numericValue = value.replace(/[^+\d]/g, "");
      setFormState((prev) => ({ ...prev, [name]: numericValue }));
    } else if (numberFields.includes(name)) {
      // Special case: parse numeric fields, allowing an empty string
      setFormState((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseFloat(value) || 0,
      }));
    } else {
      // Standard case for text, select, and textareas
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- Item Handling Functions ---

  // Adds the selected product and quantity to the order's item list
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

    // Check if item already exists in the order
    const existingItem = formState.items.find(
      (item) => item.product_id === productId
    );

    if (existingItem) {
      // If item already exists, just increase its quantity
      setFormState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.product_id === productId
            ? { ...item, quantity: item.quantity + itemQuantity }
            : item
        ),
      }));
    } else {
      // Otherwise, add it as a new item to the array
      setFormState((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          { product_id: productId, quantity: itemQuantity },
        ],
      }));
    }

    // Reset the product selection inputs
    setSelectedProductId("");
    setItemQuantity(1);
    setError(null);
  };

  // Updates the quantity of an item *already in the order list*
  const handleQuantityChange = (productId: number, newQuantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Validates against available stock quantity
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

  // Removes an item from the order list by its product ID
  const handleRemoveItem = (productIdToRemove: number) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.product_id !== productIdToRemove),
    }));
  };

  // --- Quick Add Product Handling ---

  // Opens the quick-add modal and pre-fills the name from the search input
  const handleOpenQuickAdd = () => {
    const nameInput = document.querySelector(
      'input[name="product-search"]'
    ) as HTMLInputElement;
    setTypedProductName(nameInput ? nameInput.value : "");
    setIsQuickAddOpen(true);
  };

  // --- Form Submission ---

  // Handles the final submission of the entire order form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic validation: ensure at least one item is in the order
    if (formState.items.length === 0) {
      setError("An order must have at least one item.");
      return;
    }
    setLoading(true);
    setError(null);

    // Build the final API payload, ensuring correct types and handling optional fields (undefined)
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
      // Make the API call
      const response = await createOrder(payload);
      // On success, notify the parent and close the modal
      onOrderAdded(response.data);
      onClose();
    } catch (err: any) {
      // On failure, set the error message
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Child modal for quickly adding a new product to the *main* product list */}
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onProductAdded={onProductAdded}
        setSelectedProductId={setSelectedProductId}
        initialProductName={typedProductName}
      />
      {/* The main modal layout wrapper */}
      <ModalLayout
        isOpen={isOpen}
        onClose={onClose}
        title="Add New Order"
        size="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main 2-column layout for the form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* */}
            <div className="space-y-4">
              {/* --- CUSTOMER DETAILS FIELDSET --- */}
              <fieldset className="border border-zinc-700 p-4 rounded-lg">
                <legend className="px-2 text-sm text-zinc-400">
                  Customer Details
                </legend>
                {/* Updated to a 3-column grid for name, email, phone */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {/* Phone Number Input */}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      name="phone_number"
                      type="tel" // Use "tel" for better mobile support
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

              {/* --- ORDER ITEMS FIELDSET --- */}
              <fieldset className="border border-zinc-700 p-4 rounded-lg">
                <legend className="px-2 text-sm text-zinc-400">
                  Order Items
                </legend>
                {/* Grid for product selection inputs and buttons */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_auto_auto] gap-2 items-end">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Search or Add Product
                    </label>
                    {/* Datalist input for searching and selecting available products */}
                    <input
                      list="products-list"
                      name="product-search"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      placeholder="Type or select a product..."
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />
                    {/* The datalist provides the dropdown options for the input above */}
                    <datalist id="products-list">
                      {availableProducts.map((p) => (
                        <option
                          key={p.id}
                          value={p.id} // The value is the product ID
                          disabled={p.stock_quantity === 0}
                        >
                          {/* The text shown in the dropdown */}
                          {p.name} -{" "}
                          {p.stock_quantity > 0
                            ? `${p.stock_quantity} units`
                            : "OUT OF STOCK"}{" "}
                          ({p.status})
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
                  {/* Button to open the "Quick Add Product" modal */}
                  <button
                    type="button"
                    onClick={handleOpenQuickAdd}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-2 rounded-lg h-10"
                    title="Create a new product from typed name"
                  >
                    +
                  </button>
                  {/* Button to add the selected product to this order */}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 self-end h-10"
                  >
                    <PackagePlus size={16} /> Add Item
                  </button>
                </div>
                {/* This div lists the items *currently in the order* */}
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
                          <span>{product?.name}</span>
                          <div className="flex items-center gap-4">
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
                              max={product?.stock_quantity} // Set max quantity to available stock
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="text-red-500 hover:text-red-400"
                              title="Remove Item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

            {/* */}
            <div className="space-y-4">
              {/* --- FULFILLMENT & PAYMENT FIELDSET --- */}
              <fieldset className="border border-zinc-700 p-4 rounded-lg">
                <legend className="px-2 text-sm text-zinc-400">
                  Fulfillment & Payment
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      name="discount_value"
                      value={formState.discount_value}
                      onChange={handleChange}
                      min="0"
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Discount Type
                    </label>
                    <select
                      name="discount_type"
                      value={formState.discount_type}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    >
                      <option value="fixed">Fixed (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Shipping Charges (₹)
                    </label>
                    <input
                      type="number"
                      name="shipping_charges"
                      value={formState.shipping_charges}
                      onChange={handleChange}
                      min="0"
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Order Status
                    </label>
                    <select
                      name="status"
                      value={formState.status}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Payment Status
                    </label>
                    <select
                      name="payment_status"
                      value={formState.payment_status}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="COD">COD</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Payment Method
                    </label>
                    <select
                      name="payment_method"
                      value={formState.payment_method}
                      onChange={handleChange}
                      disabled={formState.payment_status === "COD"}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2 disabled:opacity-50"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Wallet">Wallet</option>
                      <option value="COD">COD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Shipping Provider
                    </label>
                    <select
                      name="shipping_provider"
                      value={formState.shipping_provider}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    >
                      <option value="Self-Delivery">Self-Delivery</option>
                      <option value="BlueDart">BlueDart</option>
                      <option value="Delhivery">Delhivery</option>
                      <option value="DTDC">DTDC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Tracking ID
                    </label>
                    <input
                      name="tracking_id"
                      value={formState.tracking_id}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Vehicle ID
                    </label>
                    <input
                      type="number"
                      name="vehicle_id"
                      value={formState.vehicle_id}
                      onChange={handleChange}
                      className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </fieldset>

              {/* --- ORDER SUMMARY FIELDSET --- */}
              <fieldset className="border border-dashed border-zinc-600 p-4 rounded-lg">
                <legend className="px-2 text-sm text-zinc-400 flex items-center gap-2">
                  <TrendingUp size={14} /> Order Summary
                </legend>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <dt className="text-zinc-400">Subtotal</dt>
                    <dd className="font-mono">
                      {formatCurrency(orderTotals.subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center text-red-400">
                    <dt>Discount</dt>
                    <dd className="font-mono">
                      -{formatCurrency(orderTotals.discountAmount)}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-zinc-400">Total GST</dt>
                    <dd className="font-mono">
                      +{formatCurrency(orderTotals.totalGst)}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-zinc-400">Shipping</dt>
                    <dd className="font-mono">
                      +{formatCurrency(orderTotals.shipping)}
                    </dd>
                  </div>
                  <div className="border-t border-zinc-700 my-2"></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <dt>Total Amount</dt>
                    {/* The final calculated total */}
                    <dd className="font-mono text-cyan-400">
                      {formatCurrency(orderTotals.totalAmount)}
                    </dd>
                  </div>
                </dl>
              </fieldset>
            </div>
          </div>

          {/* Display any submission errors here */}
          {error && (
            <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
          )}

          {/* Form action buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formState.items.length === 0}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </ModalLayout>
    </>
  );
};

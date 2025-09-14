import React, { useState, useMemo, type FormEvent } from "react";
import { PackagePlus, Trash2 } from "lucide-react";
import type {
  Order,
  OrderCreate,
  Product,
  PaymentStatus,
  ShippingProvider,
  PaymentMethod,
  OrderStatus,
} from "@/types";
import { createOrder } from "@/services/api";
// --- CHANGE 1: Replace 'AddProductModal' with 'QuickAddProductModal' ---
import { QuickAddProductModal } from "./QuickAddProductModal";
import { ModalLayout } from "@/layouts/ModalLayout";

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderAdded: (newOrder: Order) => void;
  products: Product[];
  onProductAdded: (newProduct: Product) => void;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderAdded,
  products,
  onProductAdded,
}) => {
  const [formState, setFormState] = useState({
    customer_name: "",
    customer_email: "",
    shipping_address: "",
    amount: 0,
    payment_status: "Unpaid" as PaymentStatus,
    payment_method: "COD" as PaymentMethod,
    status: "Pending" as OrderStatus,
    shipping_provider: "Self-Delivery" as ShippingProvider,
    items: [] as { product_id: number; quantity: number }[],
    tracking_id: "",
    vehicle_id: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  // --- CHANGE 2: Rename 'isAddProductOpen' to 'isQuickAddOpen' for clarity ---
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // This state will store the name typed in the search box
  const [typedProductName, setTypedProductName] = useState("");

  const availableProducts = useMemo(() => {
    const addedProductIds = formState.items.map((item) => item.product_id);
    return products.filter((p) => !addedProductIds.includes(p.id));
  }, [products, formState.items]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    if (!selectedProductId || itemQuantity <= 0) {
      setError("Please select a product and enter a valid quantity.");
      return;
    }
    const productId = parseInt(selectedProductId, 10);
    if (isNaN(productId)) {
      setError(
        "Invalid product selected. Please choose a product from the list."
      );
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
      setError(
        `Only ${product.stock_quantity} units of ${product.name} are available.`
      );
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

  // --- CHANGE 3: This function will be called when the '+' button is clicked ---
  const handleOpenQuickAdd = () => {
    const nameInput = document.querySelector(
      'input[name="product-search"]'
    ) as HTMLInputElement;
    setTypedProductName(nameInput ? nameInput.value : "");
    setIsQuickAddOpen(true);
  };

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
      shipping_address: formState.shipping_address,
      amount: Number(formState.amount),
      payment_status: formState.payment_status,
      payment_method: formState.payment_method,
      status: formState.status,
      shipping_provider: formState.shipping_provider,
      tracking_id: formState.tracking_id || undefined,
      vehicle_id: Number(formState.vehicle_id) || undefined,
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
      if (err.response && err.response.data && err.response.data.detail) {
        const firstError = err.response.data.detail[0];
        const errorMessage = `Invalid Input: ${firstError.msg} (Field: ${firstError.loc[1]})`;
        setError(errorMessage);
      } else {
        setError("Failed to create order. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* --- CHANGE 4: The new 'QuickAddProductModal' is rendered here --- */}
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
        size="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="border border-zinc-700 p-4 rounded-lg">
            <legend className="px-2 text-sm text-zinc-400">
              Customer Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            <div className="mt-4">
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

          <fieldset className="border border-zinc-700 p-4 rounded-lg">
            <legend className="px-2 text-sm text-zinc-400">Order Items</legend>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_auto_auto] gap-2 items-end">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Search or Add Product
                </label>
                <input
                  list="products-list"
                  // --- CHANGE 5: Input name changed to allow selection ---
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
              {/* '+' button now calls the new function */}
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
                <PackagePlus size={16} /> Add Item
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
                          max={product?.stock_quantity}
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

          <fieldset className="border border-zinc-700 p-4 rounded-lg">
            <legend className="px-2 text-sm text-zinc-400">
              Fulfillment & Payment
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  Tracking ID (Optional)
                </label>
                <input
                  name="tracking_id"
                  value={formState.tracking_id || ""}
                  onChange={handleChange}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Assigned Vehicle (Optional)
                </label>
                <input
                  name="vehicle_id"
                  type="number"
                  value={formState.vehicle_id || ""}
                  onChange={handleChange}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formState.amount}
                  onChange={handleChange}
                  className="w-full bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2 font-bold text-lg"
                />
              </div>
            </div>
          </fieldset>

          {error && (
            <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
          )}

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
              disabled={loading}
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

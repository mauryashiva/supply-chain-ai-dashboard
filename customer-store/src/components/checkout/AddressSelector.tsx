import { useEffect, useState } from "react";
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/services/api";
import { cn } from "@/lib/utils";

/* ---------- REUSABLE FIELD COMPONENT ---------- */
const Field = ({ label, value, onChange, color = "cyan", maxLength }: any) => {
  return (
    <div className="relative">
      <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 ml-1">
        {label}
      </label>
      <input
        value={value}
        maxLength={maxLength}
        onChange={onChange}
        className={cn(
          "w-full bg-secondary border rounded-xl px-4 py-3 text-foreground outline-none transition focus:ring-1",
          color === "amber"
            ? "border-amber-600 focus:border-amber-400 focus:ring-amber-400/30"
            : "border-border focus:border-cyan-500 focus:ring-cyan-500/30",
        )}
      />
    </div>
  );
};

export const AddressSelector = ({ onSelect }: any) => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const emptyForm = {
    full_name: "",
    phone_number: "",
    flat: "",
    area: "",
    landmark: "", // Landmark restored in state
    city: "",
    state: "",
    pincode: "",
    country: "India",
    is_default: false,
  };

  const [form, setForm] = useState(emptyForm);

  const fetchAddresses = async () => {
    try {
      const res = await getMyAddresses();
      setAddresses(res.data);
      if (res.data.length > 0) {
        const defaultAddr =
          res.data.find((a: any) => a.is_default) || res.data[0];
        setSelectedId(defaultAddr.id);
        onSelect(defaultAddr);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSelect = (addr: any) => {
    setSelectedId(addr.id);
    onSelect(addr);
  };

  const handleEdit = (addr: any) => {
    setEditingId(addr.id);
    setForm(addr);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry from the manifest?")) return;
    await deleteAddress(id);
    if (editingId === id) setShowForm(false);
    fetchAddresses();
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone_number || !form.city)
      return alert("Incomplete deployment data.");

    try {
      if (editingId) {
        await updateAddress(editingId, form);
      } else {
        await createAddress(form);
      }
      setShowForm(false);
      fetchAddresses();
    } catch (err) {
      alert("Transmission failed.");
    }
  };

  return (
    <div className="space-y-6">
      {addresses.map((addr) => (
        <div
          key={addr.id}
          className={cn(
            "p-px rounded-2xl transition-all duration-300",
            selectedId === addr.id
              ? "bg-linear-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20"
              : "bg-border/50",
          )}
        >
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div
              className="flex gap-4 cursor-pointer"
              onClick={() => handleSelect(addr)}
            >
              <input
                type="radio"
                checked={selectedId === addr.id}
                readOnly
                className="mt-1 accent-cyan-500 h-4 w-4"
              />
              <div className="flex-1">
                <p className="font-bold text-foreground text-lg tracking-tight">
                  {addr.full_name}
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  {addr.phone_number}
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {addr.flat}, {addr.area},{" "}
                  {addr.landmark && `${addr.landmark}, `} {addr.city},{" "}
                  {addr.state} -{" "}
                  <span className="font-bold text-foreground">
                    {addr.pincode}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-6 mt-4 text-[11px] font-black uppercase tracking-widest">
              <button
                onClick={() => handleEdit(addr)}
                className="text-cyan-600 dark:text-cyan-400"
              >
                Edit_Details
              </button>
              <button
                onClick={() => handleDelete(addr.id)}
                className="text-destructive"
              >
                Delete_Entry
              </button>
            </div>
          </div>
        </div>
      ))}

      {!showForm && (
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(emptyForm);
          }}
          className="w-full py-4 rounded-xl bg-linear-to-r from-cyan-500 to-blue-500 text-white dark:text-black font-black text-xs uppercase tracking-[0.2em]"
        >
          + Add New Address
        </button>
      )}

      {showForm && (
        <div className="bg-card p-6 rounded-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
              {editingId ? "Modify_Location" : "New_Deployment_Point"}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <Field
            label="Full Name"
            value={form.full_name}
            onChange={(e: any) =>
              setForm({ ...form, full_name: e.target.value })
            }
          />
          <Field
            label="Phone Number"
            maxLength={10}
            value={form.phone_number}
            onChange={(e: any) =>
              setForm({
                ...form,
                phone_number: e.target.value.replace(/\D/g, ""),
              })
            }
          />
          <Field
            label="Flat / Building"
            color="amber"
            value={form.flat}
            onChange={(e: any) => setForm({ ...form, flat: e.target.value })}
          />
          <Field
            label="Area / Street"
            value={form.area}
            onChange={(e: any) => setForm({ ...form, area: e.target.value })}
          />

          {/* LANDMARK RESTORED HERE */}
          <Field
            label="Landmark (Optional)"
            value={form.landmark}
            onChange={(e: any) =>
              setForm({ ...form, landmark: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="City"
              value={form.city}
              onChange={(e: any) => setForm({ ...form, city: e.target.value })}
            />
            <Field
              label="State"
              value={form.state}
              onChange={(e: any) => setForm({ ...form, state: e.target.value })}
            />
          </div>

          <Field
            label="Pincode"
            maxLength={6}
            value={form.pincode}
            onChange={(e: any) =>
              setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })
            }
          />

          <button
            onClick={handleSave}
            className="w-full py-4 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-white dark:text-black font-black text-xs uppercase tracking-[0.2em] mt-4"
          >
            {editingId ? "Commit Changes" : "Save Location"}
          </button>
        </div>
      )}
    </div>
  );
};

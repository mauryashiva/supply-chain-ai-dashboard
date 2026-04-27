import { useEffect, useState, useCallback } from "react";
// 1. Updated Service Import to use modular addressService
import { addressService } from "@/services";
import { cn } from "@/lib/utils";
import { Trash2, Edit3, Plus, MapPin, CheckCircle2 } from "lucide-react";
import type { Address, AddressCreate } from "@/types";

/* ---------- REUSABLE FIELD COMPONENT ---------- */
const Field = ({
  label,
  value,
  onChange,
  color = "cyan",
  maxLength,
  placeholder,
}: any) => {
  return (
    <div className="relative">
      <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">
        {label}
      </label>
      <input
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={onChange}
        className={cn(
          "w-full bg-secondary/50 border rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-all focus:ring-4",
          color === "amber"
            ? "border-amber-500/50 focus:border-amber-400 focus:ring-amber-400/10"
            : "border-border focus:border-cyan-500/50 focus:ring-cyan-500/10",
        )}
      />
    </div>
  );
};

interface AddressSelectorProps {
  onSelect: (address: Address) => void;
}

export const AddressSelector = ({ onSelect }: AddressSelectorProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [, setLoading] = useState(false);

  const emptyForm: AddressCreate = {
    full_name: "",
    phone_number: "",
    flat: "",
    area: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    is_default: false,
  };

  const [form, setForm] = useState<AddressCreate>(emptyForm);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      // Matches backend: GET /api/customer/address/
      const res = await addressService.getAddresses();
      setAddresses(res.data);

      if (res.data.length > 0) {
        const defaultAddr =
          res.data.find((a: Address) => a.is_default) || res.data[0];
        setSelectedId(defaultAddr.id);
        onSelect(defaultAddr);
      }
    } catch (err) {
      console.error("Logistic manifest retrieval failed:", err);
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSelect = (addr: Address) => {
    setSelectedId(addr.id);
    onSelect(addr);
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm(addr);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Permanently decommission this delivery point?")) return;
    try {
      // Matches backend: DELETE /api/customer/address/{id}
      await addressService.deleteAddress(id);
      if (editingId === id) setShowForm(false);
      fetchAddresses();
    } catch (err) {
      alert("Protocol error: Deletion failed.");
    }
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone_number || !form.city || !form.pincode) {
      return alert("Missing required deployment coordinates.");
    }

    try {
      if (editingId) {
        // Matches backend: PUT /api/customer/address/{id}
        await addressService.updateAddress(editingId, form);
      } else {
        // Matches backend: POST /api/customer/address/
        await addressService.createAddress(form);
      }
      setShowForm(false);
      setEditingId(null);
      fetchAddresses();
    } catch (err) {
      alert("Signal lost: Transmission failed.");
    }
  };

  return (
    <div className="space-y-4">
      {addresses.map((addr) => (
        <div
          key={addr.id}
          className={cn(
            "group relative rounded-3xl transition-all duration-500 overflow-hidden border-2",
            selectedId === addr.id
              ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_30px_rgba(6,182,212,0.1)]"
              : "border-border bg-card/40 hover:border-muted-foreground/30",
          )}
        >
          <div className="p-6">
            <div
              className="flex items-start gap-4 cursor-pointer"
              onClick={() => handleSelect(addr)}
            >
              <div className="mt-1">
                {selectedId === addr.id ? (
                  <CheckCircle2 className="text-cyan-500 h-5 w-5" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-black text-foreground uppercase tracking-tight italic">
                    {addr.full_name}
                  </p>
                  {addr.is_default && (
                    <span className="text-[8px] font-black bg-cyan-500 text-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground font-bold tabular-nums">
                  {addr.phone_number}
                </p>

                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  {addr.flat}, {addr.area}
                  {addr.landmark && (
                    <span className="opacity-60"> • {addr.landmark}</span>
                  )}
                  <br />
                  <span className="text-foreground/80">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6 pt-4 border-t border-border/50">
              <button
                onClick={() => handleEdit(addr)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400 hover:opacity-70 transition-opacity"
              >
                <Edit3 size={12} />
                Modify
              </button>
              <button
                onClick={() => handleDelete(addr.id)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-destructive hover:opacity-70 transition-opacity"
              >
                <Trash2 size={12} />
                Purge
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
          className="w-full group h-20 rounded-3xl border-2 border-dashed border-border hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-1"
        >
          <Plus
            className="text-muted-foreground group-hover:text-cyan-500 transition-colors"
            size={20}
          />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-cyan-500 transition-colors">
            Register_New_Location
          </span>
        </button>
      )}

      {showForm && (
        <div className="bg-card border-2 border-cyan-500/30 p-8 rounded-[2.5rem] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="text-cyan-500 h-4 w-4" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
                {editingId ? "Update_Coordinates" : "Initialize_Location"}
              </h3>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <Field
              label="Recipient Identity"
              placeholder="e.g. John Doe"
              value={form.full_name}
              onChange={(e: any) =>
                setForm({ ...form, full_name: e.target.value })
              }
            />
            <Field
              label="Comms Channel (Phone)"
              placeholder="10-digit mobile"
              maxLength={10}
              value={form.phone_number}
              onChange={(e: any) =>
                setForm({
                  ...form,
                  phone_number: e.target.value.replace(/\D/g, ""),
                })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Sector / Flat"
                color="amber"
                placeholder="Unit #"
                value={form.flat}
                onChange={(e: any) =>
                  setForm({ ...form, flat: e.target.value })
                }
              />
              <Field
                label="Zone / Area"
                placeholder="Street name"
                value={form.area}
                onChange={(e: any) =>
                  setForm({ ...form, area: e.target.value })
                }
              />
            </div>

            <Field
              label="Visual Landmark"
              placeholder="Optional reference point"
              value={form.landmark}
              onChange={(e: any) =>
                setForm({ ...form, landmark: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="City Hub"
                value={form.city}
                onChange={(e: any) =>
                  setForm({ ...form, city: e.target.value })
                }
              />
              <Field
                label="State Region"
                value={form.state}
                onChange={(e: any) =>
                  setForm({ ...form, state: e.target.value })
                }
              />
            </div>

            <Field
              label="Postal Index (Pincode)"
              maxLength={6}
              value={form.pincode}
              onChange={(e: any) =>
                setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 h-14 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              {editingId ? "Commit_Changes" : "Verify_&_Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

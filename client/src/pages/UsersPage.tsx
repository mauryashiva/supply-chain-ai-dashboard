import React, { useEffect, useState, type FormEvent } from "react";
// Import API functions for user CRUD operations
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/api.ts";
// Import icons from lucide-react
import {
  PlusCircle,
  Search,
  X,
  Pencil,
  Trash2,
  AlertTriangle, // Icon for confirmation modal
} from "lucide-react";
// Import utility for combining class names
import { cn } from "@/lib/utils";
// Import TypeScript types
import type { User, UserCreate, UserUpdate, UserRole } from "@/types";

// --- Add User Modal Component ---
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: (newUser: User) => void;
}

/**
 * A modal component for creating a new user.
 */
const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  // State for the new user form data
  const [formData, setFormData] = useState<UserCreate>({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generic change handler for form inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handles form submission to create a new user
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await createUser(formData);
      onUserAdded(response.data); // Pass new user to parent
      onClose(); // Close modal
      setFormData({ name: "", email: "", password: "", role: "user" }); // Reset form
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to create user. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // This modal uses a manual layout (not ModalLayout)
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-zinc-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Add New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Edit User Modal Component ---
interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

/**
 * A modal component for editing an existing user's details.
 */
const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [formData, setFormData] = useState<UserUpdate>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Populate the form with the selected user's data when the modal opens
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      });
    }
  }, [user]);

  // Generic change handler, supports text inputs, selects, and checkboxes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    setFormData({
      ...formData,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    });
  };

  // Handles form submission to update the user
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await updateUser(user.id, formData);
      onUserUpdated(response.data); // Pass updated user to parent
      onClose(); // Close modal
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-zinc-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              required
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role || "user"}
              onChange={handleChange}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-zinc-400">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active ?? true} // Default to true if undefined
                onChange={handleChange}
                className="h-4 w-4 rounded bg-zinc-700 border-zinc-600 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Is Active</span>
            </label>
          </div>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Confirmation Modal Component ---
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading: boolean;
}

/**
 * A reusable modal to confirm destructive actions, like deleting a user.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-sm relative border border-zinc-700 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-zinc-400 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

/**
 * A small badge component to visually display the user's role.
 */
const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const roleMap: Record<UserRole, string> = {
    admin: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    user: "bg-zinc-700 text-zinc-300 border border-zinc-600/50",
  };
  return (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-full",
        roleMap[role]
      )}
    >
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

/**
 * A small component to show a colored dot and text for Active/Inactive status.
 */
const StatusIndicator: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isActive ? "bg-green-500" : "bg-zinc-500"
        )}
      ></span>
      <span className={isActive ? "text-green-400" : "text-zinc-400"}>
        {isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
};

// --- Main User Page Component ---
/**
 * The main page component for User Management.
 * It fetches all users and manages the state for modals (Add, Edit, Delete).
 */
const UsersPage: React.FC = () => {
  // Main state for the list of users
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal visibility states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // State to hold the user currently being acted upon
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Loading state for the delete action
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        setUsers(response.data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filter users based on search term (name or email)
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Callback for when a new user is added
  const handleUserAdded = (newUser: User) => {
    setUsers([newUser, ...users]); // Add new user to the top of the list
  };

  // Opens the Edit modal
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  // Callback for when a user is updated
  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  // Opens the Delete confirmation modal
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsConfirmModalOpen(true);
  };

  // Handles the actual deletion after confirmation
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter((u) => u.id !== userToDelete.id)); // Remove from list
      setIsConfirmModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Could not delete the user. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Render all the modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserUpdated={handleUserUpdated}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm User Deletion"
        message={`Are you sure you want to permanently delete ${userToDelete?.name}? This action cannot be undone.`}
        loading={isDeleting}
      />

      {/* Main Page Content */}
      <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-sm text-zinc-400">
              Manage your team members and their account permissions.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            <PlusCircle size={18} />
            <span>Add New User</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
              {loading ? (
                // Loading state row
                <tr>
                  <td colSpan={5} className="text-center py-8 text-zinc-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                // Empty state row
                <tr>
                  <td colSpan={5} className="text-center py-8 text-zinc-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                // Data rows
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusIndicator isActive={user.is_active} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* Action buttons: Edit and Delete */}
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors"
                          title="Edit User"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default UsersPage;

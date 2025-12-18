import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  FaUser,
  FaLock,
  FaPlus,
  FaUpload,
  FaHome,
  FaFileAlt,
  FaSignOutAlt,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCheck,
  FaSpinner,
  FaBell,
  FaSearch,
  FaRocket,
  FaList,
} from "react-icons/fa";
import { io } from "socket.io-client";
import { axiosInstance } from "./helpers/axiosInstence";
import { Pagination } from "antd";

export type IAddress = {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  place: string;
  formattedAddress: string;
  imageUrl?: string[];
  summary?: string;
  type?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  createdAt?: string;
};

export type ICategory = {
  _id?: string;
  name: string;
};

const AdminDashboard: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("token") !== null);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);
  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState("dashboard");
  const [csvUploadLoading, setCsvUploadLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(21);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType] = useState("");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [update, setUpdate] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showMultipleForm, setShowMultipleForm] = useState(false);

  // BULK DELETE STATE
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([]);

  // PROFILE PASSWORD CHANGE STATE
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [changeUserLoading, setChangeUserLoading] = useState(false);
  const socket = useMemo(() => io("https://api.voyagen.co.uk"), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addressTypes = categories.map((category) => category.name);
  const filteredAddresses = addresses;
  const currentAddresses = filteredAddresses;

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // BULK SELECTION HELPERS
  const toggleSelectAll = () => {
    if (selectedAddresses.length === currentAddresses.length && currentAddresses.length > 0) {
      setSelectedAddresses([]);
    } else {
      setSelectedAddresses(currentAddresses.map(addr => addr.id!).filter(Boolean));
    }
  };

  const toggleSelectAddress = (id: string) => {
    setSelectedAddresses(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedAddresses([]);

  const handleBulkDelete = async () => {
    if (selectedAddresses.length === 0) return;
    if (!window.confirm(`Delete ${selectedAddresses.length} address(es) permanently?`)) return;
    try {
      const res = await axiosInstance.post("/address/bulk-delete", {
        ids: selectedAddresses,
      });
      if (res.data.success) {
        setUpdate(!update);
        clearSelection();
        showNotification(`Successfully deleted ${selectedAddresses.length} addresses`, "success");
      } else {
        showNotification(res.data.message || "Bulk delete failed", "error");
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || "An error occurred", "error");
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const res = await axiosInstance.post("/auth/login", { email, password });
    if (res.data.success) {
      setIsLoggedIn(true);
      setCurrentUser(email);
      localStorage.setItem("token", res.data.data);
      localStorage.setItem("username", "admin");
      showNotification("Welcome back! Login successful", "success");
    } else {
      showNotification("Invalid credentials. Try admin/password", "error");
    }
    setLoginLoading(false);
  };

  useEffect(() => {
    axiosInstance
      .get(`/address?page=${currentPage}&limit=${pageSize}&searchTerm=${searchQuery}&type=${selectedType}`)
      .then((res) => {
        setAddresses(
          res.data?.data?.map((address: any) => ({
            ...address,
            createdAt: new Date(address.createdAt!).toLocaleDateString(),
            id: address._id,
          })) || []
        );
        setPagination(res.data.pagination);
      });
    axiosInstance.get("/category").then((res) => {
      setCategories(res.data?.data || []);
    });
  }, [currentPage, searchQuery, update]);

  useEffect(() => {
   
      axiosInstance.get("/user/profile").then((res) => {
        console.log(res);
        
        if (res.data.success) {
          setCurrentUser(res.data.data.name);
          setCurrentEmail(res.data.data.email);
        }
      })
    
  }, [currentSection]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser("");
    setCurrentSection("dashboard");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    showNotification("Successfully logged out", "info");
  };

  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const newAddress = { name: formData.get("name") as string };
      const res = await axiosInstance.post("/address/single", newAddress);
      if (res.data.success) {
        setUpdate(!update);
        showNotification("Address added successfully", "success");
        setIsAddModalVisible(false);
      }
    } catch (error) {
      showNotification("Address is already added", "error");
    }
  };

  const handleEditAddress = (address: IAddress) => {
    setEditingAddress(address);
    setIsEditModalVisible(true);
  };

  const handleUpdateAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAddress) return;
    const formData = new FormData(e.currentTarget);
    const imageUrls = (formData.get("imageUrl") as string)
      ?.split(",")
      .map((url) => url.trim())
      .filter((url) => url);
    const updatedAddress: IAddress = {
      ...editingAddress,
      name: formData.get("name") as string,
      latitude: parseFloat(formData.get("latitude") as string),
      longitude: parseFloat(formData.get("longitude") as string),
      place: formData.get("place") as string,
      formattedAddress: formData.get("formattedAddress") as string,
      imageUrl: imageUrls,
      summary: formData.get("summary") as string,
      type: formData.get("type") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      country: formData.get("country") as string,
      postalCode: formData.get("postalCode") as string,
    };
    const res = await axiosInstance.patch(`/address/${editingAddress.id}`, updatedAddress);
    if (!res.data.success) {
      showNotification(res.data.message, "error");
      return;
    }
    setUpdate(!update);
    setIsEditModalVisible(false);
    setEditingAddress(null);
    showNotification("Address updated successfully!", "success");
  };

  const handleDeleteAddress = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      const res = await axiosInstance.delete(`/address/${id}`);
      if (!res.data.success) {
        showNotification(res.data.message, "error");
        return;
      }
      setUpdate(!update);
      showNotification("Address deleted successfully", "info");
    }
  };

  socket.on("address", (data: any) => {
    setUpdate(!update);
    showNotification(`New address added: ${data.name}`, "success");
  });

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCategory = { name: formData.get("name") as string };
    const res = await axiosInstance.post("/category", newCategory);
    if (res.data.success) {
      setUpdate(!update);
      showNotification("Category added successfully", "success");
      setIsAddCategoryModalVisible(false);
    } else {
      showNotification(res.data.message, "error");
    }
  };

  const handleEditCategory = (category: ICategory) => {
    setEditingCategory(category);
    setIsEditCategoryModalVisible(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;
    const formData = new FormData(e.currentTarget);
    const updatedCategory = { name: formData.get("name") as string };
    const res = await axiosInstance.patch(`/category/${editingCategory._id}`, updatedCategory);
    if (!res.data.success) {
      showNotification(res.data.message, "error");
      return;
    }
    setUpdate(!update);
    setIsEditCategoryModalVisible(false);
    setEditingCategory(null);
    showNotification("Category updated successfully!", "success");
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      const res = await axiosInstance.delete(`/category/${id}`);
      if (!res.data.success) {
        showNotification(res.data.message, "error");
        return;
      }
      setUpdate(!update);
      showNotification("Category deleted successfully", "info");
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvUploadLoading(true);
    const formData = new FormData();
    formData.append("doc", file);
    const res = await axiosInstance.post("/address/sheet", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data.success) {
      setUpdate(!update);
      showNotification("Addresses added successfully", "success");
    } else {
      showNotification(res.data.message, "error");
    }
    setCsvUploadLoading(false);
  };

  const handleAddressByAddressArea = async (e: any) => {
    e.preventDefault();
    const formdata = new FormData(e.currentTarget);
    const address = formdata.get("address") as string;
    setAddressLoading(true);
    const res = await axiosInstance.post(`/address`, { address });
    if (res.data.success) {
      setAddressLoading(false);
      setUpdate(!update);
      showNotification("Addresses added successfully", "success");
      setCurrentPage(1);
      setShowMultipleForm(false);
    } else {
      setAddressLoading(false);
      showNotification(res.data.message, "error");
    }
  };

  // PASSWORD CHANGE HANDLER
  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showNotification("New password and confirmation do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      showNotification("New password must be at least 6 characters long", "error");
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const res = await axiosInstance.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.data.success) {
        showNotification("Password changed successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showNotification(res.data.message || "Failed to change password", "error");
      }
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || "An error occurred while changing password",
        "error"
      );
    } finally {
      setPasswordChangeLoading(false);
    }
  };


  const handleUserInfoChange =async ()=>{
    setChangeUserLoading(true);
    const res = await axiosInstance.patch("/user/profile",{
      name:currentUser,
      email:currentEmail
    })
    if(res.data.success){
      showNotification("User info updated successfully", "success");
    }else{
      showNotification(res.data.message, "error");
    }
    setChangeUserLoading(false);
  }

  const totalPages = (pagination as any)?.total;

  const NotificationComponent = () => {
    if (!notification) return null;
    const bgColor =
      notification.type === "success"
        ? "bg-gradient-to-r from-green-500 to-emerald-500"
        : notification.type === "error"
        ? "bg-gradient-to-r from-red-500 to-pink-500"
        : "bg-gradient-to-r from-blue-500 to-indigo-500";
    return (
      <div className={`fixed top-6 right-6 ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-slide-in-right max-w-sm`}>
        <div className="flex-shrink-0">
          {notification.type === "success" && <FaCheck className="text-lg" />}
          {notification.type === "error" && <FaTimes className="text-lg" />}
          {notification.type === "info" && <FaBell className="text-lg" />}
        </div>
        <span className="font-medium">{notification.message}</span>
        <button onClick={() => setNotification(null)} className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors">
          <FaTimes className="text-sm" />
        </button>
      </div>
    );
  };

  const LoginPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <FaRocket className="text-2xl text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-white/70">Sign in to your admin dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative group">
              <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 group-focus-within:text-blue-400 transition-colors" />
              <input type="email" name="email" placeholder="Email" required className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-300" />
            </div>
            <div className="relative group">
              <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 group-focus-within:text-blue-400 transition-colors" />
              <input type="password" name="password" placeholder="Password" required className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-300" />
            </div>
            <button type="submit" disabled={loginLoading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl">
              {loginLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <FaRocket className="transform -rotate-45" />
                  Launch Dashboard
                </>
              )}
            </button>
          </form>
          <div className="mt-8 text-center">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/70 text-sm mb-2">Demo Credentials</p>
              <p className="text-white font-mono text-sm">admin / password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AddressFormModal = ({ visible, onClose, onSubmit, title, address }: {
    visible: boolean; onClose: () => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; title: string; address?: IAddress | null;
  }) => {
    if (!visible) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform animate-scale-in">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200">
              <FaTimes className="text-xl" />
            </button>
          </div>
          <form onSubmit={onSubmit} className="p-8 overflow-y-auto max-h-[70vh]">
            {!title.includes("Edit") && (
              <div className="space-y-2">
                <p className="text-gray-600 text-xl pb-2.5">You can add a new address here.</p>
                <label className="block text-sm font-semibold text-gray-700">Address Name *</label>
                <input type="text" name="name" required placeholder="e.g., Central Park, Office Building" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
              </div>
            )}
            {title.includes("Edit") && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Address Name *</label>
                    <input type="text" name="name" required defaultValue={address?.name || ""} placeholder="e.g., Central Park" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Type</label>
                    <select name="type" defaultValue={address?.type || ""} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300">
                      <option value="">Select type</option>
                      {addressTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Latitude *</label>
                    <input type="number" name="latitude" step="any" required defaultValue={address?.latitude || ""} placeholder="e.g., 40.7829" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Longitude *</label>
                    <input type="number" name="longitude" step="any" required defaultValue={address?.longitude || ""} placeholder="e.g., -73.9654" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Place *</label>
                    <input type="text" name="place" required defaultValue={address?.place || ""} placeholder="e.g., Central Park, Manhattan" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">City</label>
                    <input type="text" name="city" defaultValue={address?.city || ""} placeholder="e.g., New York" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">State</label>
                    <input type="text" name="state" defaultValue={address?.state || ""} placeholder="e.g., NY" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Country</label>
                    <input type="text" name="country" defaultValue={address?.country || ""} placeholder="e.g., USA" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Postal Code</label>
                    <input type="text" name="postalCode" defaultValue={address?.postalCode || ""} placeholder="e.g., 10024" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Formatted Address *</label>
                    <input type="text" name="formattedAddress" required defaultValue={address?.formattedAddress || ""} placeholder="e.g., Central Park, New York, NY 10024, USA" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Image URLs (comma-separated)</label>
                    <textarea name="imageUrl" rows={2} defaultValue={address?.imageUrl?.join(", ") || ""} placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Summary</label>
                    <textarea name="summary" rows={3} defaultValue={address?.summary || ""} placeholder="Brief description..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-end gap-4 mt-8">
              <button type="button" onClick={onClose} className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-300">
                Cancel
              </button>
              <button type="submit" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                {title.includes("Add") ? "Add Address" : "Update Address"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddressFormModalMultiple = ({ visible, onClose, onSubmit, title }: { visible: boolean; onClose: () => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; title: string; }) => {
    if (!visible) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform animate-scale-in">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200">
              <FaTimes className="text-xl" />
            </button>
          </div>
          <form onSubmit={onSubmit} className="p-8">
            <p className="text-gray-600 text-xl mb-6">
              Please provide an address in the field below and click the "Add Address" button to add it to the list. The system will automatically add up to 200 addresses within this area.
            </p>
            <input type="text" name="address" required placeholder="e.g., Central Park, Office Building" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
            <div className="flex justify-end gap-4 mt-8">
              <button type="button" onClick={onClose} className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold">Cancel</button>
              <button type="submit" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold">Add Addresses</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CategoryFormModal = ({ visible, onClose, onSubmit, title, category }: {
    visible: boolean; onClose: () => void; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; title: string; category?: ICategory | null;
  }) => {
    if (!visible) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform animate-scale-in">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2"><FaTimes className="text-xl" /></button>
          </div>
          <form onSubmit={onSubmit} className="p-8">
            <input type="text" name="name" required defaultValue={category?.name || ""} placeholder="e.g., Electronics, Clothing" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300" />
            <div className="flex justify-end gap-4 mt-8">
              <button type="button" onClick={onClose} className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold">Cancel</button>
              <button type="submit" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold">Save</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <>
        <LoginPage />
        <NotificationComponent />
        <style>{`
          @keyframes slide-in-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
          .animate-fade-in { animation: fade-in 0.2s ease-out; }
          .animate-scale-in { animation: scale-in 0.2s ease-out; }
          .animation-delay-1000 { animation-delay: 1s; }
          .animation-delay-2000 { animation-delay: 2s; }
        `}</style>
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-72" : "w-20"} bg-white shadow-2xl transition-all duration-300 flex flex-col border-r border-gray-200/50`}>
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FaRocket className="text-white text-lg" />
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-white text-xl">Admin Panel</h2>
                  <p className="text-white/70 text-sm">Management System</p>
                </div>
              )}
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <button onClick={() => setCurrentSection("addresses")} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left font-medium transition-all duration-300 ${currentSection === "addresses" ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
              <FaMapMarkerAlt className="text-lg flex-shrink-0" />
              {sidebarOpen && <span>Address Management</span>}
            </button>
            <button onClick={() => setCurrentSection("categories")} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left font-medium transition-all duration-300 ${currentSection === "categories" ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
              <FaList className="text-lg flex-shrink-0" />
              {sidebarOpen && <span>Category Management</span>}
            </button>
            {/* NEW PROFILE SECTION IN SIDEBAR */}
            <button onClick={() => setCurrentSection("profile")} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left font-medium transition-all duration-300 ${currentSection === "profile" ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"}`}>
              <FaUser className="text-lg flex-shrink-0" />
              {sidebarOpen && <span>Profile</span>}
            </button>
          </nav>
          <div className="p-4 border-t border-gray-200/50">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300">
              {sidebarOpen ? <FaChevronLeft className="text-lg" /> : <FaChevronRight className="text-lg" />}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-xl shadow-sm px-8 py-6 flex justify-between items-center border-b border-gray-200/50">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {currentSection === "dashboard" ? "Dashboard Overview" : 
                 currentSection === "categories" ? "Category Management" : 
                 currentSection === "profile" ? "My Profile" : 
                 "Address Management"}
              </h1>
              <p className="text-gray-600">
                {currentSection === "dashboard" ? "Welcome back! Here's what's happening today." : 
                 currentSection === "categories" ? "Manage and organize your categories." : 
                 currentSection === "profile" ? "View and update your account information." : 
                 "Manage and organize your address database."}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <FaBell className="text-gray-400 text-xl cursor-pointer hover:text-blue-600 transition-colors" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl px-4 py-2 text-white">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-sm font-bold">
                  {currentUser[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{currentUser}</span>
                  <span className="text-xs text-white/70">Administrator</span>
                </div>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-medium">
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-8">
            {/* ========== ADDRESSES SECTION ========== */}
            {currentSection === "addresses" && (
              <>
                {selectedAddresses.length > 0 && (
                  <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-fade-in">
                    <span className="font-semibold">{selectedAddresses.length} selected</span>
                    <div className="flex gap-3">
                      <button onClick={handleBulkDelete} className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium flex items-center gap-2">
                        <FaTrash /> Delete Selected
                      </button>
                      <button onClick={clearSelection} className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200/50">
                  <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedAddresses.length === currentAddresses.length && currentAddresses.length > 0}
                        onChange={toggleSelectAll}
                        className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-semibold text-gray-700">
                        Select All ({selectedAddresses.length} selected)
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-end">
                      <button onClick={() => setIsAddModalVisible(true)} className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                        <FaPlus /> Add New Address
                      </button>
                      <div className="relative">
                        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={csvUploadLoading} className="flex items-center gap-3 px-6 py-3 border-2 border-green-500 text-green-600 rounded-2xl font-semibold hover:bg-green-50 disabled:opacity-50">
                          {csvUploadLoading ? <FaSpinner className="animate-spin" /> : <FaUpload />} Upload CSV
                        </button>
                      </div>
                      <button onClick={() => setShowMultipleForm(true)} className="flex items-center gap-3 px-6 py-3 border-2 border-green-500 text-green-600 rounded-2xl font-semibold hover:bg-green-50">
                        {addressLoading ? <FaSpinner className="animate-spin" /> : <FaUpload />} Add Multiple
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1 mb-6">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search addresses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    />
                  </div>
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <FaFileAlt /> CSV Upload Instructions
                    </h4>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      Your CSV file should contain columns: <span className="font-mono bg-white px-2 py-1 rounded">name, latitude, longitude, place, formattedAddress</span> (required fields). Optional fields: <span className="font-mono bg-white px-2 py-1 rounded">type, city, state, country, postalCode, summary, imageUrl</span> (comma-separated).
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
                  {currentAddresses?.map((address) => (
                    <div
                      key={address.id}
                      className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl border-2 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 relative ${
                        selectedAddresses.includes(address.id!) ? "ring-4 ring-red-400 ring-opacity-50 border-red-300" : "border-gray-200/50"
                      }`}
                    >
                      <div className="absolute top-4 right-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedAddresses.includes(address.id!)}
                          onChange={() => toggleSelectAddress(address.id!)}
                          className="w-6 h-6 text-red-600 rounded focus:ring-red-500 cursor-pointer shadow-lg"
                        />
                      </div>
                      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                        {address.imageUrl && address.imageUrl[0] ? (
                          <img src={address.imageUrl[0]} alt={address.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white">
                            <FaMapMarkerAlt className="text-4xl opacity-50" />
                          </div>
                        )}
                        {address.type && (
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                            {address.type}
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{address.name}</h3>
                        <p className="text-gray-600 mb-2">{address.place}</p>
                        {address.summary && <p className="text-gray-500 text-sm mb-4 line-clamp-2">{address.summary}</p>}
                        <div className="space-y-2 mb-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2"><FaMapMarkerAlt className="text-xs" /> {address.latitude}, {address.longitude}</div>
                          {address.city && <div className="flex items-center gap-2"><FaHome className="text-xs" /> {address.city}, {address.state}</div>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditAddress(address)} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 font-medium">
                            <FaEdit className="text-sm" /> Edit
                          </button>
                          <button onClick={() => handleDeleteAddress(address.id!)} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 font-medium">
                            <FaTrash className="text-sm" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <Pagination current={currentPage} pageSize={pageSize} total={totalPages} onChange={(page) => { setCurrentPage(page); setUpdate(!update); }} />
                </div>
              </>
            )}

            {/* ========== CATEGORIES SECTION ========== */}
            {currentSection === "categories" && (
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200/50">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
                  <button
                    onClick={() => setIsAddCategoryModalVisible(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                  >
                    <FaPlus /> Add New Category
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-transparent hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{category.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category._id!)}
                            className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>ID: {category._id}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {categories.length === 0 && (
                  <div className="text-center py-16">
                    <FaList className="mx-auto text-6xl text-gray-300 mb-4" />
                    <p className="text-xl text-gray-500">No categories found. Create your first one!</p>
                  </div>
                )}
              </div>
            )}

            {/* ========== PROFILE SECTION ========== */}
            {currentSection === "profile" && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200/50">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                      {currentUser[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">Admin Profile</h2>
                      <p className="text-gray-600 mt-1">Manage your account settings</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4  items-center justify-start gap-3.5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Name</label>
                        <input type="text" name="name" defaultValue={currentUser} onChange={(e)=>setCurrentUser(e.target.value)} placeholder="e.g., admin@example.com" className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-medium"/>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input type="email" name="email" defaultValue={currentEmail} onChange={(e)=>setCurrentEmail(e.target.value)} placeholder="e.g., admin@example.com" className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 font-medium"/>
                      </div>
                       <button
                          type="submit"
                          onClick={handleUserInfoChange}
                          disabled={changeUserLoading}
                          className="px-3 py-3 bg-gradient-to-r block from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
                        >
                          {changeUserLoading ? (
                            <>
                              <FaSpinner className="inline-block animate-spin mr-2" />
                              Updating...
                            </>
                          ) : (
                            "Update Profile"
                          )}
                        </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-6 max-w-lg">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Current Password</label>
                        <div className="relative">
                          <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">New Password</label>
                        <div className="relative">
                          <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Confirm New Password</label>
                        <div className="relative">
                          <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={passwordChangeLoading}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
                        >
                          {passwordChangeLoading ? (
                            <>
                              <FaSpinner className="inline-block animate-spin mr-2" />
                              Updating...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Section */}
            {currentSection === "dashboard" && (
              <div className="text-center py-20">
                <FaRocket className="mx-auto text-8xl text-blue-500 mb-6 opacity-20" />
                <h1 className="text-4xl font-bold text-gray-800">Welcome to Admin Dashboard</h1>
                <p className="text-xl text-gray-600 mt-4">Select a section from the sidebar to begin</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* All Modals */}
      <AddressFormModal visible={isAddModalVisible} onClose={() => setIsAddModalVisible(false)} onSubmit={handleAddAddress} title="Add New Address" />
      <AddressFormModal visible={isEditModalVisible} onClose={() => { setIsEditModalVisible(false); setEditingAddress(null); }} onSubmit={handleUpdateAddress} title="Edit Address" address={editingAddress} />
      <AddressFormModalMultiple visible={showMultipleForm} onClose={() => setShowMultipleForm(false)} onSubmit={handleAddressByAddressArea} title="Add Multiple Addresses" />
      <CategoryFormModal visible={isAddCategoryModalVisible} onClose={() => setIsAddCategoryModalVisible(false)} onSubmit={handleAddCategory} title="Add New Category" />
      <CategoryFormModal visible={isEditCategoryModalVisible} onClose={() => { setIsEditCategoryModalVisible(false); setEditingCategory(null); }} onSubmit={handleUpdateCategory} title="Edit Category" category={editingCategory} />
      <NotificationComponent />
      <style>{`
        @keyframes slide-in-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </>
  );
};

export default AdminDashboard;
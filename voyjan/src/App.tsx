import React, { useState, useRef, useEffect } from 'react';
import { 
  FaUser, 
  FaLock, 
  FaPlus, 
  FaUpload, 
  FaHome,
  FaFileAlt,
  FaSignOutAlt,

  FaTachometerAlt,
  FaEdit,
  FaTrash,
  FaDownload,
  FaMapMarkerAlt,
  FaImage,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCheck,
  FaSpinner,
  FaBell,
  FaSearch,
  FaFilter,
  FaStar,
  FaHeart,
  FaRocket
} from 'react-icons/fa';
import { axiosInstance } from './helpers/axiosInstence';

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


const AdminDashboard: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('token') !== null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [pagination,setPagination] = useState();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [csvUploadLoading, setCsvUploadLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [update, setUpdate] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addressTypes = [
    'Restaurant', 'Hotel', 'Park', 'Museum', 'Landmark', 'Shopping Mall',
    'Hospital', 'School', 'Office', 'Residential', 'Tourist Attraction', 'Other'
  ];

  // Filter addresses based on search and type
  const filteredAddresses = addresses

  // Notification system with auto-dismiss
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const res =await axiosInstance.post('/auth/login', {
      email,
      password
    })



      if (res.data.success) {
        setIsLoggedIn(true);
        setCurrentUser(email);
        localStorage.setItem('token', res.data.data);
        localStorage.setItem('username', "admin");
        showNotification('Welcome back! Login successful', 'success');
      } else {
        showNotification('Invalid credentials. Try admin/password', 'error');
      }
      setLoginLoading(false);
    
  };


useEffect(() => {
  axiosInstance.get(`/address?page=${currentPage}&limit=${pageSize}&searchTerm=${searchQuery}&type=${selectedType}`).then(res => {
    setAddresses(res.data?.data?.map((address: any) => ({ ...address, createdAt: new Date(address.createdAt!).toLocaleDateString(),id:address._id })));
    setPagination(res.data.pagination);
  })
},[currentPage,searchQuery,update])

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setCurrentSection('dashboard');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    showNotification('Successfully logged out', 'info');
  };

  // Add single address
  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const imageUrls = (formData.get('imageUrl') as string)
      .split(',')
      .map(url => url.trim())
      .filter(url => url);

    const newAddress: IAddress = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      latitude: parseFloat(formData.get('latitude') as string),
      longitude: parseFloat(formData.get('longitude') as string),
      place: formData.get('place') as string,
      formattedAddress: formData.get('formattedAddress') as string,
      imageUrl: imageUrls,
      summary: formData.get('summary') as string,
      type: formData.get('type') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      country: formData.get('country') as string,
      postalCode: formData.get('postalCode') as string,
      createdAt: new Date().toISOString().split('T')[0]
    };

   const res = await axiosInstance.post('/address/single', newAddress);

   if(res.data.success){
    setUpdate(!update);
    showNotification('Address added successfully', 'success');
    setIsAddModalVisible(false);
    setAddresses([...addresses, newAddress]);
   }
  };

  // Edit address
  const handleEditAddress =(address: IAddress) => {
    
    setEditingAddress(address);
    setIsEditModalVisible(true);
  };

  // Update address
  const handleUpdateAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAddress) return;
    
    const formData = new FormData(e.currentTarget);
    const imageUrls = (formData.get('imageUrl') as string)
      .split(',')
      .map(url => url.trim())
      .filter(url => url);

    const updatedAddress: IAddress = {
      ...editingAddress,
      name: formData.get('name') as string,
      latitude: parseFloat(formData.get('latitude') as string),
      longitude: parseFloat(formData.get('longitude') as string),
      place: formData.get('place') as string,
      formattedAddress: formData.get('formattedAddress') as string,
      imageUrl: imageUrls,
      summary: formData.get('summary') as string,
      type: formData.get('type') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      country: formData.get('country') as string,
      postalCode: formData.get('postalCode') as string,
    };

    const res = await axiosInstance.patch(`/address/${editingAddress.id}`, updatedAddress);

    if (!res.data.success) {
      showNotification(res.data.message, 'error');
      return;
    }
    setUpdate(!update);
    setIsEditModalVisible(false);
    setEditingAddress(null);
    showNotification('✨ Address updated successfully!', 'success');
  };

  // Delete address
  const handleDeleteAddress =async (id: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      const res = await axiosInstance.delete(`/address/${id}`);
      if (!res.data.success) {
        showNotification(res.data.message, 'error');
        return;
      }
      
      setUpdate(!update);
      showNotification('🗑️ Address deleted successfully', 'info');
    }
  };

  // Handle CSV file upload
  const handleCSVUpload = async(event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

  

    setCsvUploadLoading(true);

    const formData = new FormData();
    formData.append('doc', file);

    const res = await axiosInstance.post('/address/sheet', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
    })
    if(res.data.success){
      setUpdate(!update);
      showNotification('Addresses added successfully', 'success');
      setCsvUploadLoading(false);
    }
    else{
      showNotification(res.data.message, 'error');
      setCsvUploadLoading(false);
    }
  };


  // Pagination logic
  const totalPages = (pagination as any)?.totalPage
  const currentAddresses = filteredAddresses


 async function handleAddressByAddressArea(e:any
  ) {
    e.preventDefault();
    const formdata = new FormData(e.currentTarget);

    const address = formdata.get('address') as string;

    const res = await axiosInstance.post(`/address`, {
      address
    });
    if(res.data.success){
      setUpdate(!update);
      showNotification('Addresses added successfully', 'success');
    }
    else{
      showNotification(res.data.message, 'error');
    }
    
    
  }

  // Enhanced Notification Component with animations
  const NotificationComponent = () => {
    if (!notification) return null;

    const bgColor = notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                   notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-500' : 
                   'bg-gradient-to-r from-blue-500 to-indigo-500';

    return (
      <div className={`fixed top-6 right-6 ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-slide-in-right max-w-sm`}>
        <div className="flex-shrink-0">
          {notification.type === 'success' && <FaCheck className="text-lg" />}
          {notification.type === 'error' && <FaTimes className="text-lg" />}
          {notification.type === 'info' && <FaBell className="text-lg" />}
        </div>
        <span className="font-medium">{notification.message}</span>
        <button 
          onClick={() => setNotification(null)}
          className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
    );
  };

  // Modern Login Page Component
  const LoginPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
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
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
              />
            </div>

            <div className="relative group">
              <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
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

  // Enhanced Address Form Modal Component
  const AddressFormModal = ({ 
    visible, 
    onClose, 
    onSubmit, 
    title, 
    address 
  }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    title: string;
    address?: IAddress | null;
  }) => {
    if (!visible) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform animate-scale-in">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
          
          <form onSubmit={onSubmit} className="p-8 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Address Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={address?.name || ''}
                  placeholder="e.g., Central Park, Office Building"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Type</label>
                <select
                  name="type"
                  defaultValue={address?.type || ''}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                >
                  <option value="">Select type</option>
                  {addressTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Latitude *</label>
                <input
                  type="number"
                  name="latitude"
                  step="any"
                  required
                  defaultValue={address?.latitude || ''}
                  placeholder="e.g., 40.7829"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Longitude *</label>
                <input
                  type="number"
                  name="longitude"
                  step="any"
                  required
                  defaultValue={address?.longitude || ''}
                  placeholder="e.g., -73.9654"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Place *</label>
                <input
                  type="text"
                  name="place"
                  required
                  defaultValue={address?.place || ''}
                  placeholder="e.g., Central Park, Manhattan"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  defaultValue={address?.city || ''}
                  placeholder="e.g., New York"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">State</label>
                <input
                  type="text"
                  name="state"
                  defaultValue={address?.state || ''}
                  placeholder="e.g., NY"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Country</label>
                <input
                  type="text"
                  name="country"
                  defaultValue={address?.country || ''}
                  placeholder="e.g., USA"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  defaultValue={address?.postalCode || ''}
                  placeholder="e.g., 10024"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Formatted Address *</label>
                <input
                  type="text"
                  name="formattedAddress"
                  required
                  defaultValue={address?.formattedAddress || ''}
                  placeholder="e.g., Central Park, New York, NY 10024, USA"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Image URLs (comma-separated)</label>
                <textarea
                  name="imageUrl"
                  rows={2}
                  defaultValue={address?.imageUrl?.join(', ') || ''}
                  placeholder="e.g., https://example.com/image1.jpg, https://example.com/image2.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Summary</label>
                <textarea
                  name="summary"
                  rows={3}
                  defaultValue={address?.summary || ''}
                  placeholder="Brief description of the location..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
              >
                {title.includes('Add') ? '✨ Add Address' : '🚀 Update Address'}
              </button>
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
        
        <style >{`
          @keyframes slide-in-right {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-in {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
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
        {/* Enhanced Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white shadow-2xl transition-all duration-300 flex flex-col border-r border-gray-200/50`}>
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
            <button
              onClick={() => setCurrentSection('dashboard')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left font-medium transition-all duration-300 ${
                currentSection === 'dashboard' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]' 
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <FaTachometerAlt className="text-lg flex-shrink-0" />
              {sidebarOpen && <span>Dashboard</span>}
            </button>
            
            <button
              onClick={() => setCurrentSection('addresses')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left font-medium transition-all duration-300 ${
                currentSection === 'addresses' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-[1.02]' 
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <FaMapMarkerAlt className="text-lg flex-shrink-0" />
              {sidebarOpen && <span>Address Management</span>}
            </button>
          </nav>

          <div className="p-4 border-t border-gray-200/50">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
            >
              {sidebarOpen ? <FaChevronLeft className="text-lg" /> : <FaChevronRight className="text-lg" />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Enhanced Header */}
          <header className="bg-white/80 backdrop-blur-xl shadow-sm px-8 py-6 flex justify-between items-center border-b border-gray-200/50">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                {currentSection === 'dashboard' ? '📊 Dashboard Overview' : '🗺️ Address Management'}
              </h1>
              <p className="text-gray-600">
                {currentSection === 'dashboard' 
                  ? 'Welcome back! Here\'s what\'s happening today.' 
                  : 'Manage and organize your address database.'}
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
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-medium"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto p-8">
            {currentSection === 'dashboard' ? (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                          <FaMapMarkerAlt className="text-xl" />
                        </div>
                        <FaHeart className="text-white/50 text-2xl" />
                      </div>
                      <p className="text-blue-100 mb-2 font-medium">Total Addresses</p>
                      <p className="text-4xl font-bold mb-2">{addresses.length}</p>
                      <p className="text-blue-200 text-sm">↗️ +12% from last month</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                          <FaImage className="text-xl" />
                        </div>
                        <FaStar className="text-white/50 text-2xl" />
                      </div>
                      <p className="text-green-100 mb-2 font-medium">With Images</p>
                      <p className="text-4xl font-bold mb-2">
                        {addresses.filter(addr => addr.imageUrl && addr.imageUrl.length > 0).length}
                      </p>
                      <p className="text-green-200 text-sm">📸 Visual content available</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500 via-pink-600 to-rose-700 text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                          <FaFileAlt className="text-xl" />
                        </div>
                        <FaRocket className="text-white/50 text-2xl" />
                      </div>
                      <p className="text-purple-100 mb-2 font-medium">Address Types</p>
                      <p className="text-4xl font-bold mb-2">
                        {new Set(addresses.filter(addr => addr.type).map(addr => addr.type)).size}
                      </p>
                      <p className="text-purple-200 text-sm">🏷️ Different categories</p>
                    </div>
                  </div>
                </div>

                {/* Recent Addresses */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200/50">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Recent Addresses</h3>
                    <button 
                      onClick={() => setCurrentSection('addresses')}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                    >
                      View All <FaChevronRight />
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    {addresses.slice(0, 3).map((address) => (
                      <div 
                        key={address.id} 
                        className="flex items-center justify-between p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 transform hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-4">
                          {address.imageUrl && address.imageUrl[0] ? (
                            <img 
                              src={address.imageUrl[0]} 
                              alt={address.name}
                              className="w-16 h-16 rounded-2xl object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                              {address.name[0]}
                            </div>
                          )}
                          
                          <div>
                            <h4 className="font-semibold text-gray-800 text-lg">{address.name}</h4>
                            <p className="text-gray-600">{address.place}</p>
                            <p className="text-gray-500 text-sm">{address.city}, {address.state}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {address.type || 'General'}
                          </span>
                          <button 
                            onClick={() => handleEditAddress(address)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Action Bar */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200/50">
                  <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <div className="flex-1 space-y-4 lg:space-y-0 lg:flex lg:gap-4 lg:items-center">
                      <button 
                        onClick={() => setIsAddModalVisible(true)}
                        className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                      >
                        <FaPlus />
                        Add New Address
                      </button>
                      
                      <div className="relative">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={csvUploadLoading}
                          className="flex items-center gap-3 px-6 py-3 border-2 border-green-500 text-green-600 rounded-2xl font-semibold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          {csvUploadLoading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                          Upload CSV
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const csvContent = 'name,latitude,longitude,place,formattedAddress,type,city,state,country,postalCode,summary,imageUrl\nSample Address,40.7829,-73.9654,"Central Park, Manhattan","Central Park, New York, NY 10024, USA",Park,New York,NY,USA,10024,Famous urban park,https://example.com/image.jpg';
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'address_template.csv';
                          a.click();
                          window.URL.revokeObjectURL(url);
                          showNotification('📥 CSV template downloaded!', 'success');
                        }}
                        className="flex items-center gap-3 px-6 py-3 border-2 border-orange-500 text-orange-600 rounded-2xl font-semibold hover:bg-orange-50 transition-all duration-300"
                      >
                        <FaDownload />
                        CSV Template
                      </button>
                      <div className='flex items-center flex-row '>
                        <form onSubmit={handleAddressByAddressArea} className='flex items-center gap-1.5'>

                          <input
                            placeholder="Search by address..."
                            name='address'
                            className='flex items-center gap-3 !importent px-6 py-3 border-2 border-orange-500 text-orange-600 rounded-2xl font-semibold hover:bg-orange-50 transition-all duration-300'
                            />

                            <button className='flex cursor-pointer items-center gap-3 px-3 py-3 border-2 border-green-500 text-green-600 rounded-2xl font-semibold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300'>
                              Add by address
                            </button>
                  
                        </form>
                      </div>
                    </div>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                      <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search addresses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      />
                    </div>
                    
                    <div className="relative">
                      <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="pl-12 pr-8 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 min-w-[200px]"
                      >
                        <option value="">All Types</option>
                        {addressTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CSV Upload Instructions */}
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <FaFileAlt />
                      CSV Upload Instructions
                    </h4>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      Your CSV file should contain columns: <span className="font-mono bg-white px-2 py-1 rounded">name, latitude, longitude, place, formattedAddress</span> (required fields).
                      Optional fields: <span className="font-mono bg-white px-2 py-1 rounded">type, city, state, country, postalCode, summary, imageUrl</span> (semicolon-separated for multiple images).
                    </p>
                  </div>
                </div>

                {/* Address Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentAddresses.map((address) => (
                    <div 
                      key={address.id} 
                      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-gray-200/50 overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
                    >
                      {/* Address Image */}
                      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                        {address.imageUrl && address.imageUrl[0] ? (
                          <img 
                            src={address.imageUrl[0]} 
                            alt={address.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white">
                            <FaMapMarkerAlt className="text-4xl opacity-50" />
                          </div>
                        )}
                        
                        {/* Type Badge */}
                        {address.type && (
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                            {address.type}
                          </div>
                        )}
                        
                        {/* Image Count Badge */}
                        {address.imageUrl && address.imageUrl.length > 1 && (
                          <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <FaImage />
                            {address.imageUrl.length}
                          </div>
                        )}
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{address.name}</h3>
                        <p className="text-gray-600 mb-2">{address.place}</p>
                        
                        {address.summary && (
                          <p className="text-gray-500 text-sm mb-4 line-clamp-2">{address.summary}</p>
                        )}
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <FaMapMarkerAlt className="text-xs" />
                            <span>{address.latitude}, {address.longitude}</span>
                          </div>
                          {address.city && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <FaHome className="text-xs" />
                              <span>{address.city}, {address.state}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditAddress(address)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 font-medium transition-colors duration-300"
                          >
                            <FaEdit className="text-sm" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address.id!)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 font-medium transition-colors duration-300"
                          >
                            <FaTrash className="text-sm" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-3 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <FaChevronLeft />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-3 rounded-xl bg-white border-2 border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
                
                {/* Results Count */}
                <div className="text-center text-gray-600">
                  Showing {currentAddresses.length} of {filteredAddresses.length} addresses
                  {searchQuery && (
                    <span className="ml-2">
                      for "<span className="font-medium text-blue-600">{searchQuery}</span>"
                    </span>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      <AddressFormModal
        visible={isAddModalVisible}
        onClose={() => {
          setIsAddModalVisible(false);
        }}
        onSubmit={handleAddAddress}
        title="✨ Add New Address"
      />

      <AddressFormModal
        visible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingAddress(null);
        }}
        onSubmit={handleUpdateAddress}
        title="🚀 Edit Address"
        address={editingAddress}
      />

      <NotificationComponent />
      
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default AdminDashboard;
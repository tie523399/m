import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingCart, FaArrowLeft, FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCartStore, useAppStore } from '../store';
import { Product, Flavor, CartItem } from '../types';
import { productAPI, flavorAPI } from '../services/api';
import AnnouncementBanner from '../components/AnnouncementBanner';
import ProductCard from '../components/ProductCard';
import FlavorSelector from '../components/FlavorSelector';
import ShoppingCart from '../components/ShoppingCart';

const CustomerPage = () => {
  const navigate = useNavigate();
  const { 
    items: cartItems, 
    addItem, 
    removeItem, 
    updateQuantity, 
    getTotalAmount, 
    getTotalItems 
  } = useCartStore();
  
  const { 
    products, 
    flavors, 
    setProducts, 
    setFlavors, 
    isLoading, 
    setLoading, 
    setError 
  } = useAppStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<Flavor[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [productFilter, setProductFilter] = useState<'all' | 'base' | 'topping'>('all');

  // 載入產品和口味數據
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, flavorsResponse] = await Promise.all([
          productAPI.getAll(),
          flavorAPI.getAll()
        ]);

        if (productsResponse.success && productsResponse.data) {
          setProducts(productsResponse.data.filter(p => p.status === 'active'));
        }

        if (flavorsResponse.success && flavorsResponse.data) {
          setFlavors(flavorsResponse.data.filter(f => f.isActive));
        }
      } catch (error) {
        console.error('載入數據失敗:', error);
        setError('載入數據失敗，請重新整理頁面');
        toast.error('載入數據失敗，請重新整理頁面');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setProducts, setFlavors, setLoading, setError]);

  // 過濾產品
  const filteredProducts = products.filter(product => {
    if (productFilter === 'all') return true;
    return product.category === productFilter;
  });

  // 添加到購物車
  const handleAddToCart = () => {
    if (!selectedProduct) {
      toast.error('請選擇產品');
      return;
    }

    if (selectedFlavors.length === 0) {
      toast.error('請選擇至少一種口味');
      return;
    }

    if (selectedFlavors.length > 5) {
      toast.error('最多只能選擇5種口味');
      return;
    }

    const totalFlavorPrice = selectedFlavors.reduce((sum, flavor) => sum + flavor.price, 0);
    const unitPrice = selectedProduct.basePrice + totalFlavorPrice;
    
    const cartItem: CartItem = {
      id: `${selectedProduct.id}-${Date.now()}-${Math.random()}`,
      product: selectedProduct,
      flavors: selectedFlavors,
      quantity,
      subtotal: unitPrice * quantity
    };

    addItem(cartItem);
    toast.success(`已添加 ${quantity} 個 ${selectedProduct.name} 到購物車`);
    
    // 重置選擇
    setSelectedProduct(null);
    setSelectedFlavors([]);
    setQuantity(1);
  };

  // 計算當前選擇的總價
  const getCurrentPrice = () => {
    if (!selectedProduct) return 0;
    const flavorPrice = selectedFlavors.reduce((sum, flavor) => sum + flavor.price, 0);
    return (selectedProduct.basePrice + flavorPrice) * quantity;
  };

  if (isLoading) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <motion.div
          className=\"text-center\"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className=\"text-6xl mb-4\">🍨</div>
          <p className=\"text-xl text-gray-600\">載入中...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* 公告橫幅 */}
      <AnnouncementBanner />
      
      {/* 導航欄 */}
      <nav className=\"bg-white shadow-sm border-b\">
        <div className=\"container mx-auto px-4 py-4\">
          <div className=\"flex items-center justify-between\">
            <div className=\"flex items-center space-x-4\">
              <button
                onClick={() => navigate('/')}
                className=\"flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors\"
              >
                <FaArrowLeft />
                <span>返回首頁</span>
              </button>
              <h1 className=\"text-2xl font-bold text-gray-800\">義式冰淇淋訂購</h1>
            </div>
            
            {/* 購物車按鈕 */}
            <button
              onClick={() => setShowCart(true)}
              className=\"relative bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2\"
            >
              <FaShoppingCart />
              <span>購物車</span>
              {getTotalItems() > 0 && (
                <motion.span
                  className=\"absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center\"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={getTotalItems()}
                >
                  {getTotalItems()}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className=\"container mx-auto px-4 py-8\">
        <div className=\"grid lg:grid-cols-3 gap-8\">
          {/* 產品選擇區域 */}
          <div className=\"lg:col-span-2 space-y-8\">
            {/* 產品分類篩選 */}
            <div className=\"bg-white rounded-lg shadow-sm p-6\">
              <h2 className=\"text-xl font-bold text-gray-800 mb-4\">選擇產品</h2>
              <div className=\"flex space-x-2 mb-6\">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'base', label: '基底口味' },
                  { value: 'topping', label: '精選配料' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setProductFilter(option.value as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      productFilter === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {/* 產品網格 */}
              <div className=\"grid md:grid-cols-2 xl:grid-cols-3 gap-4\">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProduct?.id === product.id}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className=\"text-center py-8 text-gray-500\">
                  暫無產品可選
                </div>
              )}
            </div>

            {/* 口味選擇區域 */}
            {selectedProduct && (
              <motion.div
                className=\"bg-white rounded-lg shadow-sm p-6\"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className=\"text-xl font-bold text-gray-800 mb-4\">選擇口味</h2>
                <p className=\"text-gray-600 mb-4\">已選擇：{selectedProduct.name} (最多選擇5種口味)</p>
                
                <FlavorSelector
                  flavors={flavors}
                  selectedFlavors={selectedFlavors}
                  onFlavorChange={setSelectedFlavors}
                  maxSelection={5}
                />
              </motion.div>
            )}
          </div>

          {/* 訂單摘要區域 */}
          <div className=\"space-y-6\">
            {/* 當前選擇摘要 */}
            <div className=\"bg-white rounded-lg shadow-sm p-6 sticky top-4\">
              <h3 className=\"text-lg font-bold text-gray-800 mb-4\">訂單摘要</h3>
              
              {selectedProduct ? (
                <div className=\"space-y-4\">
                  <div className=\"border-b pb-4\">
                    <h4 className=\"font-medium text-gray-800\">{selectedProduct.name}</h4>
                    <p className=\"text-sm text-gray-600\">基底價格：NT$ {selectedProduct.basePrice}</p>
                    
                    {selectedFlavors.length > 0 && (
                      <div className=\"mt-2\">
                        <p className=\"text-sm text-gray-600 mb-1\">已選口味：</p>
                        <div className=\"space-y-1\">
                          {selectedFlavors.map(flavor => (
                            <div key={flavor.id} className=\"flex justify-between text-sm\">
                              <span>{flavor.name}</span>
                              <span>+NT$ {flavor.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 數量選擇 */}
                  <div className=\"flex items-center justify-between\">
                    <span className=\"font-medium\">數量：</span>
                    <div className=\"flex items-center space-x-3\">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className=\"p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors\"
                      >
                        <FaMinus className=\"text-sm\" />
                      </button>
                      <span className=\"w-8 text-center font-medium\">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className=\"p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors\"
                      >
                        <FaPlus className=\"text-sm\" />
                      </button>
                    </div>
                  </div>
                  
                  {/* 小計 */}
                  <div className=\"flex justify-between text-lg font-bold text-blue-600 pt-4 border-t\">
                    <span>小計：</span>
                    <span>NT$ {getCurrentPrice()}</span>
                  </div>
                  
                  {/* 添加到購物車按鈕 */}
                  <button
                    onClick={handleAddToCart}
                    disabled={selectedFlavors.length === 0}
                    className=\"w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors\"
                  >
                    加入購物車
                  </button>
                </div>
              ) : (
                <div className=\"text-center py-8 text-gray-500\">
                  請先選擇產品
                </div>
              )}
            </div>
            
            {/* 購物車快覽 */}
            {cartItems.length > 0 && (
              <div className=\"bg-white rounded-lg shadow-sm p-6\">
                <div className=\"flex items-center justify-between mb-4\">
                  <h3 className=\"text-lg font-bold text-gray-800\">購物車</h3>
                  <span className=\"text-sm text-gray-600\">{getTotalItems()} 件商品</span>
                </div>
                
                <div className=\"space-y-3 max-h-64 overflow-y-auto\">
                  {cartItems.map(item => (
                    <div key={item.id} className=\"flex items-center justify-between p-3 bg-gray-50 rounded-lg\">
                      <div className=\"flex-1\">
                        <h4 className=\"font-medium text-sm\">{item.product.name}</h4>
                        <p className=\"text-xs text-gray-600\">
                          口味：{item.flavors.map(f => f.name).join(', ')}
                        </p>
                        <p className=\"text-xs text-gray-600\">數量：{item.quantity}</p>
                      </div>
                      <div className=\"text-right\">
                        <p className=\"font-medium text-sm\">NT$ {item.subtotal}</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className=\"text-red-500 hover:text-red-700 text-xs mt-1\"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className=\"mt-4 pt-4 border-t\">
                  <div className=\"flex justify-between font-bold text-lg\">
                    <span>總計：</span>
                    <span className=\"text-green-600\">NT$ {getTotalAmount()}</span>
                  </div>
                  <button
                    onClick={() => setShowCart(true)}
                    className=\"w-full mt-3 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors\"
                  >
                    查看購物車
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 購物車側邊欄 */}
      <ShoppingCart 
        isOpen={showCart} 
        onClose={() => setShowCart(false)} 
      />
    </div>
  );
};

export default CustomerPage;",
        "file_text": "import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingCart, FaArrowLeft, FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCartStore, useAppStore } from '../store';
import { Product, Flavor, CartItem } from '../types';
import { productAPI, flavorAPI } from '../services/api';
import AnnouncementBanner from '../components/AnnouncementBanner';
import ProductCard from '../components/ProductCard';
import FlavorSelector from '../components/FlavorSelector';
import ShoppingCart from '../components/ShoppingCart';

const CustomerPage = () => {
  const navigate = useNavigate();
  const { 
    items: cartItems, 
    addItem, 
    removeItem, 
    updateQuantity, 
    getTotalAmount, 
    getTotalItems 
  } = useCartStore();
  
  const { 
    products, 
    flavors, 
    setProducts, 
    setFlavors, 
    isLoading, 
    setLoading, 
    setError 
  } = useAppStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<Flavor[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [productFilter, setProductFilter] = useState<'all' | 'base' | 'topping'>('all');

  // 載入產品和口味數據
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, flavorsResponse] = await Promise.all([
          productAPI.getAll(),
          flavorAPI.getAll()
        ]);

        if (productsResponse.success && productsResponse.data) {
          setProducts(productsResponse.data.filter(p => p.status === 'active'));
        }

        if (flavorsResponse.success && flavorsResponse.data) {
          setFlavors(flavorsResponse.data.filter(f => f.isActive));
        }
      } catch (error) {
        console.error('載入數據失敗:', error);
        setError('載入數據失敗，請重新整理頁面');
        toast.error('載入數據失敗，請重新整理頁面');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setProducts, setFlavors, setLoading, setError]);

  // 過濾產品
  const filteredProducts = products.filter(product => {
    if (productFilter === 'all') return true;
    return product.category === productFilter;
  });

  // 添加到購物車
  const handleAddToCart = () => {
    if (!selectedProduct) {
      toast.error('請選擇產品');
      return;
    }

    if (selectedFlavors.length === 0) {
      toast.error('請選擇至少一種口味');
      return;
    }

    if (selectedFlavors.length > 5) {
      toast.error('最多只能選擇5種口味');
      return;
    }

    const totalFlavorPrice = selectedFlavors.reduce((sum, flavor) => sum + flavor.price, 0);
    const unitPrice = selectedProduct.basePrice + totalFlavorPrice;
    
    const cartItem: CartItem = {
      id: `${selectedProduct.id}-${Date.now()}-${Math.random()}`,
      product: selectedProduct,
      flavors: selectedFlavors,
      quantity,
      subtotal: unitPrice * quantity
    };

    addItem(cartItem);
    toast.success(`已添加 ${quantity} 個 ${selectedProduct.name} 到購物車`);
    
    // 重置選擇
    setSelectedProduct(null);
    setSelectedFlavors([]);
    setQuantity(1);
  };

  // 計算當前選擇的總價
  const getCurrentPrice = () => {
    if (!selectedProduct) return 0;
    const flavorPrice = selectedFlavors.reduce((sum, flavor) => sum + flavor.price, 0);
    return (selectedProduct.basePrice + flavorPrice) * quantity;
  };

  if (isLoading) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <motion.div
          className=\"text-center\"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className=\"text-6xl mb-4\">🍨</div>
          <p className=\"text-xl text-gray-600\">載入中...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* 公告橫幅 */}
      <AnnouncementBanner />
      
      {/* 導航欄 */}
      <nav className=\"bg-white shadow-sm border-b\">
        <div className=\"container mx-auto px-4 py-4\">
          <div className=\"flex items-center justify-between\">
            <div className=\"flex items-center space-x-4\">
              <button
                onClick={() => navigate('/')}
                className=\"flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors\"
              >
                <FaArrowLeft />
                <span>返回首頁</span>
              </button>
              <h1 className=\"text-2xl font-bold text-gray-800\">義式冰淇淋訂購</h1>
            </div>
            
            {/* 購物車按鈕 */}
            <button
              onClick={() => setShowCart(true)}
              className=\"relative bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2\"
            >
              <FaShoppingCart />
              <span>購物車</span>
              {getTotalItems() > 0 && (
                <motion.span
                  className=\"absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center\"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={getTotalItems()}
                >
                  {getTotalItems()}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <div className=\"container mx-auto px-4 py-8\">
        <div className=\"grid lg:grid-cols-3 gap-8\">
          {/* 產品選擇區域 */}
          <div className=\"lg:col-span-2 space-y-8\">
            {/* 產品分類篩選 */}
            <div className=\"bg-white rounded-lg shadow-sm p-6\">
              <h2 className=\"text-xl font-bold text-gray-800 mb-4\">選擇產品</h2>
              <div className=\"flex space-x-2 mb-6\">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'base', label: '基底口味' },
                  { value: 'topping', label: '精選配料' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setProductFilter(option.value as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      productFilter === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {/* 產品網格 */}
              <div className=\"grid md:grid-cols-2 xl:grid-cols-3 gap-4\">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProduct?.id === product.id}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className=\"text-center py-8 text-gray-500\">
                  暫無產品可選
                </div>
              )}
            </div>

            {/* 口味選擇區域 */}
            {selectedProduct && (
              <motion.div
                className=\"bg-white rounded-lg shadow-sm p-6\"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className=\"text-xl font-bold text-gray-800 mb-4\">選擇口味</h2>
                <p className=\"text-gray-600 mb-4\">已選擇：{selectedProduct.name} (最多選擇5種口味)</p>
                
                <FlavorSelector
                  flavors={flavors}
                  selectedFlavors={selectedFlavors}
                  onFlavorChange={setSelectedFlavors}
                  maxSelection={5}
                />
              </motion.div>
            )}
          </div>

          {/* 訂單摘要區域 */}
          <div className=\"space-y-6\">
            {/* 當前選擇摘要 */}
            <div className=\"bg-white rounded-lg shadow-sm p-6 sticky top-4\">
              <h3 className=\"text-lg font-bold text-gray-800 mb-4\">訂單摘要</h3>
              
              {selectedProduct ? (
                <div className=\"space-y-4\">
                  <div className=\"border-b pb-4\">
                    <h4 className=\"font-medium text-gray-800\">{selectedProduct.name}</h4>
                    <p className=\"text-sm text-gray-600\">基底價格：NT$ {selectedProduct.basePrice}</p>
                    
                    {selectedFlavors.length > 0 && (
                      <div className=\"mt-2\">
                        <p className=\"text-sm text-gray-600 mb-1\">已選口味：</p>
                        <div className=\"space-y-1\">
                          {selectedFlavors.map(flavor => (
                            <div key={flavor.id} className=\"flex justify-between text-sm\">
                              <span>{flavor.name}</span>
                              <span>+NT$ {flavor.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 數量選擇 */}
                  <div className=\"flex items-center justify-between\">
                    <span className=\"font-medium\">數量：</span>
                    <div className=\"flex items-center space-x-3\">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className=\"p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors\"
                      >
                        <FaMinus className=\"text-sm\" />
                      </button>
                      <span className=\"w-8 text-center font-medium\">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className=\"p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors\"
                      >
                        <FaPlus className=\"text-sm\" />
                      </button>
                    </div>
                  </div>
                  
                  {/* 小計 */}
                  <div className=\"flex justify-between text-lg font-bold text-blue-600 pt-4 border-t\">
                    <span>小計：</span>
                    <span>NT$ {getCurrentPrice()}</span>
                  </div>
                  
                  {/* 添加到購物車按鈕 */}
                  <button
                    onClick={handleAddToCart}
                    disabled={selectedFlavors.length === 0}
                    className=\"w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors\"
                  >
                    加入購物車
                  </button>
                </div>
              ) : (
                <div className=\"text-center py-8 text-gray-500\">
                  請先選擇產品
                </div>
              )}
            </div>
            
            {/* 購物車快覽 */}
            {cartItems.length > 0 && (
              <div className=\"bg-white rounded-lg shadow-sm p-6\">
                <div className=\"flex items-center justify-between mb-4\">
                  <h3 className=\"text-lg font-bold text-gray-800\">購物車</h3>
                  <span className=\"text-sm text-gray-600\">{getTotalItems()} 件商品</span>
                </div>
                
                <div className=\"space-y-3 max-h-64 overflow-y-auto\">
                  {cartItems.map(item => (
                    <div key={item.id} className=\"flex items-center justify-between p-3 bg-gray-50 rounded-lg\">
                      <div className=\"flex-1\">
                        <h4 className=\"font-medium text-sm\">{item.product.name}</h4>
                        <p className=\"text-xs text-gray-600\">
                          口味：{item.flavors.map(f => f.name).join(', ')}
                        </p>
                        <p className=\"text-xs text-gray-600\">數量：{item.quantity}</p>
                      </div>
                      <div className=\"text-right\">
                        <p className=\"font-medium text-sm\">NT$ {item.subtotal}</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className=\"text-red-500 hover:text-red-700 text-xs mt-1\"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className=\"mt-4 pt-4 border-t\">
                  <div className=\"flex justify-between font-bold text-lg\">
                    <span>總計：</span>
                    <span className=\"text-green-600\">NT$ {getTotalAmount()}</span>
                  </div>
                  <button
                    onClick={() => setShowCart(true)}
                    className=\"w-full mt-3 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors\"
                  >
                    查看購物車
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 購物車側邊欄 */}
      <ShoppingCart 
        isOpen={showCart} 
        onClose={() => setShowCart(false)} 
      />
    </div>
  );
};

export default CustomerPage;"

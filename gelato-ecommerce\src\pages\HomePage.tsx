import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaIceCream, FaUser, FaShoppingCart } from 'react-icons/fa';
import { useAdminEntryStore } from '../store';
import AnnouncementBanner from '../components/AnnouncementBanner';

const HomePage = () => {
  const navigate = useNavigate();
  const { clickCount, increment, reset } = useAdminEntryStore();

  // 監聽點擊次數，達到5次時進入管理員登入頁面
  useEffect(() => {
    if (clickCount >= 5) {
      navigate('/admin/login');
      reset();
    }
  }, [clickCount, navigate, reset]);

  // 重置點擊計數器
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clickCount > 0 && clickCount < 5) {
        reset();
      }
    }, 3000); // 3秒後重置

    return () => clearTimeout(timer);
  }, [clickCount, reset]);

  const handleLogoClick = () => {
    increment();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* 公告橫幅 */}
      <AnnouncementBanner />
      
      {/* 主要內容 */}
      <div className=\"container mx-auto px-4 py-8\">
        {/* 品牌標題區域 */}
        <motion.div 
          className=\"text-center mb-16\"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo - 點擊5次進入管理員模式 */}
          <motion.div
            className=\"inline-block cursor-pointer\"
            onClick={handleLogoClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className=\"text-8xl mb-4 select-none\">🍨</div>
          </motion.div>
          
          <h1 className=\"text-6xl font-bold text-gray-800 mb-4\">
            海水不可斗量
          </h1>
          <p className=\"text-2xl text-gray-600 font-light mb-2\">
            THE SEA IS IMMEASURABLE
          </p>
          <p className=\"text-lg text-gray-500\">
            義式手工冰淇淋專賣店
          </p>
          
          {/* 隱藏的點擊計數提示 */}
          {clickCount > 0 && clickCount < 5 && (
            <motion.div 
              className=\"mt-4 text-sm text-gray-400\"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              管理員入口：{clickCount}/5
            </motion.div>
          )}
        </motion.div>

        {/* 功能選項卡片 */}
        <div className=\"grid md:grid-cols-2 gap-8 max-w-4xl mx-auto\">
          {/* 客戶訂購系統 */}
          <motion.div
            className=\"bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer\"
            onClick={() => navigate('/customer')}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className=\"flex items-center justify-center mb-6\">
              <div className=\"bg-green-100 p-4 rounded-full\">
                <FaShoppingCart className=\"text-3xl text-green-600\" />
              </div>
            </div>
            <h2 className=\"text-2xl font-bold text-center text-gray-800 mb-4\">
              線上訂購系統
            </h2>
            <p className=\"text-gray-600 text-center mb-6\">
              選擇您喜愛的口味與配料<br />
              便利的線上訂購體驗
            </p>
            <div className=\"flex items-center justify-center\">
              <span className=\"bg-green-500 text-white px-6 py-2 rounded-full font-medium\">
                開始訂購 🍨
              </span>
            </div>
          </motion.div>

          {/* 管理後台系統 */}
          <motion.div
            className=\"bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer\"
            onClick={() => navigate('/admin')}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className=\"flex items-center justify-center mb-6\">
              <div className=\"bg-blue-100 p-4 rounded-full\">
                <FaUser className=\"text-3xl text-blue-600\" />
              </div>
            </div>
            <h2 className=\"text-2xl font-bold text-center text-gray-800 mb-4\">
              管理後台系統
            </h2>
            <p className=\"text-gray-600 text-center mb-6\">
              訂單管理、產品管理<br />
              數據分析與營運控制
            </p>
            <div className=\"flex items-center justify-center\">
              <span className=\"bg-blue-500 text-white px-6 py-2 rounded-full font-medium\">
                管理後台 📊
              </span>
            </div>
          </motion.div>
        </div>

        {/* 品牌介紹 */}
        <motion.div 
          className=\"text-center mt-16 max-w-2xl mx-auto\"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h3 className=\"text-3xl font-bold text-gray-800 mb-6\">
            義式工藝，匠心獨運
          </h3>
          <p className=\"text-gray-600 leading-relaxed text-lg\">
            堅持使用優質原料，每一口都是純正的義式風味。<br />
            從經典香草到創新口味，為您帶來無與倫比的味覺享受。<br />
            支援7-11超商取貨付款，讓美味觸手可及。
          </p>
        </motion.div>

        {/* 特色說明 */}
        <motion.div 
          className=\"grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto\"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className=\"text-center p-6\">
            <div className=\"text-4xl mb-4\">🏪</div>
            <h4 className=\"font-bold text-gray-800 mb-2\">超商取貨</h4>
            <p className=\"text-gray-600 text-sm\">全台7-11門市取貨付款</p>
          </div>
          <div className=\"text-center p-6\">
            <div className=\"text-4xl mb-4\">🎯</div>
            <h4 className=\"font-bold text-gray-800 mb-2\">客製口味</h4>
            <p className=\"text-gray-600 text-sm\">多種基底與配料自由搭配</p>
          </div>
          <div className=\"text-center p-6\">
            <div className=\"text-4xl mb-4\">💎</div>
            <h4 className=\"font-bold text-gray-800 mb-2\">品質保證</h4>
            <p className=\"text-gray-600 text-sm\">新鮮製作，品質嚴格把關</p>
          </div>
        </motion.div>
      </div>

      {/* 頁腳 */}
      <footer className=\"bg-gray-100 py-8 mt-16\">
        <div className=\"container mx-auto px-4 text-center\">
          <p className=\"text-gray-600\">
            © 2025 海水不可斗量義式手工冰淇淋. 保留所有權利.
          </p>
          <p className=\"text-gray-500 text-sm mt-2\">
            Powered by MiniMax Agent
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

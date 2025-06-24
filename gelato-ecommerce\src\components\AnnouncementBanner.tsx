import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBullhorn, FaTimes } from 'react-icons/fa';
import { useAppStore } from '../store';
import { announcementAPI } from '../services/api';
import './TypewriterAnimation.css';

const AnnouncementBanner = () => {
  const { announcements, setAnnouncements } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // 獲取活躍的公告
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await announcementAPI.getActive();
        if (response.success && response.data) {
          setAnnouncements(response.data);
        }
      } catch (error) {
        console.error('獲取公告失敗:', error);
      }
    };

    fetchAnnouncements();
  }, [setAnnouncements]);

  // 打字機效果
  useEffect(() => {
    if (announcements.length === 0) return;

    const currentAnnouncement = announcements[currentIndex];
    if (!currentAnnouncement) return;

    const text = currentAnnouncement.content;
    let charIndex = 0;
    setDisplayText('');
    setIsTyping(true);

    const typewriterInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayText(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typewriterInterval);
        
        // 打字完成後停留3秒，然後切換到下一條公告
        setTimeout(() => {
          if (announcements.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % announcements.length);
          }
        }, 3000);
      }
    }, 100); // 打字速度

    return () => clearInterval(typewriterInterval);
  }, [currentIndex, announcements]);

  // 如果沒有公告或用戶隱藏了橫幅，不顯示
  if (!isVisible || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        className=\"bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 px-4 relative overflow-hidden\"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 背景動畫 */}
        <div className=\"absolute inset-0 bg-white opacity-10\">
          <div className=\"absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse\" />
        </div>

        <div className=\"container mx-auto flex items-center justify-between relative z-10\">
          {/* 公告圖標 */}
          <div className=\"flex items-center space-x-3\">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <FaBullhorn className=\"text-xl\" />
            </motion.div>
            
            {/* 公告標題和內容 */}
            <div className=\"flex items-center space-x-4\">
              <span className=\"font-bold text-sm uppercase tracking-wide\">
                {currentAnnouncement?.title || '公告'}
              </span>
              <span className=\"hidden md:block w-px h-4 bg-white opacity-50\" />
              <div className=\"typewriter-container\">
                <span className=\"typewriter-text text-sm md:text-base\">
                  {displayText}
                  {isTyping && (
                    <motion.span
                      className=\"typewriter-cursor\"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                    >
                      |
                    </motion.span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 公告控制 */}
          <div className=\"flex items-center space-x-2\">
            {/* 公告指示器 */}
            {announcements.length > 1 && (
              <div className=\"hidden md:flex items-center space-x-1\">
                {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${\n                      index === currentIndex \n                        ? 'bg-white' \n                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'\n                    }`}
                  />
                ))}
              </div>
            )}

            {/* 關閉按鈕 */}
            <button
              onClick={() => setIsVisible(false)}
              className=\"p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200\"
              aria-label=\"關閉公告\"
            >
              <FaTimes className=\"text-sm\" />
            </button>
          </div>
        </div>

        {/* 進度條 */}
        {isTyping && (
          <motion.div
            className=\"absolute bottom-0 left-0 h-0.5 bg-white bg-opacity-60\"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: displayText.length * 0.1 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBanner;

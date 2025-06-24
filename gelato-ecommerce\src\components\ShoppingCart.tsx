import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/store';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const ShoppingCart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const [captchaUrl, setCaptchaUrl] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const navigate = useNavigate();

  const fetchCaptcha = async () => {
    // 添加时间戳以防止缓存
    const response = await api.get(`/captcha?t=${new Date().getTime()}`, { responseType: 'blob' });
    setCaptchaUrl(URL.createObjectURL(response.data));
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => {
    // 将验证码存入 state 或传递到下一页
    navigate('/checkout', { state: { captcha: captchaInput } });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">購物車</h2>
      {items.length === 0 ? (
        <p>您的購物車是空的。</p>
      ) : (
        <>
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-2 border-b">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">NT$ {item.price}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                <span>{item.quantity}</span>
                <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)}>移除</Button>
              </div>
            </div>
          ))}
          <div className="text-right font-bold text-lg">總計: NT$ {total}</div>
          
          {/* Captcha Section */}
          <div className="flex items-center space-x-2 pt-4">
              <img src={captchaUrl} alt="Captcha" className="h-12 w-32 bg-gray-200 rounded-md" />
              <Button variant="outline" onClick={fetchCaptcha}>刷新</Button>
          </div>
          <Input 
              placeholder="請輸入驗證碼"
              value={captchaInput}
              onChange={e => setCaptchaInput(e.target.value)}
          />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={clearCart}>清空購物車</Button>
            <Button onClick={handleCheckout} disabled={!captchaInput}>前往結帳</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;

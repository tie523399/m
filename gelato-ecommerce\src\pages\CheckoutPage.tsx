import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCartStore } from '@/store';
import { api } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';

// --- Zod Schema for Validation ---
const checkoutSchema = z.object({
  customerName: z.string().min(1, '姓名為必填項'),
  customerPhone: z.string().regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼'),
  storeNumber: z.string().min(1, '7-11門市編號為必填項'),
});

const CheckoutPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, clearCart } = useCartStore();
  const captcha = location.state?.captcha;
  
  const [storeInfo, setStoreInfo] = useState<{ name: string; address: string } | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { customerName: '', customerPhone: '', storeNumber: '' },
  });

  const handleValidateStore = async () => {
    const storeNumber = form.getValues('storeNumber');
    if (!storeNumber) return;
    try {
      const response = await api.post('/shipping/711/validate_store', { storeNumber });
      if (response.data.success) {
        setStoreInfo(response.data.data);
        setStoreError(null);
      } else {
        setStoreInfo(null);
        setStoreError(response.data.message);
      }
    } catch (error: any) {
      setStoreInfo(null);
      setStoreError(error.response?.data?.message || '驗證失敗');
    }
  };

  const onSubmit = async (values: z.infer<typeof checkoutSchema>) => {
    if (!captcha) {
      toast({ title: "錯誤", description: "缺少驗證碼，請返回購物車重試", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
        toast({ title: "錯誤", description: "您的購物車是空的", variant: "destructive" });
        return;
    }

    const orderData = {
      ...values,
      items: items.map(item => ({ productId: item.id, quantity: item.quantity, flavorIds: item.flavorIds || [] })),
      captcha,
    };

    try {
      const response = await api.post('/orders', orderData);
      if (response.data.success) {
        toast({ title: "成功", description: "您的訂單已成功提交！" });
        clearCart();
        // 可導向訂單成功頁面，並顯示訂單號和驗證碼
        navigate('/'); 
      } else {
        toast({ title: "錯誤", description: response.data.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "錯誤", description: error.response?.data?.message || '提交訂單失敗', variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">結帳</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Info */}
                    <FormField name="customerName" render={({ field }) => (
            <FormItem>
              <FormLabel>收件人姓名</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="customerPhone" render={({ field }) => (
            <FormItem>
              <FormLabel>手機號碼</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Store Info */}
                    <FormField name="storeNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>7-11 門市編號</FormLabel>
              <div className="flex space-x-2">
                <FormControl><Input {...field} /></FormControl>
                <Button type="button" variant="outline" onClick={handleValidateStore}>驗證門市</Button>
              </div>
              <FormMessage />
            </FormItem>
          )} />

          {storeInfo && (
            <div className="p-4 bg-green-100 rounded-md text-green-800">
              <p><strong>門市名稱:</strong> {storeInfo.name}</p>
              <p><strong>門市地址:</strong> {storeInfo.address}</p>
            </div>
          )}
          {storeError && <p className="text-red-500">{storeError}</p>}

          <Button type="submit" className="w-full">確認下單</Button>
        </form>
      </Form>
    </div>
  );
};

export default CheckoutPage;

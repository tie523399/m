import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';

// --- Zod Schema for Validation ---
const productSchema = z.object({
  name: z.string().min(1, '產品名稱為必填項'),
  description: z.string().optional(),
  category: z.string().min(1, '產品分類為必填項'),
  base_price: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive('價格必須為正數')),
  stock: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().int().min(0, '庫存不能為負數')),
  status: z.enum(['active', 'inactive']),
  image: z.any().optional()
});

// --- TypeScript Interface ---
type Product = z.infer<typeof productSchema> & { id: string, imageUrl: string };

// --- Main Component ---
const ProductManagement: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      base_price: 0,
      stock: 0,
      status: 'active',
    },
  });

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products');
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        toast({ title: "錯誤", description: "無法加載產品列表", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "錯誤", description: "無法連接到伺服器", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'image' && value instanceof FileList) {
        if (value.length > 0) formData.append(key, value[0]);
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    try {
      const promise = editingProduct
        ? api.put(`/products/${editingProduct.id}`, formData)
        : api.post('/products', formData);

      await promise;
      toast({ title: "成功", description: `產品已成功${editingProduct ? '更新' : '創建'}` });
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast({ title: "錯誤", description: error.response?.data?.message || "操作失敗", variant: "destructive" });
    }
  };

  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    form.reset(
      product
        ? { ...product, base_price: product.base_price, stock: product.stock, status: product.status || 'inactive' }
        : { name: '', description: '', category: '', base_price: 0, stock: 0, status: 'active' }
    );
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("確定要刪除此產品嗎？")) return;
    try {
      await api.delete(`/products/${id}`);
      toast({ title: "成功", description: "產品已刪除" });
      fetchProducts();
    } catch (error: any) {
      toast({ title: "錯誤", description: error.response?.data?.message || "刪除失敗", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">產品管理</h2>
        <Button onClick={() => openModal()}>新增產品</Button>
      </div>
      
      {/* Product Table */}
      <Table>
                <TableHeader>
          <TableRow>
            <TableHead>圖片</TableHead>
            <TableHead>名稱</TableHead>
            <TableHead>分類</TableHead>
            <TableHead>價格</TableHead>
            <TableHead>庫存</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(p => (
            <TableRow key={p.id}>
              <TableCell><img src={p.imageUrl} alt={p.name} className="h-12 w-12 object-cover rounded-md"/></TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.category}</TableCell>
              <TableCell>NT$ {p.base_price}</TableCell>
              <TableCell>{p.stock}</TableCell>
              <TableCell>{p.status === 'active' ? '上架中' : '已下架'}</TableCell>
              <TableCell className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => openModal(p)}>編輯</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>刪除</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Product Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProduct ? '編輯產品' : '新增產品'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>產品名稱</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField name="category" render={({ field }) => (
                 <FormItem>
                   <FormLabel>分類</FormLabel>
                   <FormControl><Input {...field} /></FormControl>
                   <FormMessage />
                 </FormItem>
              )} />
              <FormField name="base_price" render={({ field }) => (
                <FormItem>
                  <FormLabel>基礎價格</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="stock" render={({ field }) => (
                <FormItem>
                  <FormLabel>庫存</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="status" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <FormLabel>上架狀態</FormLabel>
                  <FormControl><Switch checked={field.value === 'active'} onCheckedChange={c => field.onChange(c ? 'active' : 'inactive')} /></FormControl>
                </FormItem>
              )} />
              <FormField name="image" render={({ field }) => (
                  <FormItem>
                      <FormLabel>產品圖片</FormLabel>
                      <FormControl>
                          <Input type="file" onChange={e => field.onChange(e.target.files)} />
                      </FormControl>
                  </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit">{editingProduct ? '儲存變更' : '創建'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;

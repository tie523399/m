import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from '@/hooks/use-toast';

// --- TypeScript Interfaces ---
type OrderItem = { id: string; productName: string; quantity: number; unitPrice: number; subtotal: number; };
type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};
type PaginationInfo = { page: number; limit: number; total: number; totalPages: number; };

// --- Main Component ---
const OrderManagement: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      const response = await api.get(`/orders?page=${page}&limit=10`);
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setPagination(response.data.data.pagination);
      } else {
        toast({ title: "錯誤", description: "無法加載訂單列表", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "錯誤", description: "無法連接到伺服器", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  const handleSelectionChange = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (orderIds: string[], status: string) => {
    try {
      await api.patch('/orders/batch-status', { orderIds, status });
      toast({ title: "成功", description: "訂單狀態已更新" });
      fetchOrders(currentPage);
      setSelectedOrders([]);
    } catch (error: any) {
      toast({ title: "錯誤", description: error.response?.data?.message || "更新失敗", variant: "destructive" });
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/orders/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: "成功", description: "訂單已開始下載" });
    } catch (error) {
      toast({ title: "錯誤", description: "匯出失敗", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">訂單管理</h2>
        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={selectedOrders.length === 0}>批量操作</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map(status => (
                <DropdownMenuItem key={status} onClick={() => handleStatusChange(selectedOrders, status)}>
                  將狀態更新為: {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleExport}>匯出為 XLS</Button>
        </div>
      </div>

      {/* Order Table */}
            <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onCheckedChange={checked => setSelectedOrders(checked ? orders.map(o => o.id) : [])}
              />
            </TableHead>
            <TableHead>訂單號</TableHead>
            <TableHead>客戶</TableHead>
            <TableHead>總金額</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead>下單時間</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <TableRow key={order.id}>
              <TableCell>
                <Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={() => handleSelectionChange(order.id)} />
              </TableCell>
              <TableCell>{order.orderNumber}</TableCell>
              <TableCell>{order.customerName}</TableCell>
              <TableCell>NT$ {order.totalAmount}</TableCell>
              <TableCell><Badge>{order.status}</Badge></TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleString('zh-TW')}</TableCell>
              <TableCell>
                  {/* 可添加單個訂單操作，如查看詳情 */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
              </PaginationItem>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
      )}
    </div>
  );
};

export default OrderManagement;

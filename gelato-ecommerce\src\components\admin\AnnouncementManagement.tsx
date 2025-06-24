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
const announcementSchema = z.object({
  title: z.string().min(1, '標題為必填項'),
  content: z.string().min(1, '內容為必填項'),
  is_active: z.boolean(),
});

// --- TypeScript Interface ---
type Announcement = z.infer<typeof announcementSchema> & { id: string; createdAt: string; };

// --- Main Component ---
const AnnouncementManagement: React.FC = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '', is_active: true },
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await api.get('/announcements');
      if (response.data.success) {
        setAnnouncements(response.data.data);
      } else {
        toast({ title: "錯誤", description: "無法加載公告列表", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "錯誤", description: "無法連接到伺服器", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const onSubmit = async (values: z.infer<typeof announcementSchema>) => {
    try {
      const promise = editingAnnouncement
        ? api.put(`/announcements/${editingAnnouncement.id}`, values)
        : api.post('/announcements', values);
      
      await promise;
      toast({ title: "成功", description: `公告已成功${editingAnnouncement ? '更新' : '創建'}` });
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (error: any) {
      toast({ title: "錯誤", description: error.response?.data?.message || "操作失敗", variant: "destructive" });
    }
  };

  const openModal = (announcement: Announcement | null = null) => {
    setEditingAnnouncement(announcement);
    form.reset(announcement ? { ...announcement, is_active: !!announcement.is_active } : { title: '', content: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("確定要刪除此公告嗎？")) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast({ title: "成功", description: "公告已刪除" });
      fetchAnnouncements();
    } catch (error: any) {
      toast({ title: "錯誤", description: error.response?.data?.message || "刪除失敗", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/announcements/${id}/toggle`);
      toast({ title: "成功", description: "公告狀態已切換" });
      fetchAnnouncements();
    } catch (error: any) {
      toast({ title: "錯誤", description: error.response?.data?.message || "切換失敗", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">公告管理</h2>
        <Button onClick={() => openModal()}>新增公告</Button>
      </div>

      {/* Announcement Table */}
            <Table>
        <TableHeader>
          <TableRow>
            <TableHead>標題</TableHead>
            <TableHead>內容</TableHead>
            <TableHead>發布時間</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map(a => (
            <TableRow key={a.id}>
              <TableCell>{a.title}</TableCell>
              <TableCell className="max-w-xs truncate">{a.content}</TableCell>
              <TableCell>{new Date(a.createdAt).toLocaleString('zh-TW')}</TableCell>
              <TableCell>
                <Switch checked={a.is_active} onCheckedChange={() => handleToggle(a.id)} />
              </TableCell>
              <TableCell className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => openModal(a)}>編輯</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(a.id)}>刪除</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Announcement Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAnnouncement ? '編輯公告' : '新增公告'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>標題</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>內容</FormLabel>
                  <FormControl><Textarea {...field} rows={5} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="is_active" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <FormLabel>發布狀態</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit">{editingAnnouncement ? '儲存變更' : '創建'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementManagement;

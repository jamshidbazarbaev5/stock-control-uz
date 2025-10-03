import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useGetStocks } from '../../api/stock'
import { WRITEOFF_REASONS, type WriteOff, useCreateWriteOff } from '../../api/writeoff'
import { useState } from 'react';
import { toast } from 'sonner';

interface WriteOffDialogProps {
  open: boolean;
  onClose: () => void;
}

export function WriteOffDialog({ open, onClose }: WriteOffDialogProps) {
  const { t } = useTranslation();
  const [selectedStocks, setSelectedStocks] = useState<{ [key: number]: { quantity: string; store: number } }>({});
  const [reason, setReason] = useState<keyof typeof WRITEOFF_REASONS>('Брак');
  const [notes, setNotes] = useState('');

  const createWriteOff = useCreateWriteOff();
  
  const { data: stocksData } = useGetStocks({
    params: {
      product_zero: false,
    }
  });

  const stocks = stocksData?.results || [];
  
  // Get the store of the first selected stock
  const selectedStore = Object.entries(selectedStocks)[0]?.[1]?.store;

  const handleStockSelect = (stockId: number, checked: boolean, stockStore: number) => {
    if (checked) {
      setSelectedStocks(prev => ({
        ...prev,
        [stockId]: { quantity: '', store: stockStore }
      }));
    } else {
      const { [stockId]: removed, ...rest } = selectedStocks;
      setSelectedStocks(rest);
    }
  };

  const handleQuantityChange = (stockId: number, quantity: string) => {
    setSelectedStocks(prev => ({
      ...prev,
      [stockId]: { ...prev[stockId], quantity }
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!selectedStore) {
        toast.error(t('messages.error.no_stocks_selected'));
        return;
      }

      const items = Object.entries(selectedStocks).map(([stockId, data]) => ({
        stock: parseInt(stockId),
        quantity: parseFloat(data.quantity)
      }));

      if (items.some(item => !item.quantity)) {
        toast.error(t('messages.error.missing_quantities'));
        return;
      }

      const writeOffData: WriteOff = {
        store: selectedStore,
        reason,
        notes,
        items
      };

      await createWriteOff.mutateAsync(writeOffData);
      toast.success(t('messages.success.created', { item: t('navigation.writeoff') }));
      onClose();
      // Reset form
      setSelectedStocks({});
      setReason('Брак');
      setNotes('');
    } catch (error) {
      toast.error(t('messages.error.create', { item: t('navigation.writeoff') }));
      console.error('Failed to create write-off:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">{t('common.create')} {t('navigation.writeoff')}</h2>
        
        <div className="space-y-4">
          <div>
            <Label>{t('forms.reason')}</Label>
            <Select value={reason} onValueChange={(value: keyof typeof WRITEOFF_REASONS) => setReason(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WRITEOFF_REASONS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('forms.notes')}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="border rounded p-4">
            <Label className="mb-2 block">{t('table.products')}</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stocks.map(stock => {
                const isEnabled = !selectedStore || stock.store_read?.id === selectedStore;
                
                return (
                  <div key={stock.id} className="flex items-center gap-4">
                    <Checkbox
                      id={`stock-${stock.id}`}
                      checked={!!selectedStocks[stock.id!]}
                      onCheckedChange={(checked) => 
                        handleStockSelect(stock.id!, checked as boolean, stock.store_read?.id!)
                      }
                      disabled={!isEnabled}
                    />
                    <Label htmlFor={`stock-${stock.id}`} className="flex-grow">
                      {stock.product_read?.product_name} ({stock.store_read?.name})
                    </Label>
                    {selectedStocks[stock.id!] && (
                      <Input
                        type="number"
                        value={selectedStocks[stock.id!].quantity}
                        onChange={e => handleQuantityChange(stock.id!, e.target.value)}
                        placeholder={t('forms.quantity')}
                        className="w-24"
                        min="0"
                        max={stock.quantity}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={createWriteOff.isPending}>
            {createWriteOff.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
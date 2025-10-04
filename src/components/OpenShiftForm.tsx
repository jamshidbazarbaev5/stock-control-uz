import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { Register } from '../core/api/shift';
import { cashRegisterApi } from '../core/api/cash-register';
import { shiftsApi } from '../core/api/shift';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';

interface FormData {
  register_id: string;
  opening_cash: string;
  comment: string;
}

export function OpenShiftForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [registers, setRegisters] = useState<Register[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      register_id: '',
      opening_cash: '',
      comment: '',
    },
  });

  useEffect(() => {
    const fetchRegisters = async () => {
      try {
        const response = await cashRegisterApi.getAll();
        setRegisters(response.data);
      } catch (error) {
        console.error('Failed to fetch registers:', error);
      }
    };

    fetchRegisters();
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await shiftsApi.openShift({
        store: 1, // TODO: Get from context/config
        register_id: parseInt(data.register_id),
        opening_cash: data.opening_cash,
        comment: data.comment,
      });
      navigate('/pos'); // Refresh will show POS interface due to active shift
    } catch (error) {
      console.error('Failed to open shift:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md p-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">{t('Open New Shift')}</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="register_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Register')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select a register')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {registers.map((register) => (
                        <SelectItem
                          key={register.id}
                          value={register.id.toString()}
                        >
                          {register.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opening_cash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Opening Cash')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Comment')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('Add a comment')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('Opening...') : t('Open Shift')}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}

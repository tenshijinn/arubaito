import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const ikigaiSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  telegramHandle: z.string().trim()
    .min(1, "Telegram handle is required")
    .regex(/^@[a-zA-Z0-9_]{5,}$/, "Must be a valid Telegram handle (e.g., @username)"),
  whatYouLove: z.string().trim().min(1, "Required").max(150, "Max 150 characters"),
  whatWorldNeeds: z.string().trim().min(1, "Required").max(150, "Max 150 characters"),
  whatPaidFor: z.string().trim().min(1, "Required").max(150, "Max 150 characters"),
  whatGoodAt: z.string().trim().min(1, "Required").max(150, "Max 150 characters"),
});

export type IkigaiFormData = z.infer<typeof ikigaiSchema>;

interface IkigaiFormProps {
  onSubmit: (data: IkigaiFormData) => void;
  onInputChange: (field: keyof IkigaiFormData, value: string) => void;
  isLoading: boolean;
  isDarkMode: boolean;
}

const IkigaiForm: React.FC<IkigaiFormProps> = ({ 
  onSubmit, 
  onInputChange, 
  isLoading,
  isDarkMode 
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<IkigaiFormData>({
    resolver: zodResolver(ikigaiSchema),
    mode: 'onChange',
  });

  const inputClass = `bg-transparent border-b border-current rounded-none px-0 focus:ring-0 focus:border-primary ${
    isDarkMode ? 'text-white placeholder:text-white/40' : 'text-[#181818] placeholder:text-[#181818]/40'
  }`;

  const labelClass = isDarkMode ? 'text-white/70' : 'text-[#181818]/70';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
        <Label className={labelClass}>NAME</Label>
        <Input
          {...register('name')}
          placeholder="Your name"
          className={inputClass}
          onChange={(e) => {
            register('name').onChange(e);
            onInputChange('name', e.target.value);
          }}
        />
        {errors.name && <p className="text-primary text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label className={labelClass}>TELEGRAM HANDLE</Label>
        <Input
          {...register('telegramHandle')}
          placeholder="@yourusername"
          className={inputClass}
          onChange={(e) => {
            register('telegramHandle').onChange(e);
            onInputChange('telegramHandle', e.target.value);
          }}
        />
        {errors.telegramHandle && <p className="text-primary text-xs mt-1">{errors.telegramHandle.message}</p>}
      </div>

      <div className="space-y-1">
        <Label className={labelClass}>WHAT YOU LOVE</Label>
        <Input
          {...register('whatYouLove')}
          placeholder="Your obsession"
          className={inputClass}
          onChange={(e) => {
            register('whatYouLove').onChange(e);
            onInputChange('whatYouLove', e.target.value);
          }}
        />
        {errors.whatYouLove && <p className="text-primary text-xs mt-1">{errors.whatYouLove.message}</p>}
      </div>

      <div className="space-y-1">
        <Label className={labelClass}>WHAT THE WORLD NEEDS</Label>
        <Input
          {...register('whatWorldNeeds')}
          placeholder="The problem you solve"
          className={inputClass}
          onChange={(e) => {
            register('whatWorldNeeds').onChange(e);
            onInputChange('whatWorldNeeds', e.target.value);
          }}
        />
        {errors.whatWorldNeeds && <p className="text-primary text-xs mt-1">{errors.whatWorldNeeds.message}</p>}
      </div>

      <div className="space-y-1">
        <Label className={labelClass}>WHAT YOU CAN BE PAID FOR</Label>
        <Input
          {...register('whatPaidFor')}
          placeholder="Your offering"
          className={inputClass}
          onChange={(e) => {
            register('whatPaidFor').onChange(e);
            onInputChange('whatPaidFor', e.target.value);
          }}
        />
        {errors.whatPaidFor && <p className="text-primary text-xs mt-1">{errors.whatPaidFor.message}</p>}
      </div>

      <div className="space-y-1">
        <Label className={labelClass}>WHAT YOU ARE GOOD AT</Label>
        <Input
          {...register('whatGoodAt')}
          placeholder="Your skill"
          className={inputClass}
          onChange={(e) => {
            register('whatGoodAt').onChange(e);
            onInputChange('whatGoodAt', e.target.value);
          }}
        />
        {errors.whatGoodAt && <p className="text-primary text-xs mt-1">{errors.whatGoodAt.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full mt-6 bg-primary hover:bg-primary/90 text-white font-bold tracking-wider"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            GENERATING...
          </>
        ) : (
          'GENERATE IKIGAI CARD'
        )}
      </Button>
    </form>
  );
};

export default IkigaiForm;

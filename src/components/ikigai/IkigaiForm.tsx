import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const ikigaiSchema = z.object({
  name: z.string().trim().min(1, "Required").max(25, "Max 25 characters"),
  telegramHandle: z.string().trim()
    .min(1, "Required")
    .max(25, "Max 25 characters")
    .regex(/^@[a-zA-Z0-9_]{4,}$/, "Must be a valid @username"),
  whatYouLove: z.string().trim().min(1, "Required").max(25, "Max 25 characters"),
  whatWorldNeeds: z.string().trim().min(1, "Required").max(25, "Max 25 characters"),
  whatPaidFor: z.string().trim().min(1, "Required").max(25, "Max 25 characters"),
  whatGoodAt: z.string().trim().min(1, "Required").max(25, "Max 25 characters"),
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
    setValue,
    formState: { errors, isValid },
  } = useForm<IkigaiFormData>({
    resolver: zodResolver(ikigaiSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
    },
  });

  // Rounded dark field styling - accent color for dark, dark for light
  const inputClass = `w-full px-4 py-3 rounded-lg border-2 transition-colors ${
    isDarkMode 
      ? 'bg-[#1a1a1a] border-[#ed565a] text-[#ed565a] placeholder:text-[#ed565a]/50 focus:border-[#ed565a] focus:outline-none' 
      : 'bg-transparent border-[#181818] text-[#181818] placeholder:text-[#181818]/50 focus:border-[#181818] focus:outline-none'
  }`;

  const fields: { name: keyof IkigaiFormData; placeholder: string }[] = [
    { name: 'telegramHandle', placeholder: '@YourTelegramHandle' },
    { name: 'whatYouLove', placeholder: 'what you love' },
    { name: 'whatWorldNeeds', placeholder: 'what the world needs' },
    { name: 'whatPaidFor', placeholder: 'what you can be paid for' },
    { name: 'whatGoodAt', placeholder: 'what you are good at' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Hidden name field - we'll get it from telegram handle for simplicity, or add it back */}
      <input type="hidden" {...register('name')} />
      
      {fields.map(({ name, placeholder }) => (
        <div key={name}>
          {(() => {
            const reg = register(name);
            return (
          <input
            {...reg}
            placeholder={placeholder}
            maxLength={25}
            className={inputClass}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '14px' }}
            onChange={(e) => {
              reg.onChange(e);
              onInputChange(name, e.target.value);
              // Auto-set name from telegram handle
              if (name === 'telegramHandle') {
                const handle = e.target.value.replace(/^@/, '').trim();
                setValue('name', handle, { shouldDirty: true, shouldValidate: true });
                onInputChange('name', handle);
              }
            }}
          />
            );
          })()}
          {errors[name] && (
            <p className="text-primary text-xs mt-1">{errors[name]?.message}</p>
          )}
        </div>
      ))}

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="mt-4 px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold tracking-wider rounded-lg"
        style={{ fontFamily: 'Consolas, monospace' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ...
          </>
        ) : (
          'Submit'
        )}
      </Button>
    </form>
  );
};

export default IkigaiForm;
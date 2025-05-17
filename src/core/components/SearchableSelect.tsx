import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { cn } from '../../lib/utils';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import { useTranslation } from 'react-i18next';

export interface SearchableOption {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  createNewLabel?: string;
  onCreateNew?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  createNewLabel,
  onCreateNew,
  isLoading,
  className,
}: SearchableSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (search) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [search, options]);

  const selectedOption = options.find(option => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={isLoading}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={t('common.search') + '...'}
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>
            {createNewLabel && onCreateNew ? (
              <div className="py-3 px-2">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('messages.no_results_found')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    onCreateNew();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createNewLabel}
                </Button>
              </div>
            ) : (
              t('messages.no_results_found')
            )}
          </CommandEmpty>
          <CommandGroup>
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={String(option.value)}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === option.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

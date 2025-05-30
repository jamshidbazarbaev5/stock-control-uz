import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useLanguage } from "@/core/context/LanguageContext";

export const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <Select value={currentLanguage} onValueChange={changeLanguage}>
      <SelectTrigger size="sm">
        <span>{currentLanguage === 'ru' ? 'Руский' : 'Каракалпак'}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ru">
          <div className="flex items-center">
            <span >Руский</span>
          </div>
        </SelectItem>
        <SelectItem value="kaa">
          <div className="flex items-center">
            <span>Каракалпак</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

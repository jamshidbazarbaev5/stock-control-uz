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
        <span className={`fi ${currentLanguage === 'ru' ? 'fi-ru' : 'fi-kaa'}`}></span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ru">
          <div className="flex items-center">
            <span className="fi fi-ru"></span>
          </div>
        </SelectItem>
        <SelectItem value="kaa">
          <div className="flex items-center">
            <span className="fi fi-kaa"></span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

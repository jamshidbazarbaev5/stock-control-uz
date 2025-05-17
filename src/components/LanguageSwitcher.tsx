import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/core/context/LanguageContext";

export const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <Select value={currentLanguage} onValueChange={changeLanguage}>
      <SelectTrigger size="sm">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ru">Русский</SelectItem>
        <SelectItem value="kaa">Қарақалпақ</SelectItem>
      </SelectContent>
    </Select>
  );
};

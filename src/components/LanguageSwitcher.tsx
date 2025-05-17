import { Button } from "@/components/ui/button";
import { useLanguage } from "@/core/context/LanguageContext";

export const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div className="flex gap-2">
      <Button
        variant={currentLanguage === "ru" ? "default" : "outline"}
        onClick={() => changeLanguage("ru")}
        size="sm"
      >
        Русский
      </Button>
      <Button
        variant={currentLanguage === "kaa" ? "default" : "outline"}
        onClick={() => changeLanguage("kaa")}
        size="sm"
      >
        Қарақалпақ
      </Button>
    </div>
  );
};

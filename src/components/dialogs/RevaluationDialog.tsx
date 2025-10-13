import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

interface RevaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    comment: string;
    new_selling_price: string;
    new_min_price: string;
  }) => void;
  selectedCount: number;
}

export function RevaluationDialog({
  isOpen,
  onClose,
  onSubmit,
  selectedCount,
}: RevaluationDialogProps) {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit({
      comment: formData.get("comment") as string,
      new_selling_price: formData.get("new_selling_price") as string,
      new_min_price: formData.get("new_min_price") as string,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("dialogs.revaluation.title", { count: selectedCount })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new_selling_price">
              {t("dialogs.revaluation.new_selling_price")}
            </label>
            <Input
              id="new_selling_price"
              name="new_selling_price"
              type="number"
              step="0.01"
              required
              placeholder={t("dialogs.revaluation.new_selling_price")}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="new_min_price">
              {t("dialogs.revaluation.new_min_price")}
            </label>
            <Input
              id="new_min_price"
              name="new_min_price"
              type="number"
              step="0.01"
              required
              placeholder={t("dialogs.revaluation.new_min_price")}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="comment">{t("dialogs.revaluation.comment")}</label>
            <Textarea
              id="comment"
              name="comment"
              placeholder={t("dialogs.revaluation.comment")}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("buttons.cancel")}
            </Button>
            <Button type="submit">{t("buttons.submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

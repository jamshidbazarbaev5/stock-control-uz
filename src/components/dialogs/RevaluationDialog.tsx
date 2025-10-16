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
import { useState, useEffect } from "react";

interface RevaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    comment: string;
    new_selling_price: string;
    new_min_price: string;
    new_selling_price_in_currency?: string;
  }) => void;
  selectedCount: number;
  sellInCurrencyUnit?: {
    label: string;
    exchange_rate: number;
    action: string;
    conversion: number;
  } | null;
}

export function RevaluationDialog({
  isOpen,
  onClose,
  onSubmit,
  selectedCount,
  sellInCurrencyUnit,
}: RevaluationDialogProps) {
  const { t } = useTranslation();
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [newSellingPriceInCurrency, setNewSellingPriceInCurrency] =
    useState("");
  const [newMinPrice, setNewMinPrice] = useState("");
  const [comment, setComment] = useState("");

  // Calculate selling_price from selling_price_in_currency
  useEffect(() => {
    if (newSellingPriceInCurrency && sellInCurrencyUnit) {
      const priceInCurrency = parseFloat(newSellingPriceInCurrency);
      if (!isNaN(priceInCurrency)) {
        let calculatedPrice: number;

        if (sellInCurrencyUnit.action === "*") {
          calculatedPrice =
            priceInCurrency *
            sellInCurrencyUnit.exchange_rate *
            sellInCurrencyUnit.conversion;
        } else if (sellInCurrencyUnit.action === "/") {
          calculatedPrice =
            (priceInCurrency / sellInCurrencyUnit.exchange_rate) *
            sellInCurrencyUnit.conversion;
        } else {
          calculatedPrice =
            priceInCurrency *
            sellInCurrencyUnit.exchange_rate *
            sellInCurrencyUnit.conversion;
        }

        setNewSellingPrice(calculatedPrice.toFixed(2));
      }
    }
  }, [newSellingPriceInCurrency, sellInCurrencyUnit]);

  // Calculate selling_price_in_currency from selling_price
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (newSellingPrice && sellInCurrencyUnit && !newSellingPriceInCurrency) {
      const price = parseFloat(newSellingPrice);
      if (!isNaN(price)) {
        let calculatedPriceInCurrency: number;

        if (sellInCurrencyUnit.action === "*") {
          calculatedPriceInCurrency =
            price /
            (sellInCurrencyUnit.exchange_rate * sellInCurrencyUnit.conversion);
        } else if (sellInCurrencyUnit.action === "/") {
          calculatedPriceInCurrency =
            (price * sellInCurrencyUnit.exchange_rate) /
            sellInCurrencyUnit.conversion;
        } else {
          calculatedPriceInCurrency =
            price /
            (sellInCurrencyUnit.exchange_rate * sellInCurrencyUnit.conversion);
        }

        setNewSellingPriceInCurrency(calculatedPriceInCurrency.toFixed(2));
      }
    }
  }, [newSellingPrice, sellInCurrencyUnit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      comment,
      new_selling_price: newSellingPrice,
      new_min_price: newMinPrice,
      new_selling_price_in_currency: newSellingPriceInCurrency || undefined,
    });
  };

  const handleClose = () => {
    setNewSellingPrice("");
    setNewSellingPriceInCurrency("");
    setNewMinPrice("");
    setComment("");
    onClose();
  };

  const handleSellingPriceChange = (value: string) => {
    setNewSellingPrice(value);
    // Clear currency price to trigger recalculation
    if (sellInCurrencyUnit) {
      setNewSellingPriceInCurrency("");
    }
  };

  const handleSellingPriceInCurrencyChange = (value: string) => {
    setNewSellingPriceInCurrency(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
              value={newSellingPrice}
              onChange={(e) => handleSellingPriceChange(e.target.value)}
              placeholder={t("dialogs.revaluation.new_selling_price")}
            />
          </div>

          {sellInCurrencyUnit && (
            <div className="space-y-2">
              <label htmlFor="new_selling_price_in_currency">
                {t("dialogs.revaluation.new_selling_price_in_currency")} (
                {sellInCurrencyUnit.label})
              </label>
              <Input
                id="new_selling_price_in_currency"
                name="new_selling_price_in_currency"
                type="number"
                step="0.01"
                value={newSellingPriceInCurrency}
                onChange={(e) =>
                  handleSellingPriceInCurrencyChange(e.target.value)
                }
                placeholder={`${t("dialogs.revaluation.new_selling_price_in_currency")} (${sellInCurrencyUnit.label})`}
              />
              <p className="text-xs text-muted-foreground">
                {sellInCurrencyUnit.action === "*"
                  ? `Formula: Price = Currency Price × ${sellInCurrencyUnit.exchange_rate} × ${sellInCurrencyUnit.conversion}`
                  : `Formula: Price = Currency Price ÷ ${sellInCurrencyUnit.exchange_rate} × ${sellInCurrencyUnit.conversion}`}
              </p>
            </div>
          )}

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
              value={newMinPrice}
              onChange={(e) => setNewMinPrice(e.target.value)}
              placeholder={t("dialogs.revaluation.new_min_price")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="comment">
              {t("dialogs.revaluation.comment")} (необязательно)
            </label>
            <Textarea
              id="comment"
              name="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("dialogs.revaluation.comment")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("buttons.cancel")}
            </Button>
            <Button type="submit">{t("buttons.submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

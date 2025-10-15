import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import type { Recycling } from "../api/recycling";
import type { Product } from "../api/product";
import { useCreateRecycling } from "../api/recycling";
import { useGetProducts } from "../api/product";
import { fetchAllStocks } from "../api/fetchAllStocks";
import { useGetStores } from "../api/store";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface FormValues extends Partial<Recycling> {
  quantity_of_parts?: number;
}

// Helper function to check if a product is recyclable from attribute_values
const isProductRecyclable = (product: any): boolean => {
  if (!product?.attribute_values || !Array.isArray(product.attribute_values)) {
    return false;
  }

  const isRecyclableAttr = product.attribute_values.find(
    (attr: any) => attr.attribute?.name === "is_recyclable",
  );

  return isRecyclableAttr?.value === true;
};

// Helper function to get allowed categories from attribute_values
const getAllowedCategories = (
  product: any,
): Array<{ id: number; name: string }> | null => {
  if (!product?.attribute_values || !Array.isArray(product.attribute_values)) {
    return null;
  }

  const canBeRecycledToAttr = product.attribute_values.find(
    (attr: any) => attr.attribute?.name === "can_be_recycled_to",
  );

  if (canBeRecycledToAttr && canBeRecycledToAttr.attribute?.related_objects) {
    // Get the allowed category IDs
    const allowedIds = Array.isArray(canBeRecycledToAttr.value)
      ? canBeRecycledToAttr.value
      : [];

    // Get the related_objects array which contains {id, name}
    const relatedObjects = canBeRecycledToAttr.attribute.related_objects;

    // Filter to only include categories that are in the allowedIds
    return relatedObjects.filter((obj: any) => allowedIds.includes(obj.id));
  }

  return null;
};

const recyclingFields = (t: any, productSearchTerm: string) => [
  // --- Product Selection ---
  {
    name: "from_to",
    label: t("table.from_product"),
    type: "select",
    placeholder: t("placeholders.select_product"),
    required: true,
    options: [], // Will be populated with stocks
  },
  {
    name: "to_product",
    label: t("table.to_product"),
    type: "searchable-select",
    placeholder: t("placeholders.select_product"),
    required: true,
    options: [], // Will be populated with products
    searchTerm: productSearchTerm,
    onSearch: productSearchTerm,
  },
  // --- Store Selection ---
  {
    name: "store",
    label: t("table.store"),
    type: "select",
    placeholder: t("placeholders.select_store"),
    required: true,
    options: [], // Will be populated with stores
  },
  // --- Amounts ---

  {
    name: "spent_amount",
    label: t("table.spent_amount"),
    type: "string",
    placeholder: t("placeholders.enter_quantity"),
    required: true,
  },
  {
    name: "get_amount",
    label: t("table.get_amount"),
    type: "string",
    placeholder: t("placeholders.enter_quantity"),
    required: true,
  },
  {
    name: "quantity_of_parts",
    label: t("table.quantity_of_part"),
    type: "number",
    placeholder: t("placeholders.quantity_of_parts"),
    required: true,
  },
  // --- Prices ---

  // --- Date ---
  {
    name: "date_of_recycle",
    label: t("table.date"),
    type: "date",
    placeholder: t("placeholders.select_date"),
    required: true,
  },
];

export default function CreateRecycling() {
  const navigate = useNavigate();
  const location = useLocation();
  const createRecycling = useCreateRecycling();
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [allowedCategories, setAllowedCategories] = useState<Array<{
    id: number;
    name: string;
  }> | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  // const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const sellingPriceRef = useRef(false); // To prevent infinite loop

  // Get URL parameters
  const searchParams = new URLSearchParams(location.search);
  const fromProductId = searchParams.get("fromProductId");
  const fromStockId = searchParams.get("fromStockId");
  const storeIdFromUrl = searchParams.get("storeId"); // NEW: get storeId from URL

  // Initialize form with default values
  const form = useForm<FormValues>({
    defaultValues: {
      from_to: fromStockId ? Number(fromStockId) : undefined,
      date_of_recycle: new Date().toISOString().split("T")[0], // Today's date
      store: storeIdFromUrl
        ? Number(storeIdFromUrl)
        : currentUser?.role === "Администратор"
          ? currentUser.store_read?.id
          : undefined,
    },
    mode: "onChange",
  });

  const { data: storesData } = useGetStores();
  const stores = Array.isArray(storesData)
    ? storesData
    : storesData?.results || [];

  // Fetch products with pagination
  const { data: productsData, isLoading: isLoadingProducts } = useGetProducts({
    params: {
      page: productPage,
      ...(productSearchTerm ? { product_name: productSearchTerm } : {}),
    },
  });

  // Get products array from API response
  const allProducts = Array.isArray(productsData)
    ? productsData
    : productsData?.results || [];

  // Effect to ensure store is set and locked for admin or if storeIdFromUrl is present
  useEffect(() => {
    if (storeIdFromUrl) {
      form.setValue("store", Number(storeIdFromUrl));
    } else if (
      currentUser?.role === "Администратор" &&
      currentUser?.store_read?.id
    ) {
      form.setValue("store", currentUser.store_read.id);
    }
  }, [currentUser, form, storeIdFromUrl]);

  // Fetch all stocks on mount
  useEffect(() => {
    setLoadingStocks(true);
    fetchAllStocks()
      .then(setStocks)
      .catch((err) => {
        console.error("Error fetching all stocks:", err);
        toast.error(t("messages.error.load", { item: t("navigation.stocks") }));
      })
      .finally(() => setLoadingStocks(false));
  }, [t]);

  // Watch for changes in the from_to field to update allowed categories
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "from_to" && value.from_to) {
        const selectedStock = stocks.find(
          (stock) => stock.id === Number(value.from_to),
        );

        // Check both product and product_read for attribute_values
        const product = selectedStock?.product || selectedStock?.product_read;

        if (isProductRecyclable(product)) {
          const categories = getAllowedCategories(product);
          setAllowedCategories(categories);
          // Clear the to_product selection when changing from_to
          form.setValue("to_product", undefined);
        } else {
          setAllowedCategories(null);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, stocks]);

  // Set initial values based on URL parameters
  useEffect(() => {
    if (stocks.length > 0 && allProducts.length > 0) {
      if (fromStockId) {
        form.setValue("from_to", Number(fromStockId));

        const stockItem = stocks.find(
          (stock) => stock.id === Number(fromStockId),
        );

        // Set allowed categories immediately for filtering
        const product = stockItem?.product || stockItem?.product_read;
        if (isProductRecyclable(product)) {
          const categories = getAllowedCategories(product);
          setAllowedCategories(categories);
        }

        if (stockItem?.product?.id || stockItem?.product_read?.id) {
          form.setValue(
            "to_product",
            stockItem?.product?.id || stockItem?.product_read?.id,
          );
        }
      } else if (fromProductId) {
        const stockWithProduct = stocks.find(
          (stock) =>
            (stock.product?.id === Number(fromProductId) ||
              stock.product_read?.id === Number(fromProductId)) &&
            stock.quantity > 0,
        );

        if (stockWithProduct) {
          form.setValue("from_to", stockWithProduct.id);

          // Set allowed categories immediately for filtering
          const product =
            stockWithProduct?.product || stockWithProduct?.product_read;
          if (isProductRecyclable(product)) {
            const categories = getAllowedCategories(product);
            setAllowedCategories(categories);
          }

          form.setValue("to_product", Number(fromProductId));
        }
      }
    }
  }, [fromStockId, fromProductId, stocks, allProducts, form]);

  const selectedStore = form.watch("store");
  const toProduct = form.watch("to_product");

  // Get selected product to check if it's "Рейка"
  const selectedProduct = allProducts.find(
    (product) => product.id === Number(toProduct),
  );
  const isReyka = selectedProduct?.category_read?.category_name === "Рейка";

  // Update fields with dynamic options
  const fields = recyclingFields(t, productSearchTerm)
    .map((field) => {
      if (field.name === "from_to") {
        return {
          ...field,
          options: stocks
            .filter((stock: any) => {
              // First filter: Only show recyclable products
              const product = stock.product || stock.product_read;
              if (!isProductRecyclable(product)) return false;

              // Second filter: Allow stocks from selected store or from main store
              if (!selectedStore) return true;
              const storeId = stock.store?.id || stock.store_read?.id;
              const isMain = stock.store?.is_main || stock.store_read?.is_main;
              return storeId === Number(selectedStore) || isMain;
            })
            .map((stock: any) => {
              const productName =
                stock.product?.product_name ||
                stock.product_read?.product_name ||
                "Unknown";
              const storeName =
                stock.store?.name || stock.store_read?.name || "Unknown";
              return {
                value: stock.id,
                label: `${productName} (${stock.quantity || 0}) [${storeName}]`,
              };
            })
            .filter((opt: any) => opt.value),
          isLoading: loadingStocks,
        };
      }
      if (field.name === "to_product") {
        return {
          ...field,
          options: allProducts
            .filter((product: any) => {
              if (!allowedCategories || !product.category_read) return true;
              return allowedCategories.some(
                (cat) => cat.id === product?.category_read.id,
              );
            })
            .map((product: any) => {
              // Find the category name from allowedCategories
              const categoryInfo = allowedCategories?.find(
                (cat) => cat.id === product.category_read?.id,
              );
              const categoryName =
                categoryInfo?.name ||
                product.category_read?.category_name ||
                "";

              return {
                value: product.id,
                label: categoryName
                  ? `${categoryName} - ${product.product_name}`
                  : product.product_name,
                categoryName: categoryName,
              };
            })
            .sort((a: any, b: any) => {
              // Sort by category name first, then by product name
              if (a.categoryName !== b.categoryName) {
                return a.categoryName.localeCompare(b.categoryName, "ru");
              }
              return a.label.localeCompare(b.label, "ru");
            })
            .filter((opt: any) => opt.value),
          onSearch: setProductSearchTerm,
          isLoading: isLoadingProducts,
        };
      }
      if (field.name === "store") {
        const isAdmin = currentUser?.role === "Администратор";
        const isStoreIdLocked = Boolean(storeIdFromUrl);
        return {
          ...field,
          options: stores
            .map((store: any) => ({
              value: store.id,
              label: store.name,
            }))
            .filter((opt: any) =>
              isStoreIdLocked
                ? opt.value === Number(storeIdFromUrl)
                : isAdmin
                  ? opt.value === currentUser?.store_read?.id
                  : opt.value,
            ),
          disabled: isAdmin || isStoreIdLocked,
        };
      }

      return field;
    })
    // Hide specified fields and conditionally show quantity_of_parts
    .filter((field) => {
      // Always hide these fields
      if (
        [
          "store",
          "exchange_rate",
          "purchase_price_in_uz",
          "purchase_price_in_us",
        ].includes(field.name)
      ) {
        return false;
      }
      // Only show quantity_of_parts when to_product is "Рейка"
      if (field.name === "quantity_of_parts") {
        return isReyka;
      }
      return true;
    });

  // Watch specific fields for changes
  const fromTo = form.watch("from_to");
  const getAmount = form.watch("get_amount");
  const purchasePriceInUs = form.watch("purchase_price_in_us");
  const exchangeRateField = form.watch("exchange_rate");

  // Auto-calculate selling price when spent_amount, get_amount, or from_to changes
  useEffect(() => {
    if (!fromTo) return;
    const selectedStock = stocks.find((stock) => stock.id === Number(fromTo));
    const baseSellingPrice = selectedStock?.selling_price
      ? Number(selectedStock.selling_price)
      : 0;
    const spentAmt = Number(form.watch("spent_amount"));
    const getAmt = Number(getAmount);
    // Get selected to_product and its category
    const toProductId = form.watch("to_product");
    const selectedProduct = allProducts.find(
      (product) => product.id === Number(toProductId),
    );
    const categoryName = selectedProduct?.category_read?.category_name;
    // Special calculation for Коньёк, Снегозадержатель, and Уголок
    if (
      (categoryName === "Коньёк" ||
        categoryName === "Снегозадержатель" ||
        categoryName === "Уголок") &&
      baseSellingPrice &&
      spentAmt &&
      getAmt
    ) {
      let calculated = (baseSellingPrice * spentAmt) / getAmt;
      calculated = Math.round((calculated + Number.EPSILON) * 100) / 100;
      if (!sellingPriceRef.current) {
        form.setValue("selling_price", calculated, {
          shouldValidate: false,
          shouldDirty: true,
        });
        sellingPriceRef.current = true;
        setTimeout(() => {
          sellingPriceRef.current = false;
        }, 100);
      }
    } else if (baseSellingPrice && spentAmt && getAmt) {
      // Default calculation (keep as is)
      let calculated = (baseSellingPrice * spentAmt) / getAmt;
      calculated = Math.round((calculated + Number.EPSILON) * 100) / 100;
      if (!sellingPriceRef.current) {
        form.setValue("selling_price", calculated, {
          shouldValidate: false,
          shouldDirty: true,
        });
        sellingPriceRef.current = true;
        setTimeout(() => {
          sellingPriceRef.current = false;
        }, 100);
      }
    } else if (!getAmt) {
      form.setValue("selling_price", 0, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [fromTo, getAmount, stocks, form, allProducts]);

  // Watch for changes to from_to and set purchase_price_in_us from stock's selling_price_in_us
  useEffect(() => {
    if (!fromTo) return;
    const selectedStock = stocks.find((stock) => stock.id === Number(fromTo));
    if (selectedStock && selectedStock.selling_price_in_us) {
      form.setValue("purchase_price_in_us", selectedStock.selling_price_in_us, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [fromTo, stocks, form]);

  // Auto-calculate purchase_price_in_uz when purchase_price_in_us or exchange_rate changes
  useEffect(() => {
    const us = Number(purchasePriceInUs);
    const rate = Number(exchangeRateField);
    if (!isNaN(us) && !isNaN(rate) && us > 0 && rate > 0) {
      const uz = us * rate;
      form.setValue("purchase_price_in_uz", uz, {
        shouldValidate: false,
        shouldDirty: true,
      });
    } else {
      form.setValue("purchase_price_in_uz", 0, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [purchasePriceInUs, exchangeRateField, form]);

  // Watch for changes to to_product and spent_amount to auto-calculate get_amount for specific categories
  useEffect(() => {
    const toProductId = form.watch("to_product");
    if (!toProductId) return;
    const selectedProduct = allProducts.find(
      (product) => product.id === Number(toProductId),
    );
    if (!selectedProduct || !selectedProduct.category_read) return;
    const categoryName = selectedProduct.category_read.category_name;
    const spentAmt = Number(form.watch("spent_amount"));
    // Only auto-calculate if spent_amount is a valid number
    if (!isNaN(spentAmt) && spentAmt > 0) {
      if (categoryName === "Рейка") {
        // Find the measurement with name "Метр"
        const metrMeasurement = selectedProduct.measurement?.find(
          (m) => m.measurement_read?.measurement_name === "Метр",
        );
        const metrValue = metrMeasurement ? Number(metrMeasurement.number) : 1;
        // Check if from_to's product category is Половой агаш or Половой
        let multiplier = 1;
        const selectedFromStock = stocks.find(
          (stock) => stock.id === Number(form.watch("from_to")),
        );
        const fromCategoryName =
          selectedFromStock?.product_read?.category_read?.category_name;
        if (
          fromCategoryName === "Половой агаш" ||
          fromCategoryName === "Половой"
        ) {
          multiplier = 2;
        }
        const newGetAmount = spentAmt * metrValue * multiplier;
        if (form.getValues("get_amount") !== String(newGetAmount)) {
          form.setValue("get_amount", String(newGetAmount), {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      } else if (categoryName === "Коньёк") {
        const newGetAmount = spentAmt * 6;
        if (form.getValues("get_amount") !== String(newGetAmount)) {
          form.setValue("get_amount", String(newGetAmount), {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      } else if (categoryName === "Снегозадержатель") {
        const newGetAmount = spentAmt * 7;
        if (form.getValues("get_amount") !== String(newGetAmount)) {
          form.setValue("get_amount", String(newGetAmount), {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      } else if (categoryName === "Уголок") {
        const newGetAmount = spentAmt * 12;
        if (form.getValues("get_amount") !== String(newGetAmount)) {
          form.setValue("get_amount", String(newGetAmount), {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      }
    }
  }, [
    form.watch("to_product"),
    form.watch("spent_amount"),
    allProducts,
    form,
    stocks,
  ]);

  const handleSubmit = async (data: FormValues) => {
    try {
      // Validate quantity_of_parts is required when to_product is "Рейка"
      if (
        isReyka &&
        (!data.quantity_of_parts || Number(data.quantity_of_parts) <= 0)
      ) {
        toast.error(t("common.quantity_of_parts_required"));
        return;
      }

      // Calculate purchase_price_uzs as selling_price * get_amount
      // const sellingPrice = Number(data.selling_price);
      // const getAmount = Number(data.get_amount);
      // const _purchase_price_in_uz = sellingPrice * getAmount;
      const selectedStock = stocks.find((stock) => stock.id === Number(fromTo));
      console.log("selling_price_in_us", selectedStock.selling_price_in_us);
      const formattedData: any = {
        from_to: Number(data.from_to),
        to_product: Number(data.to_product),
        store: Number(data.store),
        spent_amount: String(data.spent_amount || ""),
        get_amount: String(data.get_amount || ""),
        date_of_recycle: data.date_of_recycle || "",
        // purchase_price_in_us: Number(data.purchase_price_in_us),
        // purchase_price_in_uz: Number(data.purchase_price_in_uz),
        quantity_of_parts: isReyka ? Number(data.quantity_of_parts) : undefined,
      };

      await createRecycling.mutateAsync(formattedData);
      toast.success(
        t("messages.success.created", { item: t("navigation.recyclings") }),
      );
      navigate("/recyclings");
    } catch (error) {
      toast.error(
        t("messages.error.create", {
          item: t("navigation.recyclings").toLowerCase(),
        }),
      );
      console.error("Failed to create recycling:", error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <ResourceForm<FormValues>
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={createRecycling.isPending}
        title={t("common.create") + " " + t("navigation.recyclings")}
        form={form}
      />
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import type { Recycling } from "../api/recycling";
import type { Product } from "../api/product";
import { useCreateRecycling } from "../api/recycling";
import { fetchAllStocks } from "../api/fetchAllStocks";
import { useGetStores } from "../api/store";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import api from "../api/api";

interface FormValues extends Partial<Recycling> {}

const recyclingFields = (
  t: any,
  productSearchTerm: string,
  perUnitPrice: number | null
) => [
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
  // --- Prices ---

  {
    name: "min_price",
    label: t("forms.min_price"),
    type: "number",
    placeholder: t("placeholders.enter_price"),
    required: true,
  },
  {
    name: "purchase_price_in_us",
    label: t("common.enter_purchase_price_usd"),
    type: "text",
    placeholder: t("common.enter_purchase_price_usd"),
    required: true,
  },
  {
    name: "exchange_rate",
    label: t("common.enter_exchange_rate"),
    type: "text",
    placeholder: t("common.enter_exchange_rate"),
    required: true,
  },
  {
    name: "purchase_price_in_uz",
    label: t("common.calculated_purchase_price_uzs"),
    type: "text",
    placeholder: t("common.calculated_purchase_price_uzs"),
    readOnly: true,
    helperText: perUnitPrice
      ? `${t("common.per_unit_cost")}: ${perUnitPrice.toFixed(2)} UZS`
      : "",
  },
  // --- Date ---
  {
    name: "date_of_recycle",
    label: t("table.date"),
    type: "date",
    placeholder: t("placeholders.select_date"),
    required: true,
  },
  {
    name: "selling_price",
    label: t("forms.selling_price"),
    type: "number",
    placeholder: t("placeholders.enter_price"),
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
  const [allowedCategories, setAllowedCategories] = useState<number[] | null>(
    null
  );
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
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
  });

  const { data: storesData } = useGetStores();
  const stores = Array.isArray(storesData)
    ? storesData
    : storesData?.results || [];

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

  // Function to fetch all pages of products
  const fetchAllProducts = async (searchTerm: string) => {
    try {
      setIsLoadingProducts(true);
      let allResults: Product[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await api.get("items/product/", {
          params: {
            page: currentPage,
            product_name: searchTerm || undefined,
          },
        });
        const data = response.data;

        allResults = [...allResults, ...(data.results || [])];

        if (!data.links?.next) {
          hasMore = false;
        }
        currentPage++;
      }

      setAllProducts(allResults);
    } catch (error) {
      console.error("Error fetching all products:", error);
      toast.error(t("messages.error.load", { item: t("navigation.products") }));
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Effect to fetch all products when search term changes
  useEffect(() => {
    const debouncedFetch = setTimeout(() => {
      fetchAllProducts(productSearchTerm);
    }, 300);

    return () => clearTimeout(debouncedFetch);
  }, [productSearchTerm]);

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
          (stock) => stock.id === Number(value.from_to)
        );
        if (selectedStock?.product_read?.has_recycling) {
          setAllowedCategories(
            selectedStock.product_read.categories_for_recycling || null
          );
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
          (stock) => stock.id === Number(fromStockId)
        );
        if (stockItem?.product_read?.id) {
          form.setValue("to_product", stockItem.product_read.id);
        }
      } else if (fromProductId) {
        const stockWithProduct = stocks.find(
          (stock) =>
            stock.product_read?.id === Number(fromProductId) &&
            stock.quantity > 0
        );

        if (stockWithProduct) {
          form.setValue("from_to", stockWithProduct.id);
          form.setValue("to_product", Number(fromProductId));
        }
      }
    }
  }, [fromStockId, fromProductId, stocks, allProducts, form]);

  // Fetch exchange rate on mount
  useEffect(() => {
    async function fetchExchangeRate() {
      try {
        const res = await api.get("/items/currency/");
        const rate = res.data?.results?.[0]?.currency_rate;
        if (rate) setExchangeRate(Number(rate));
        // Set form value
        form.setValue("exchange_rate", rate, {
          shouldValidate: false,
          shouldDirty: true,
        });
      } catch (e) {
        toast.error("Failed to fetch exchange rate");
      }
    }
    fetchExchangeRate();
  }, []);

  const selectedStore = form.watch("store");
  // Update fields with dynamic options
  const fields = recyclingFields(t, productSearchTerm, null)
    .map((field) => {
      if (field.name === "from_to") {
        return {
          ...field,
          options: stocks
            .filter((stock: any) => {
              // Allow stocks from selected store or from main store
              if (!selectedStore) return true;
              return (
                stock.store_read?.id === Number(selectedStore) ||
                stock.store_read?.is_main
              );
            })
            .map((stock: any) => ({
              value: stock.id,
              label: `${stock.product_read?.product_name} (${
                stock.quantity || 0
              }) [${stock.store_read?.name}]`,
            }))
            .filter((opt: any) => opt.value),
          isLoading: loadingStocks,
        };
      }
      if (field.name === "to_product") {
        return {
          ...field,
          options: allProducts
            .filter((product) => {
              if (!allowedCategories || !product.category_read) return true;
              return allowedCategories.includes(product.category_read.id);
            })
            .map((product: any) => ({
              value: product.id,
              label: product.product_name,
            }))
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
                : opt.value
            ),
          disabled: isAdmin || isStoreIdLocked,
        };
      }
      if (field.name === "exchange_rate") {
        return {
          ...field,
          disabled: true,
          value: exchangeRate !== null ? exchangeRate : "",
        };
      }
      return field;
    })
    // Hide specified fields
    .filter(
      (field) =>
        ![
          "store",
          "exchange_rate",
          "purchase_price_in_uz",
          "purchase_price_in_us",
        ].includes(field.name)
    );

  // Watch specific fields for changes
  const fromTo = form.watch("from_to");
  // const toProduct = form.watch('to_product');
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
      (product) => product.id === Number(toProductId)
    );
    const categoryId = selectedProduct?.category_read?.id;
    // Special calculation for коньёк (17) and снегозадержатель (18)
    if (
      (categoryId === 17 || categoryId === 18 || categoryId === 19) &&
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
      (product) => product.id === Number(toProductId)
    );
    if (!selectedProduct || !selectedProduct.category_read) return;
    const categoryId = selectedProduct.category_read.id;
    const spentAmt = Number(form.watch("spent_amount"));
    // Only auto-calculate if spent_amount is a valid number
    if (!isNaN(spentAmt) && spentAmt > 0) {
      if (categoryId === 13) { // Рейка
        // Find the measurement with name "Метр"
        const metrMeasurement = selectedProduct.measurement?.find(
          (m) => m.measurement_read?.measurement_name === "Метр"
        );
        const metrValue = metrMeasurement ? Number(metrMeasurement.number) : 1;
        const newGetAmount = spentAmt * metrValue;
        if (form.getValues("get_amount") !== String(newGetAmount)) {
          form.setValue("get_amount", String(newGetAmount), {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      } else if (categoryId === 17) {
        // коньёк
        const newGetAmount = spentAmt * 6;
        if (form.getValues("get_amount") !== String(newGetAmount)) {
          form.setValue("get_amount", String(newGetAmount), {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      } else if (categoryId === 18) {
        // снегозадержатель
        const newGetAmount = spentAmt * 7;
        if (form.getValues("get_amount") !== String(newGetAmount)) {
          form.setValue("get_amount", String(newGetAmount), {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      }
      else if (categoryId === 19) { // снегозадержатель
        const newGetAmount = spentAmt * 12;
        if (form.getValues("get_amount") !== String(newGetAmount)) {
          form.setValue("get_amount", String(newGetAmount), {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      }
    }
    
  }, [form.watch("to_product"), form.watch("spent_amount"), allProducts, form]);

  const handleSubmit = async (data: FormValues) => {
    try {
      // Calculate purchase_price_uzs as selling_price * get_amount
      const sellingPrice = Number(data.selling_price);
      const getAmount = Number(data.get_amount);
      const purchase_price_in_uz = sellingPrice * getAmount;

      const formattedData: any = {
        from_to: Number(data.from_to),
        to_product: Number(data.to_product),
        store: Number(data.store),
        selling_price: sellingPrice,
        min_price: Number(data.min_price),
        spent_amount: String(data.spent_amount || ""),
        get_amount: String(data.get_amount || ""),
        date_of_recycle: data.date_of_recycle || "",
        // purchase_price_in_us: Number(data.purchase_price_in_us),
        exchange_rate: Number(data.exchange_rate),
        // purchase_price_in_uz: Number(data.purchase_price_in_uz),
        purchase_price_in_uz, // <-- add calculated value to API payload
      };

      await createRecycling.mutateAsync(formattedData);
      toast.success(
        t("messages.success.created", { item: t("navigation.recyclings") })
      );
      navigate("/recyclings");
    } catch (error) {
      toast.error(
        t("messages.error.create", {
          item: t("navigation.recyclings").toLowerCase(),
        })
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

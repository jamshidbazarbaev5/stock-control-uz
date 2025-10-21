import { useNavigate, useParams } from "react-router-dom";
import type { DynamicField, StockItemEntry } from "../api/stock";
import { calculateStock, useUpdateStockEntry, useGetStockEntry, useGetStocks } from "../api/stock";
import {
  useCreateProduct,
  useGetProducts,
  searchProductByBarcode,
} from "../api/product";
import { useGetStores } from "../api/store";
import { useGetSuppliers, useCreateSupplier } from "../api/supplier";
import { useGetCategories } from "../api/category";
import { useGetCurrencies } from "../api/currency";
import { useGetMeasurements } from "../api/measurement";
import { toast } from "sonner";
import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Checkbox } from "../../components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CommonFormValues {
  store: number | string;
  supplier: number | string;
  date_of_arrived: string;
  is_debt?: boolean;
  amount_of_debt?: number | string;
  advance_of_debt?: number | string;
}

interface StockItemFormValues {
  product: number | string;
  currency: number | string;
  purchase_unit: number | string;
  purchase_unit_quantity?: number | string;
  total_price_in_currency?: number | string;
  price_per_unit_currency?: number | string;
  price_per_unit_uz?: number | string;
  exchange_rate?: number | string;
  quantity?: number | string;
  total_price_in_uz?: number | string;
  base_unit_in_uzs?: number | string;
  base_unit_in_currency?: number | string;
  stock_name?: string;
}

interface StockItemTab {
  id: string;
  stockId?: number; // Database ID for existing stocks
  label: string;
  form: StockItemFormValues;
  dynamicFields: { [key: string]: DynamicField };
  dynamicFieldsOrder: string[];
  calculationMetadata: {
    conversion_factor: number;
    exchange_rate: number;
    is_base_currency: boolean;
  } | null;
  selectedProduct: any;
  isCalculated: boolean;
}

interface CreateProductForm {
  product_name: string;
  category_write: number;
  store_write: number;
}

interface CreateSupplierForm {
  name: string;
  phone_number: string;
}

const formatNumberDisplay = (value: any): string => {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const num = Number(value);
  if (isNaN(num)) {
    return "";
  }
  return num.toFixed(2);
};

const formatNumberForAPI = (value: any): number | undefined => {
  const num = parseFloat(value);
  if (isNaN(num)) return undefined;
  return parseFloat(num.toFixed(2));
};

export default function EditStockEntry() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { supplierId, stockEntryId } = useParams<{ supplierId: string; stockEntryId: string }>();
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productPage, _setProductPage] = useState(1);

  // Barcode scanner state
  const [scanBuffer, setScanBuffer] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tabs state
  const [stockTabs, setStockTabs] = useState<StockItemTab[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletedStockIds, setDeletedStockIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // API hooks
  const createProduct = useCreateProduct();
  const createSupplier = useCreateSupplier();
  const updateStockEntry = useUpdateStockEntry();
  const { data: stockEntryData, isLoading: stockEntryLoading } = useGetStockEntry(
    Number(stockEntryId),
  );
  const { data: stocksData, isLoading: stocksLoading } = useGetStocks({
    params: { stock_entry: stockEntryId },
  });
  const { data: storesData, isLoading: storesLoading } = useGetStores({});
  const { data: suppliersData, isLoading: suppliersLoading } = useGetSuppliers({});
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategories({});
  const { data: currenciesData, isLoading: currenciesLoading } = useGetCurrencies({});
  const { data: _measurementsData, isLoading: measurementsLoading } = useGetMeasurements({});
  const { data: productsData } = useGetProducts({
    params: {
      page: productPage,
      ...(productSearchTerm ? { product_name: productSearchTerm } : {}),
    },
  });

  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);

  const productForm = useForm<CreateProductForm>();
  const supplierForm = useForm<CreateSupplierForm>();

  const commonForm = useForm<CommonFormValues>({
    defaultValues: {
      store: "",
      supplier: "",
      date_of_arrived: "",
      is_debt: false,
      amount_of_debt: "",
      advance_of_debt: "",
    },
  });

  const stores = Array.isArray(storesData)
    ? storesData
    : storesData?.results || [];
  const suppliers = Array.isArray(suppliersData)
    ? suppliersData
    : suppliersData?.results || [];
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.results || [];
  const currencies = Array.isArray(currenciesData)
    ? currenciesData
    : currenciesData?.results || [];

  const allProducts = Array.isArray(productsData)
    ? productsData
    : productsData?.results || [];

  // Load existing stock entry data
  useEffect(() => {
    if (stockEntryData && stocksData && !stockEntryLoading && !stocksLoading) {
      const entry = stockEntryData;
      const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results || [];

      // Set common form values
      commonForm.setValue("store", entry.store.id);
      commonForm.setValue("supplier", entry.supplier.id);
      
      // Parse datetime and convert to local time format
      const date = new Date(entry.date_of_arrived);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      commonForm.setValue("date_of_arrived", localDate.toISOString().slice(0, 16));
      
      commonForm.setValue("is_debt", entry.is_debt);
      if (entry.amount_of_debt) {
        commonForm.setValue("amount_of_debt", entry.amount_of_debt);
      }
      if (entry.advance_of_debt) {
        commonForm.setValue("advance_of_debt", entry.advance_of_debt);
      }

      // Create stock tabs from existing stocks
      const tabs: StockItemTab[] = stocks.map((stock, index) => {
        // Extract exchange_rate ID properly
        let exchangeRateValue: any = "";
        if (stock.exchange_rate) {
          if (typeof stock.exchange_rate === 'object' && stock.exchange_rate !== null) {
            // Check if it has an 'id' property
            if ('id' in stock.exchange_rate) {
              exchangeRateValue = (stock.exchange_rate as any).id;
            }
          } else {
            exchangeRateValue = stock.exchange_rate;
          }
        }

        console.log('Loading stock data:', stock);
        console.log('Exchange rate:', stock.exchange_rate, 'Extracted:', exchangeRateValue);
        console.log('Form values:', {
          purchase_unit_quantity: stock.purchase_unit_quantity,
          quantity: stock.quantity,
          price_per_unit_currency: stock.price_per_unit_currency,
          total_price_in_currency: stock.total_price_in_currency,
          price_per_unit_uz: stock.price_per_unit_uz,
          total_price_in_uz: stock.total_price_in_uz,
          base_unit_in_uzs: stock.base_unit_in_uzs,
          base_unit_in_currency: stock.base_unit_in_currency,
          exchange_rate: exchangeRateValue,
        });

        return {
          id: `tab-${index + 1}`,
          stockId: stock.id, // Store the database ID
          label: `Stock ${index + 1}`,
          form: {
            product: stock.product?.id || "",
            currency: stock.currency?.id || "",
            purchase_unit: stock.purchase_unit?.id || "",
            purchase_unit_quantity: stock.purchase_unit_quantity || "",
            total_price_in_currency: stock.total_price_in_currency || "",
            price_per_unit_currency: stock.price_per_unit_currency || "",
            price_per_unit_uz: stock.price_per_unit_uz || "",
            exchange_rate: exchangeRateValue || "",
            quantity: stock.quantity || "",
            total_price_in_uz: stock.total_price_in_uz || "",
            base_unit_in_uzs: stock.base_unit_in_uzs || "",
            base_unit_in_currency: stock.base_unit_in_currency || "",
            stock_name: stock.stock_name || "",
          },
          dynamicFields: {},
          dynamicFieldsOrder: [],
          calculationMetadata: null,
          selectedProduct: stock.product || null,
          isCalculated: false, // Will be recalculated to get field metadata
        };
      });

      if (tabs.length > 0) {
        setStockTabs(tabs);
        setActiveTab(tabs[0].id);
      }
      
      setIsLoading(false);
    }
  }, [stockEntryData, stocksData, stockEntryLoading, stocksLoading]);

  // Add new stock tab
  const addStockTab = () => {
    const newId = `tab-${stockTabs.length + 1}`;
    setStockTabs([
      ...stockTabs,
      {
        id: newId,
        label: `Stock ${stockTabs.length + 1}`,
        form: {
          product: "",
          currency: "",
          purchase_unit: "",
          purchase_unit_quantity: "",
          total_price_in_currency: "",
          price_per_unit_currency: "",
          price_per_unit_uz: "",
          exchange_rate: "",
          quantity: "",
          total_price_in_uz: "",
          base_unit_in_uzs: "",
          base_unit_in_currency: "",
          stock_name: "",
        },
        dynamicFields: {},
        dynamicFieldsOrder: [],
        calculationMetadata: null,
        selectedProduct: null,
        isCalculated: false,
      },
    ]);
    setActiveTab(newId);
  };

  // Remove stock tab
  const removeStockTab = (tabId: string) => {
    if (stockTabs.length === 1) {
      toast.error("You must have at least one stock item");
      return;
    }
    
    const tab = stockTabs.find((t) => t.id === tabId);
    
    // If this tab has a stockId, add it to deleted list
    if (tab?.stockId) {
      setDeletedStockIds([...deletedStockIds, tab.stockId]);
    }
    
    const newTabs = stockTabs.filter((tab) => tab.id !== tabId);
    setStockTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[0].id);
    }
  };

  // Update stock tab form field
  const updateStockTabField = (
    tabId: string,
    field: keyof StockItemFormValues,
    value: any,
  ) => {
    setStockTabs((tabs) =>
      tabs.map((tab) => {
        if (tab.id === tabId) {
          // If changing product, currency, or purchase_unit, need to recalculate
          const needsRecalculation = ['product', 'currency', 'purchase_unit'].includes(field);
          return {
            ...tab,
            form: {
              ...tab.form,
              [field]: value,
            },
            ...(needsRecalculation && { isCalculated: false }), // Force recalculation
          };
        }
        return tab;
      }),
    );
  };

  // Get tab label based on product name
  const getTabLabel = (tab: StockItemTab): string => {
    if (tab.selectedProduct?.product_name) {
      const name = tab.selectedProduct.product_name;
      return name.length > 15 ? `${name.substring(0, 15)}...` : name;
    }
    return tab.label;
  };

  // Get field configuration for a stock tab (for new tabs or recalculation)
  const getFieldConfiguration = useCallback(
    async (tabId: string) => {
      const tab = stockTabs.find((t) => t.id === tabId);
      if (!tab) return;

      const commonValues = commonForm.getValues();
      const { form } = tab;

      if (
        !commonValues.store ||
        !form.product ||
        !form.currency ||
        !form.purchase_unit ||
        !commonValues.supplier ||
        !commonValues.date_of_arrived
      ) {
        return;
      }

      try {
        const configRequest = {
          store: Number(commonValues.store),
          product: Number(form.product),
          currency: Number(form.currency),
          purchase_unit: Number(form.purchase_unit),
          supplier: Number(commonValues.supplier),
          date_of_arrived: commonValues.date_of_arrived,
        };

        const response = await calculateStock(configRequest);

        const fieldOrder = Object.keys(response.dynamic_fields);
        const exchangeRateValue = response.dynamic_fields.exchange_rate?.value;
        const exchangeRate =
          typeof exchangeRateValue === "object" &&
          exchangeRateValue !== null &&
          "rate" in exchangeRateValue
            ? Number(exchangeRateValue.rate)
            : 1;

        const conversionFactorValue =
          response.dynamic_fields.conversion_factor?.value;
        const conversionFactor =
          typeof conversionFactorValue === "number"
            ? conversionFactorValue
            : Number(conversionFactorValue) || 1;

        const metadata = {
          conversion_factor: conversionFactor,
          exchange_rate: exchangeRate,
          is_base_currency: response.currency?.is_base || false,
        };

        // Update tab with calculation results
        setStockTabs((tabs) =>
          tabs.map((t) => {
            if (t.id === tabId) {
              const updatedForm = { ...t.form };

              // Populate form with calculated values
              Object.entries(response.dynamic_fields).forEach(
                ([fieldName, fieldData]) => {
                  if (fieldData.value !== null && fieldData.value !== undefined) {
                    const rawValue = formatFieldValue(fieldData.value);
                    const displayValue = formatNumberDisplay(rawValue);
                    updatedForm[fieldName as keyof StockItemFormValues] =
                      displayValue;
                  }
                },
              );

              return {
                ...t,
                form: updatedForm,
                dynamicFields: response.dynamic_fields,
                dynamicFieldsOrder: fieldOrder,
                calculationMetadata: metadata,
                isCalculated: true,
              };
            }
            return t;
          }),
        );
      } catch (error) {
        console.error("Field configuration error:", error);
        toast.error("Failed to calculate stock values");
      }
    },
    [stockTabs, commonForm],
  );

  // Get field configuration but preserve original values (for loading existing data)
  const getFieldConfigurationWithOriginalValues = useCallback(
    async (tabId: string, originalForm: StockItemFormValues) => {
      console.log('getFieldConfigurationWithOriginalValues called for tab:', tabId);
      console.log('originalForm:', originalForm);
      
      const commonValues = commonForm.getValues();

      if (
        !commonValues.store ||
        !originalForm.product ||
        !originalForm.currency ||
        !originalForm.purchase_unit ||
        !commonValues.supplier ||
        !commonValues.date_of_arrived
      ) {
        return;
      }

      try {
        const configRequest = {
          store: Number(commonValues.store),
          product: Number(originalForm.product),
          currency: Number(originalForm.currency),
          purchase_unit: Number(originalForm.purchase_unit),
          supplier: Number(commonValues.supplier),
          date_of_arrived: commonValues.date_of_arrived,
        };

        const response = await calculateStock(configRequest);

        const fieldOrder = Object.keys(response.dynamic_fields);
        const exchangeRateValue = response.dynamic_fields.exchange_rate?.value;
        const exchangeRate =
          typeof exchangeRateValue === "object" &&
          exchangeRateValue !== null &&
          "rate" in exchangeRateValue
            ? Number(exchangeRateValue.rate)
            : 1;

        const conversionFactorValue =
          response.dynamic_fields.conversion_factor?.value;
        console.log('Conversion factor from API:', conversionFactorValue);
        const conversionFactor =
          typeof conversionFactorValue === "number"
            ? conversionFactorValue
            : Number(conversionFactorValue) || 1;
        console.log('Parsed conversion factor:', conversionFactor);

        const metadata = {
          conversion_factor: conversionFactor,
          exchange_rate: exchangeRate,
          is_base_currency: response.currency?.is_base || false,
        };
        console.log('Metadata:', metadata);

        // Update tab with metadata but keep original form values
        setStockTabs((tabs) =>
          tabs.map((t) => {
            if (t.id === tabId) {
              console.log('Updating tab with preserved values:', originalForm);
              console.log('Exchange rate from response:', response.dynamic_fields.exchange_rate);
              
              // Extract exchange_rate ID from response if not in originalForm
              const finalForm = { ...originalForm };
              if (!finalForm.exchange_rate || finalForm.exchange_rate === "") {
                const exchangeRateField = response.dynamic_fields.exchange_rate;
                if (exchangeRateField?.value) {
                  if (typeof exchangeRateField.value === "object" && (exchangeRateField.value as any).id) {
                    finalForm.exchange_rate = String((exchangeRateField.value as any).id);
                  } else {
                    finalForm.exchange_rate = String(exchangeRateField.value);
                  }
                }
              }
              
              console.log('Final form with exchange_rate:', finalForm.exchange_rate);
              
              return {
                ...t,
                form: finalForm, // Keep the original loaded values with fixed exchange_rate
                dynamicFields: response.dynamic_fields,
                dynamicFieldsOrder: fieldOrder,
                calculationMetadata: metadata,
                isCalculated: true, // Mark as calculated to prevent auto-recalculation
              };
            }
            return t;
          }),
        );
        console.log('State updated for tab:', tabId);
      } catch (error) {
        console.error("Field configuration error:", error);
        toast.error("Failed to load stock configuration");
      }
    },
    [commonForm],
  );

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      if (value.rate !== undefined) return String(value.rate);
      if (value.value !== undefined) {
        if (typeof value.value === "object") {
          if (value.value.rate !== undefined) return String(value.value.rate);
          if (value.value.amount !== undefined)
            return String(value.value.amount);
        }
        return String(value.value);
      }
      if (value.amount !== undefined) return String(value.amount);
      if (value.id !== undefined) return String(value.id);
    }
    return String(value);
  };

  // Handle product selection change in tab
  const handleProductChange = (tabId: string, productId: string) => {
    const product = allProducts.find((p) => p.id === Number(productId));
    console.log('Product changed:', productId, product);
    setStockTabs((tabs) =>
      tabs.map((tab) => {
        if (tab.id === tabId) {
          const updatedForm = {
            ...tab.form,
            product: productId,
            purchase_unit: "", // Reset purchase unit
          };
          
          return {
            ...tab,
            selectedProduct: product,
            form: updatedForm,
            isCalculated: false, // Reset calculation status
          };
        }
        return tab;
      }),
    );
  };

  // Calculate fields based on user input
  const calculateTabFields = useCallback(
    (tabId: string, changedField: string, value: any) => {
      console.log(`calculateTabFields called: tab=${tabId}, field=${changedField}, value=${value}`);
      const tab = stockTabs.find((t) => t.id === tabId);
      if (!tab) {
        console.log('Tab not found:', tabId);
        return;
      }
      if (!tab.calculationMetadata) {
        console.log('No calculation metadata for tab:', tabId);
        return;
      }

      const { conversion_factor, exchange_rate, is_base_currency } =
        tab.calculationMetadata;
      console.log('Calculation metadata:', { conversion_factor, exchange_rate, is_base_currency });
      const currentForm = { ...tab.form, [changedField]: value };
      console.log('Current form before calculation:', currentForm);

      const qty = Number(currentForm.purchase_unit_quantity) || 0;
      const quantity = Number(currentForm.quantity) || 0;

      // Update quantity based on purchase_unit_quantity
      if (
        changedField === "purchase_unit_quantity" &&
        qty &&
        !tab.dynamicFields.quantity?.editable
      ) {
        currentForm.quantity = formatNumberDisplay(qty * conversion_factor);
      } else if (
        changedField === "quantity" &&
        quantity &&
        !tab.dynamicFields.purchase_unit_quantity?.editable
      ) {
        currentForm.purchase_unit_quantity = formatNumberDisplay(
          quantity * conversion_factor,
        );
      }

      const currentQty =
        changedField === "purchase_unit_quantity"
          ? qty
          : Number(currentForm.purchase_unit_quantity) || 0;

      // Price calculations
      if (!is_base_currency && currentQty) {
        if (changedField === "price_per_unit_currency") {
          currentForm.total_price_in_currency = formatNumberDisplay(
            (Number(currentForm.price_per_unit_currency) || 0) * currentQty,
          );
        } else if (changedField === "total_price_in_currency") {
          currentForm.price_per_unit_currency = formatNumberDisplay(
            (Number(currentForm.total_price_in_currency) || 0) / currentQty,
          );
        } else if (changedField === "purchase_unit_quantity" || changedField === "quantity") {
          // When quantity changes, recalculate total from per_unit * qty
          currentForm.total_price_in_currency = formatNumberDisplay(
            (Number(currentForm.price_per_unit_currency) || 0) * currentQty,
          );
        }
        
        // Always recalculate UZ prices
        currentForm.price_per_unit_uz = formatNumberDisplay(
          (Number(currentForm.price_per_unit_currency) || 0) * exchange_rate,
        );
        currentForm.total_price_in_uz = formatNumberDisplay(
          (Number(currentForm.total_price_in_currency) || 0) * exchange_rate,
        );
      } else if (is_base_currency && currentQty) {
        if (changedField === "price_per_unit_uz") {
          currentForm.total_price_in_uz = formatNumberDisplay(
            (Number(currentForm.price_per_unit_uz) || 0) * currentQty,
          );
        } else if (changedField === "total_price_in_uz") {
          currentForm.price_per_unit_uz = formatNumberDisplay(
            (Number(currentForm.total_price_in_uz) || 0) / currentQty,
          );
        } else if (changedField === "purchase_unit_quantity" || changedField === "quantity") {
          // When quantity changes, recalculate total from per_unit * qty
          currentForm.total_price_in_uz = formatNumberDisplay(
            (Number(currentForm.price_per_unit_uz) || 0) * currentQty,
          );
        }
      }

      // Base unit cost
      const finalQuantity = Number(currentForm.quantity) || 0;
      if (finalQuantity) {
        currentForm.base_unit_in_currency = formatNumberDisplay(
          (Number(currentForm.total_price_in_currency) || 0) / finalQuantity,
        );
        currentForm.base_unit_in_uzs = formatNumberDisplay(
          (Number(currentForm.total_price_in_uz) || 0) / finalQuantity,
        );
      }

      // Update the tab
      console.log('Final calculated form:', currentForm);
      setStockTabs((tabs) =>
        tabs.map((t) => {
          if (t.id === tabId) {
            return {
              ...t,
              form: currentForm,
            };
          }
          return t;
        }),
      );
      console.log('Tab state updated');
    },
    [stockTabs],
  );

  // Barcode scanner
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      setIsScanning(true);

      if (event.key === "Enter") {
        event.preventDefault();
        if (scanBuffer.trim()) {
          searchProductByBarcode(scanBuffer.trim())
            .then((product) => {
              if (product) {
                handleProductChange(activeTab, String(product.id));
                toast.success(
                  `Product found and selected: ${product.product_name}`,
                );
                setProductSearchTerm("");
              } else {
                setProductSearchTerm(scanBuffer.trim());
                toast.info(
                  `No product found with barcode: ${scanBuffer.trim()}. Showing search results.`,
                );
              }
            })
            .catch((error) => {
              console.error("Error searching for product:", error);
              setProductSearchTerm(scanBuffer.trim());
              toast.error(
                "Error searching for product. Showing search results.",
              );
            });
        }
        setScanBuffer("");
        setIsScanning(false);
        return;
      }

      if (event.key.length === 1) {
        setScanBuffer((prev) => prev + event.key);
        scanTimeoutRef.current = setTimeout(() => {
          setScanBuffer("");
          setIsScanning(false);
        }, 100);
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [scanBuffer, activeTab]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate common fields
      const commonValues = commonForm.getValues();
      if (!commonValues.store || !commonValues.supplier || !commonValues.date_of_arrived) {
        toast.error("Please fill all required common fields");
        return;
      }

      // Validate all tabs are calculated
      const uncalculatedTabs = stockTabs.filter((tab) => !tab.isCalculated);
      if (uncalculatedTabs.length > 0) {
        toast.error(
          "Please complete all stock items by filling required fields and calculating",
        );
        return;
      }

      // Build stocks array
      const stocks: StockItemEntry[] = stockTabs.map((tab) => {
        const exchangeRateField = tab.dynamicFields.exchange_rate;
        let exchangeRateId: number;

        if (
          exchangeRateField?.value &&
          typeof exchangeRateField.value === "object" &&
          (exchangeRateField.value as any).id
        ) {
          exchangeRateId = (exchangeRateField.value as any).id;
        } else {
          exchangeRateId = Number(tab.form.exchange_rate);
        }

        const stockEntry: any = {
          product: Number(tab.form.product),
          purchase_unit: Number(tab.form.purchase_unit),
          currency: Number(tab.form.currency),
          exchange_rate: exchangeRateId,
          quantity: formatNumberForAPI(tab.form.quantity) || 0,
          purchase_unit_quantity:
            formatNumberForAPI(tab.form.purchase_unit_quantity) || 0,
          price_per_unit_uz: formatNumberForAPI(tab.form.price_per_unit_uz) || 0,
          total_price_in_uz: formatNumberForAPI(tab.form.total_price_in_uz) || 0,
          price_per_unit_currency:
            formatNumberForAPI(tab.form.price_per_unit_currency) || 0,
          total_price_in_currency:
            formatNumberForAPI(tab.form.total_price_in_currency) || 0,
          base_unit_in_uzs: formatNumberForAPI(tab.form.base_unit_in_uzs),
          base_unit_in_currency: formatNumberForAPI(
            tab.form.base_unit_in_currency,
          ),
        };

        // Add stock_name only if it exists
        if (tab.form.stock_name && tab.form.stock_name.trim()) {
          stockEntry.stock_name = tab.form.stock_name.trim();
        }

        // Add id if this is an existing stock
        if (tab.stockId) {
          stockEntry.id = tab.stockId;
        }

        return stockEntry;
      });

      const payload = {
        store: Number(commonValues.store),
        supplier: Number(commonValues.supplier),
        date_of_arrived: commonValues.date_of_arrived,
        ...(commonValues.is_debt && { is_debt: true }),
        ...(commonValues.amount_of_debt && {
          amount_of_debt: formatNumberForAPI(commonValues.amount_of_debt),
        }),
        ...(commonValues.advance_of_debt && {
          advance_of_debt: formatNumberForAPI(commonValues.advance_of_debt),
        }),
        stocks,
        ...(deletedStockIds.length > 0 && { deleted_stocks: deletedStockIds }),
      };

      console.log("Submitting payload:", payload);
      await updateStockEntry.mutateAsync({
        id: Number(stockEntryId),
        data: payload,
      });
      toast.success("Stock entry updated successfully");
      navigate(`/suppliers/${supplierId}`);
    } catch (error) {
      toast.error("Failed to update stock entry");
      console.error("Failed to update stock entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-set debt amount to sum of total UZS if is_debt is true
  const isDebt = commonForm.watch("is_debt");
  useEffect(() => {
    if (!isDebt) return;
    
    // Sum all calculated tabs' total_price_in_uz
    const totalUZS = stockTabs.reduce((sum, tab) => {
      if (tab.isCalculated && tab.form.total_price_in_uz) {
        const v = Number(tab.form.total_price_in_uz) || 0;
        return sum + v;
      }
      return sum;
    }, 0);
    
    if (totalUZS > 0) {
      const currentDebt = commonForm.getValues("amount_of_debt");
      // Only auto-set if user hasn't manually entered a value
      if (!currentDebt || Number(currentDebt) === 0 || Number(currentDebt) < totalUZS) {
        commonForm.setValue(
          "amount_of_debt",
          totalUZS.toFixed(2),
        );
      }
    }
  }, [isDebt, stockTabs]);

  // Auto-trigger calculation when all required fields are filled
  useEffect(() => {
    console.log('Auto-trigger effect running, stockTabs:', stockTabs.length);
    const commonValues = commonForm.getValues();
    console.log('Common values:', commonValues);
    
    stockTabs.forEach((tab) => {
      console.log(`Tab ${tab.id}:`, {
        hasStore: !!commonValues.store,
        hasSupplier: !!commonValues.supplier,
        hasDate: !!commonValues.date_of_arrived,
        hasProduct: !!tab.form.product,
        hasCurrency: !!tab.form.currency,
        hasPurchaseUnit: !!tab.form.purchase_unit,
        isCalculated: tab.isCalculated,
        stockId: tab.stockId
      });
      
      if (
        commonValues.store &&
        commonValues.supplier &&
        commonValues.date_of_arrived &&
        tab.form.product &&
        tab.form.currency &&
        tab.form.purchase_unit &&
        !tab.isCalculated
      ) {
        console.log(`Triggering configuration for tab ${tab.id}, has stockId:`, !!tab.stockId);
        // For existing stocks (with stockId), preserve values
        if (tab.stockId) {
          const originalForm = { ...tab.form }; // Capture current values
          getFieldConfigurationWithOriginalValues(tab.id, originalForm);
        } else {
          // For new stocks, calculate normally
          getFieldConfiguration(tab.id);
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockTabs, commonForm.watch("store"), commonForm.watch("supplier"), commonForm.watch("date_of_arrived")]);

  const handleCreateProductSubmit = async (data: CreateProductForm) => {
    try {
      await createProduct.mutateAsync(data);
      toast.success(t("common.product_created"));
      setCreateProductOpen(false);
      productForm.reset();
    } catch (error) {
      toast.error(t("common.error_creating_product"));
    }
  };

  const handleCreateSupplierSubmit = async (data: CreateSupplierForm) => {
    try {
      await createSupplier.mutateAsync(data);
      toast.success(t("common.supplier_created"));
      setCreateSupplierOpen(false);
      supplierForm.reset();
    } catch (error) {
      toast.error(t("common.error_creating_supplier"));
    }
  };

  if (isLoading || stockEntryLoading || stocksLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {isScanning && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-700 font-medium">
              Scanning barcode to find product... ({scanBuffer})
            </span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">
          {t("common.edit_stock_entry")}
        </h1>

        {/* Common Fields Section - First */}
        <div className="space-y-4 mb-8 pb-6 border-b">
          <h2 className="text-lg font-semibold">{t("common.common_information")}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Store */}
            <div className="space-y-2">
              <Label htmlFor="store">{t("common.store")} *</Label>
              <Select
                value={commonForm.watch("store")?.toString()}
                onValueChange={(value) => commonForm.setValue("store", Number(value))}
                disabled={storesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("common.select_store")} />
                </SelectTrigger>
                <SelectContent>
                  {stores
                    .filter((store) => store.is_main)
                    .map((store) => (
                      <SelectItem key={store.id} value={String(store.id)}>
                        {store.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier */}
            <div className="space-y-2">
              <Label htmlFor="supplier">{t("common.supplier")} *</Label>
              <div className="flex gap-2">
                <Select
                  value={commonForm.watch("supplier")?.toString()}
                  onValueChange={(value) =>
                    commonForm.setValue("supplier", Number(value))
                  }
                  disabled={suppliersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.select_supplier")} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date_of_arrived">
                {t("common.date_of_arrival")} *
              </Label>
              <Input
                id="date_of_arrived"
                type="datetime-local"
                {...commonForm.register("date_of_arrived")}
              />
            </div>

            {/* Is Debt */}
            <div className="space-y-2 flex items-center gap-2 pt-8">
              <Checkbox
                id="is_debt"
                checked={commonForm.watch("is_debt")}
                onCheckedChange={(checked) =>
                  commonForm.setValue("is_debt", checked as boolean)
                }
              />
              <Label htmlFor="is_debt" className="cursor-pointer">
                {t("common.is_debt")}
              </Label>
            </div>

            {/* Debt fields */}
            {commonForm.watch("is_debt") && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount_of_debt">
                    {t("common.amount_of_debt")}
                  </Label>
                  <Input
                    id="amount_of_debt"
                    type="number"
                    step="0.01"
                    {...commonForm.register("amount_of_debt")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advance_of_debt">
                    {t("common.advance_of_debt")}
                  </Label>
                  <Input
                    id="advance_of_debt"
                    type="number"
                    step="0.01"
                    {...commonForm.register("advance_of_debt")}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stock Items Tabs - After Common Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("common.stock_items")}</h2>
            <Button type="button" variant="outline" onClick={addStockTab}>
              <Plus className="h-4 w-4 mr-2" />
              {t("common.add_stock_item")}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {stockTabs.map((tab) => (
                <div key={tab.id} className="flex items-center">
                  <TabsTrigger value={tab.id}>{getTabLabel(tab)}</TabsTrigger>
                  {stockTabs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStockTab(tab.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </TabsList>

            {stockTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                {/* Product Selection Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Product */}
                  <div className="space-y-2">
                    <Label htmlFor={`product-${tab.id}`}>
                      {t("common.product")} *
                    </Label>
                    <Select
                      value={tab.form.product?.toString()}
                      onValueChange={(value) => handleProductChange(tab.id, value)}
                      onOpenChange={(open) => {
                        if (!open) setProductSearchTerm("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("common.product")} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2 sticky top-0 bg-white">
                          <Input
                            placeholder="Search product"
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        {(() => {
                          const options = [...allProducts];
                          const sel = tab.selectedProduct as any;
                          if (sel && !options.some((p: any) => p.id === sel.id)) {
                            options.unshift(sel);
                          }
                          return options.map((product: any) => (
                            <SelectItem key={product.id} value={String(product.id)}>
                              {product.product_name}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Currency */}
                  <div className="space-y-2">
                    <Label htmlFor={`currency-${tab.id}`}>
                      {t("common.currency")} *
                    </Label>
                    <Select
                      value={tab.form.currency?.toString()}
                      onValueChange={(value) =>
                        updateStockTabField(tab.id, "currency", value)
                      }
                      disabled={currenciesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("common.select_currency")} />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.id} value={String(currency.id)}>
                            {currency.name} ({currency.short_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Purchase Unit */}
                  <div className="space-y-2">
                    <Label htmlFor={`purchase_unit-${tab.id}`}>
                      {t("common.purchase_unit")} *
                    </Label>
                    {tab.stockId && stocksData ? (
                      /* For existing stocks, show the purchase unit from stock data */
                      <div className="px-3 py-2 border rounded-md bg-gray-100">
                        {(() => {
                          const stocks = Array.isArray(stocksData) ? stocksData : stocksData?.results || [];
                          const stock = stocks.find((s) => s.id === tab.stockId);
                          return stock?.purchase_unit?.short_name || t("common.purchase_unit");
                        })()}
                      </div>
                    ) : (
                      <Select
                        value={tab.form.purchase_unit?.toString()}
                        onValueChange={(value) => {
                          updateStockTabField(tab.id, "purchase_unit", value);
                        }}
                        disabled={measurementsLoading || !tab.selectedProduct}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("common.select_purchase_unit")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {tab.selectedProduct?.available_units?.map(
                            (unit: any) => (
                              <SelectItem key={unit.id} value={String(unit.id)}>
                                {unit.short_name}
                                {unit.is_base ? " (base)" : ""}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Stock Name Field - Show only for category Лист (id: 3) */}
                {tab.selectedProduct?.category_read?.id === 3 && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor={`stock_name-${tab.id}`}>
                      Stock Name
                    </Label>
                    <Input
                      id={`stock_name-${tab.id}`}
                      type="text"
                      value={tab.form.stock_name || ""}
                      onChange={(e) => {
                        updateStockTabField(tab.id, "stock_name", e.target.value);
                      }}
                      placeholder="Enter stock name"
                    />
                  </div>
                )}

                {/* Dynamic Fields */}
                {tab.isCalculated ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    {tab.dynamicFieldsOrder
                      .filter(
                        (fieldName) =>
                          tab.dynamicFields[fieldName] &&
                          tab.dynamicFields[fieldName].show,
                      )
                      .map((fieldName) => {
                        const fieldData = tab.dynamicFields[fieldName];
                        return (
                          <div key={fieldName} className="space-y-2">
                            <Label htmlFor={`${fieldName}-${tab.id}`}>
                              {fieldData.label}
                            </Label>
                            <Input
                              id={`${fieldName}-${tab.id}`}
                              type="number"
                              step="0.01"
                              value={tab.form[fieldName as keyof StockItemFormValues] || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                console.log(`Field ${fieldName} changed to ${value}, editable: ${fieldData.editable}`);
                                updateStockTabField(
                                  tab.id,
                                  fieldName as keyof StockItemFormValues,
                                  value,
                                );
                                if (fieldData.editable) {
                                  console.log(`Calling calculateTabFields for ${fieldName}`);
                                  calculateTabFields(tab.id, fieldName, value);
                                } else {
                                  console.log(`Field ${fieldName} is not editable, skipping calculation`);
                                }
                              }}
                              readOnly={!fieldData.editable}
                              className={
                                !fieldData.editable
                                  ? "bg-gray-100 cursor-not-allowed"
                                  : ""
                              }
                            />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div className="col-span-2 text-sm text-muted-foreground text-center py-4">
                      {t("common.please_select_required_fields")}
                    </div>
                  </div>
                )}

              </TabsContent>
            ))}
          </Tabs>

          {/* Submit Buttons - After All Tabs */}
          <div className="mt-6 flex justify-end gap-4 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/suppliers/${supplierId}`)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t("common.submitting") : t("common.update")}
            </Button>
          </div>
        </div>
      </div>

      {/* Create Product Dialog */}
      <Dialog open={createProductOpen} onOpenChange={setCreateProductOpen}>
        <DialogContent>
          <DialogTitle>{t("common.create_new_product")}</DialogTitle>
          <form
            onSubmit={productForm.handleSubmit(handleCreateProductSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="product_name">{t("common.product_name")}</Label>
              <Input
                id="product_name"
                {...productForm.register("product_name", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_write">{t("common.category")}</Label>
              <Select
                value={productForm.watch("category_write")?.toString()}
                onValueChange={(value) =>
                  productForm.setValue("category_write", parseInt(value))
                }
                disabled={categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("common.select_category")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={String(category.id)}
                      value={String(category.id || "")}
                    >
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="store_write">{t("common.store")}</Label>
              <Select
                value={productForm.watch("store_write")?.toString()}
                onValueChange={(value) =>
                  productForm.setValue("store_write", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("common.select_store")} />
                </SelectTrigger>
                <SelectContent>
                  {stores
                    .filter((store) => !store.is_main)
                    .map((store) => (
                      <SelectItem
                        key={store.id?.toString() || ""}
                        value={(store.id || 0).toString()}
                      >
                        {store.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createProduct.isPending}>
              {t("common.create")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Supplier Dialog */}
      <Dialog open={createSupplierOpen} onOpenChange={setCreateSupplierOpen}>
        <DialogContent>
          <DialogTitle>{t("common.create_new_supplier")}</DialogTitle>
          <form
            onSubmit={supplierForm.handleSubmit(handleCreateSupplierSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.supplier_name")}</Label>
              <Input
                id="name"
                {...supplierForm.register("name", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">{t("common.phone_number")}</Label>
              <Input
                id="phone_number"
                {...supplierForm.register("phone_number", { required: true })}
              />
            </div>
            <Button type="submit" disabled={createSupplier.isPending}>
              {t("common.create")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

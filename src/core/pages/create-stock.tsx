import { useNavigate } from "react-router-dom";
import { ResourceForm } from "../helpers/ResourceForm";
import type { DynamicField } from "../api/stock";
import { calculateStock } from "../api/stock";
import { useCreateStock } from "../api/stock";
import { useCreateProduct, searchProductByBarcode } from "../api/product";
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
import api from "../api/api";

interface FormValues {
  store: number | string;
  product: number | string;
  currency: number | string;
  purchase_unit: number | string;
  supplier: number | string;
  date_of_arrived: string;
  stock_name?: string;
  purchase_unit_quantity?: number | string;
  total_price_in_currency?: number | string;
  price_per_unit_currency?: number | string;
  price_per_unit_uz?: number | string;
  exchange_rate?: number | string;
  quantity?: number | string;
  total_price_in_uz?: number | string;
  base_unit_in_uzs?: number | string;
  base_unit_in_currency?: number | string;
  conversion_factor?: number | string;
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

// Helper function to format numbers with max 2 decimals, no trailing zeros
const formatNumberDisplay = (value: any): string => {
  if (value === "" || value === null || value === undefined) {
    return "";
  }
  const num = Number(value);
  if (isNaN(num)) {
    return "";
  }
  // Round to 2 decimal places and remove trailing zeros
  const rounded = Math.round(num * 100) / 100;
  return String(rounded);
};

// Helper function to format for API submission (with 2 decimals)
const formatNumberForAPI = (value: any): number | undefined => {
  const num = parseFloat(value);
  if (isNaN(num)) return undefined;
  return parseFloat(num.toFixed(2));
};

export default function CreateStock() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [dynamicFields, setDynamicFields] = useState<{
    [key: string]: DynamicField;
  }>({});
  const [dynamicFieldsOrder, setDynamicFieldsOrder] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Barcode scanner state
  const [scanBuffer, setScanBuffer] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // API hooks
  const createStock = useCreateStock();
  const createProduct = useCreateProduct();
  const createSupplier = useCreateSupplier();
  const { data: storesData, isLoading: storesLoading } = useGetStores({});
  const { data: suppliersData, isLoading: suppliersLoading } = useGetSuppliers(
    {},
  );
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetCategories({});
  const { data: currenciesData, isLoading: currenciesLoading } =
    useGetCurrencies({});
  const { data: _measurementsData, isLoading: measurementsLoading } =
    useGetMeasurements({});

  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);

  const productForm = useForm<CreateProductForm>();
  const supplierForm = useForm<CreateSupplierForm>();

  const form = useForm<FormValues>({
    defaultValues: {
      store: "",
      product: "",
      currency: "",
      purchase_unit: "",
      supplier: "",
      date_of_arrived: (() => {
        const date = new Date();
        date.setHours(date.getHours() + 5);
        return date.toISOString().slice(0, 16);
      })(),
      stock_name: "",
      purchase_unit_quantity: "",
      total_price_in_currency: "",
      price_per_unit_currency: "",
      price_per_unit_uz: "",
      exchange_rate: "",
      base_unit_in_currency: "",
      conversion_factor: "",
      quantity: "",
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
  // const measurements = Array.isArray(measurementsData) ? measurementsData : measurementsData?.results || [];

  // Fetch all products
  useEffect(() => {
    const fetchAllProducts = async () => {
      let page = 1;
      let products: any[] = [];
      let totalPages = 1;
      try {
        do {
          const res = await api.get("items/product/", {
            params: {
              page,
              ...(productSearchTerm ? { product_name: productSearchTerm } : {}),
            },
          });
          products = products.concat(res.data.results);
          totalPages = res.data.total_pages;
          page++;
        } while (page <= totalPages);
        setAllProducts(products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchAllProducts();
  }, [productSearchTerm]);

  // Watch product selection to update available units
  const watchedProduct = form.watch("product");
  useEffect(() => {
    if (watchedProduct) {
      const product = allProducts.find((p) => p.id === Number(watchedProduct));
      setSelectedProduct(product);
      // Reset purchase_unit when product changes
      form.setValue("purchase_unit", "");
    } else {
      setSelectedProduct(null);
    }
  }, [watchedProduct, allProducts]);

  const [initialCalculationDone, setInitialCalculationDone] = useState(false);
  const [calculationMetadata, setCalculationMetadata] = useState<{
    conversion_factor: number;
    exchange_rate: number;
    is_base_currency: boolean;
  } | null>(null);

  // Fixed calculation logic
  const calculateFields = useCallback(
    (changedField: string, currentValues: any) => {
      if (!calculationMetadata) return currentValues;

      const result = { ...currentValues };
      const { conversion_factor, exchange_rate, is_base_currency } =
        calculationMetadata;
      const qty = Number(result.purchase_unit_quantity) || 0;
      const quantity = Number(result.quantity) || 0;

      // FIXED: Respect editable property - only update non-editable fields
      // Only update quantity if quantity is NOT editable (calculated field)
      if (
        changedField === "purchase_unit_quantity" &&
        qty &&
        !dynamicFields.quantity?.editable
      ) {
        result.quantity = qty * conversion_factor;
        console.log(
          `[Debug] Changed purchase_unit_quantity (${qty}). New quantity: ${result.quantity}`,
        );
      }
      // Only update purchase_unit_quantity if purchase_unit_quantity is NOT editable (calculated field)
      else if (
        changedField === "quantity" &&
        quantity &&
        !dynamicFields.purchase_unit_quantity?.editable
      ) {
        result.purchase_unit_quantity = quantity * conversion_factor;
        console.log(
          `[Debug] Changed quantity (${quantity}). New purchase_unit_quantity: ${result.purchase_unit_quantity}`,
        );
      }

      // Recalculate prices based on current purchase_unit_quantity
      const currentQty =
        changedField === "purchase_unit_quantity"
          ? qty
          : Number(result.purchase_unit_quantity) || 0;

      // Price calculations
      if (!is_base_currency && currentQty) {
        if (changedField === "price_per_unit_currency") {
          result.total_price_in_currency =
            Number(result.price_per_unit_currency) * currentQty;
        }
        if (changedField === "total_price_in_currency") {
          result.price_per_unit_currency =
            Number(result.total_price_in_currency) / currentQty;
        }
        result.price_per_unit_uz =
          (Number(result.price_per_unit_currency) || 0) * exchange_rate;
        result.total_price_in_uz =
          (Number(result.total_price_in_currency) || 0) * exchange_rate;
      } else if (is_base_currency && currentQty) {
        if (changedField === "price_per_unit_uz") {
          result.total_price_in_uz =
            Number(result.price_per_unit_uz) * currentQty;
        }
        if (changedField === "total_price_in_uz") {
          result.price_per_unit_uz =
            Number(result.total_price_in_uz) / currentQty;
        }
      }

      // Base unit cost
      const finalQuantity = Number(result.quantity) || 0;
      if (finalQuantity) {
        result.base_unit_in_currency =
          (Number(result.total_price_in_currency) || 0) / finalQuantity;
        result.base_unit_in_uzs =
          (Number(result.total_price_in_uz) || 0) / finalQuantity;
      }

      return result;
    },
    [calculationMetadata, dynamicFields],
  );

  // Helper to extract value from API response
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

  // Get field configuration
  const getFieldConfiguration = useCallback(async (formData: FormValues) => {
    if (
      !formData.store ||
      !formData.product ||
      !formData.currency ||
      !formData.purchase_unit ||
      !formData.supplier ||
      !formData.date_of_arrived
    ) {
      return;
    }

    setIsCalculating(true);
    try {
      const configRequest = {
        store: Number(formData.store),
        product: Number(formData.product),
        currency: Number(formData.currency),
        purchase_unit: Number(formData.purchase_unit),
        supplier: Number(formData.supplier),
        date_of_arrived: formData.date_of_arrived,
      };

      const response = await calculateStock(configRequest);

      // FIXED: Store field order from API response
      const fieldOrder = Object.keys(response.dynamic_fields);
      setDynamicFieldsOrder(fieldOrder);
      setDynamicFields(response.dynamic_fields);

      // Populate form with initial values WITHOUT forcing .00
      Object.entries(response.dynamic_fields).forEach(
        ([fieldName, fieldData]) => {
          if (fieldData.value !== null && fieldData.value !== undefined) {
            const rawValue = formatFieldValue(fieldData.value);
            const displayValue = formatNumberDisplay(rawValue);
            form.setValue(fieldName as keyof FormValues, displayValue, {
              shouldValidate: false,
            });
          }
        },
      );

      // Extract metadata
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
      setCalculationMetadata(metadata);
    } catch (error) {
      console.error("Field configuration error:", error);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  // Update form with calculations
  const updateFormWithCalculations = useCallback(
    (changedField: string) => {
      if (!calculationMetadata) return;

      const currentValues = form.getValues();
      const numericValues = {
        purchase_unit_quantity:
          Number(currentValues.purchase_unit_quantity) || 0,
        price_per_unit_currency:
          Number(currentValues.price_per_unit_currency) || 0,
        total_price_in_currency:
          Number(currentValues.total_price_in_currency) || 0,
        price_per_unit_uz: Number(currentValues.price_per_unit_uz) || 0,
        quantity: Number(currentValues.quantity) || 0,
        total_price_in_uz: Number(currentValues.total_price_in_uz) || 0,
        base_unit_in_currency: Number(currentValues.base_unit_in_currency) || 0,
        base_unit_in_uzs: Number(currentValues.base_unit_in_uzs) || 0,
      };

      const calculatedValues = calculateFields(changedField, numericValues);

      // FIXED: Update without forcing .00 formatting
      // Only check editable property for quantity/purchase_unit_quantity fields
      Object.entries(calculatedValues).forEach(([fieldName, value]) => {
        if (fieldName !== changedField && value !== undefined) {
          // Only check editable for quantity fields
          const isQuantityField =
            fieldName === "quantity" || fieldName === "purchase_unit_quantity";
          const fieldConfig = dynamicFields[fieldName];
          const shouldUpdate =
            !isQuantityField || !fieldConfig || !fieldConfig.editable;

          if (shouldUpdate) {
            const formattedValue = formatNumberDisplay(value);
            form.setValue(fieldName as keyof FormValues, formattedValue, {
              shouldValidate: false,
            });
          }
        }
      });

      // Update dynamic fields
      const updatedDynamicFields = { ...dynamicFields };
      Object.entries(calculatedValues).forEach(([fieldName, value]) => {
        if (updatedDynamicFields[fieldName]) {
          // Only check editable for quantity fields
          const isQuantityField =
            fieldName === "quantity" || fieldName === "purchase_unit_quantity";
          const shouldUpdate =
            !isQuantityField || !updatedDynamicFields[fieldName].editable;

          if (shouldUpdate) {
            updatedDynamicFields[fieldName] = {
              ...updatedDynamicFields[fieldName],
              value: value as any,
            };
          }
        }
      });
      setDynamicFields(updatedDynamicFields);
    },
    [calculationMetadata, form, dynamicFields, calculateFields],
  );

  const [previousValues, setPreviousValues] = useState<any>({});

  // Watch required fields for initial calculation
  const requiredFields = form.watch([
    "store",
    "product",
    "currency",
    "purchase_unit",
    "supplier",
    "date_of_arrived",
  ]);

  useEffect(() => {
    const [store, product, currency, purchase_unit, supplier, date_of_arrived] =
      requiredFields;

    if (
      !initialCalculationDone &&
      store &&
      product &&
      currency &&
      purchase_unit &&
      supplier &&
      date_of_arrived
    ) {
      const timeoutId = setTimeout(() => {
        const formData = form.getValues();
        getFieldConfiguration(formData as FormValues).then(() => {
          setInitialCalculationDone(true);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [requiredFields, getFieldConfiguration, initialCalculationDone, form]);

  // Watch calculation fields
  const watchedFields = form.watch([
    "purchase_unit_quantity",
    "total_price_in_currency",
    "price_per_unit_currency",
    "price_per_unit_uz",
    "quantity",
  ]);

  useEffect(() => {
    const [
      purchaseUnitQuantity,
      totalPriceInCurrency,
      pricePerUnitCurrency,
      pricePerUnitUz,
      quantity,
    ] = watchedFields;
    console.log("[Debug] Watched fields changed. Current quantity:", quantity);

    const hasChanged =
      purchaseUnitQuantity !== previousValues.purchase_unit_quantity ||
      totalPriceInCurrency !== previousValues.total_price_in_currency ||
      pricePerUnitCurrency !== previousValues.price_per_unit_currency ||
      pricePerUnitUz !== previousValues.price_per_unit_uz ||
      quantity !== previousValues.quantity;

    if (hasChanged && initialCalculationDone && calculationMetadata) {
      const timeoutId = setTimeout(() => {
        let changedField = "";
        if (purchaseUnitQuantity !== previousValues.purchase_unit_quantity) {
          changedField = "purchase_unit_quantity";
        } else if (
          totalPriceInCurrency !== previousValues.total_price_in_currency
        ) {
          changedField = "total_price_in_currency";
        } else if (
          pricePerUnitCurrency !== previousValues.price_per_unit_currency
        ) {
          changedField = "price_per_unit_currency";
        } else if (pricePerUnitUz !== previousValues.price_per_unit_uz) {
          changedField = "price_per_unit_uz";
        } else if (quantity !== previousValues.quantity) {
          changedField = "quantity";
        }

        if (changedField) {
          updateFormWithCalculations(changedField);
        }

        setPreviousValues({
          purchase_unit_quantity: purchaseUnitQuantity,
          total_price_in_currency: totalPriceInCurrency,
          price_per_unit_currency: pricePerUnitCurrency,
          price_per_unit_uz: pricePerUnitUz,
          quantity: quantity,
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [
    watchedFields,
    previousValues,
    form,
    updateFormWithCalculations,
    initialCalculationDone,
    calculationMetadata,
  ]);

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
                form.setValue("product", product.id!);
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
  }, [scanBuffer]);

  // Base fields
  const baseStockFields = [
    {
      name: "store",
      label: t("common.store"),
      type: "select",
      placeholder: t("common.select_store"),
      required: true,
      options: stores
        .filter((store) => store.is_main)
        .map((store) => ({
          value: store.id,
          label: store.name,
        })),
      isLoading: storesLoading,
    },
    {
      name: "product",
      label: t("common.product"),
      type: "searchable-select",
      placeholder: t("common.product"),
      required: true,
      options: allProducts.map((product) => ({
        value: product.id,
        label: product.product_name,
      })),
      searchTerm: productSearchTerm,
      onSearch: (value: string) => setProductSearchTerm(value),
    },
    {
      name: "currency",
      label: t("common.currency"),
      type: "select",
      placeholder: t("common.select_currency"),
      required: true,
      options: currencies.map((currency) => ({
        value: currency.id,
        label: `${currency.name} (${currency.short_name})`,
      })),
      isLoading: currenciesLoading,
    },
    {
      name: "purchase_unit",
      label: t("common.purchase_unit"),
      type: "select",
      placeholder: t("common.select_purchase_unit"),
      required: true,
      // FIXED: Use available_units from selected product
      options:
        selectedProduct?.available_units?.map((unit: any) => ({
          value: unit.id,
          label: `${unit.short_name}${unit.is_base ? " (base)" : ""}`,
        })) || [],
      isLoading: measurementsLoading,
    },
    {
      name: "supplier",
      label: t("common.supplier"),
      type: "select",
      placeholder: t("common.select_supplier"),
      required: true,
      options: suppliers.map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
      })),
      createNewLabel: t("common.create_new_supplier"),
      onCreateNew: () => setCreateSupplierOpen(true),
      isLoading: suppliersLoading,
    },
    {
      name: "date_of_arrived",
      label: t("common.date_of_arrival"),
      type: "datetime-local",
      placeholder: t("common.enter_arrival_date"),
      required: true,
    },
    ...(selectedProduct?.category_read?.sell_from_stock
      ? [
          {
            name: "stock_name",
            label: t("common.stock_name"),
            type: "text",
            placeholder: t("common.enter_stock_name"),
            required: false,
          },
        ]
      : []),
  ];

  // FIXED: Show dynamic fields in API response order
  const getDynamicFieldsByOrder = () => {
    if (!initialCalculationDone) return [];

    return dynamicFieldsOrder
      .filter((fieldName) => {
        const fieldData = dynamicFields[fieldName];
        return fieldData && fieldData.show;
      })
      .map((fieldName) => {
        const fieldData = dynamicFields[fieldName];
        return {
          name: fieldName,
          label: fieldData.label,
          type: "number",
          placeholder: fieldData.label,
          required: false,
          readOnly: !fieldData.editable,
          value: fieldData.editable
            ? undefined
            : formatNumberDisplay(formatFieldValue(fieldData.value)),
        };
      });
  };

  const allFields = [...baseStockFields, ...getDynamicFieldsByOrder()];

  const handleSubmit = async (data: FormValues) => {
    try {
      const requiredFields = [
        "store",
        "product",
        "currency",
        "purchase_unit",
        "supplier",
        "date_of_arrived",
      ];
      const missingFields = requiredFields.filter(
        (field) => !data[field as keyof FormValues],
      );

      if (missingFields.length > 0) {
        toast.error(
          t("validation.fill_all_required_fields") ||
            "Please fill all required fields",
        );
        return;
      }

      console.log("[Debug] Submitting data. Raw quantity:", data.quantity);
      const payload: any = {
        store: Number(data.store),
        product: Number(data.product),
        currency: Number(data.currency),
        purchase_unit: Number(data.purchase_unit),
        supplier: Number(data.supplier),
        date_of_arrived: data.date_of_arrived,
        ...(data.stock_name && { stock_name: data.stock_name }),
      };

      // Handle dynamic fields - send both editable and disabled fields with their values
      Object.entries(dynamicFields).forEach(([fieldName, fieldData]) => {
        // Skip conversion_factor and other internal fields that shouldn't be sent
        if (fieldName === "conversion_factor") return;

        const formValue = data[fieldName as keyof FormValues];
        const isQuantityField =
          fieldName === "quantity" || fieldName === "purchase_unit_quantity";

        // For quantity fields, send both editable (from form) and non-editable (calculated) values
        if (isQuantityField) {
          if (fieldData.editable) {
            // Editable field: use form value if provided
            if (formValue && Number(formValue) !== 0) {
              payload[fieldName] = formatNumberForAPI(formValue);
            }
          } else {
            // Non-editable field: use calculated value from fieldData
            if (fieldData.value !== null && fieldData.value !== undefined) {
              const numValue = Number(fieldData.value);
              if (!isNaN(numValue) && numValue !== 0) {
                payload[fieldName] = formatNumberForAPI(numValue);
              }
            }
          }
        } else {
          // Handle exchange_rate - always send id from object value
          if (
            fieldName === "exchange_rate" &&
            fieldData.value !== null &&
            fieldData.value !== undefined &&
            typeof fieldData.value === "object" &&
            (fieldData.value as any).id
          ) {
            payload[fieldName] = (fieldData.value as any).id;
          }
          // Handle other object fields with id
          else if (
            fieldData.value !== null &&
            fieldData.value !== undefined &&
            typeof fieldData.value === "object" &&
            (fieldData.value as any).id !== undefined
          ) {
            payload[fieldName] = (fieldData.value as any).id;
          }
          // For regular non-quantity fields
          else if (fieldData.editable) {
            // Editable field: use form value if provided
            if (formValue && Number(formValue) !== 0) {
              payload[fieldName] = formatNumberForAPI(formValue);
            }
          } else {
            // Non-editable field: use calculated value from fieldData
            if (fieldData.value !== null && fieldData.value !== undefined) {
              const numValue = Number(fieldData.value);
              if (!isNaN(numValue) && numValue !== 0) {
                payload[fieldName] = formatNumberForAPI(numValue);
              }
            }
          }
        }
      });

      console.log("[Debug] Final payload for API:", payload);
      console.log("payload", payload);
      await createStock.mutateAsync(payload);
      toast.success("Stock created successfully");
      navigate("/stock");
    } catch (error) {
      toast.error("Failed to create stock");
      console.error("Failed to create stock:", error);
    }
  };

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

      <ResourceForm<FormValues>
        fields={allFields}
        onSubmit={handleSubmit}
        isSubmitting={createStock.isPending || isCalculating}
        title={t("common.create_new_stock")}
        form={form}
      />

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

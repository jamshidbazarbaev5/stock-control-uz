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
  // Required initial fields
  store: number | string;
  product: number | string;
  currency: number | string;
  purchase_unit: number | string;
  supplier: number | string;
  date_of_arrived: string;

  // Dynamic calculation fields (user input)
  purchase_unit_quantity?: number | string;
  total_price_in_currency?: number | string;
  price_per_unit_currency?: number | string;
  price_per_unit_uz?: number | string;
  exchange_rate?: number | string;

  // Backend calculated fields (will be populated from API response)
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

export default function CreateStock() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [dynamicFields, setDynamicFields] = useState<{
    [key: string]: DynamicField;
  }>({});
  const [isCalculating, setIsCalculating] = useState(false);

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
  const { data: measurementsData, isLoading: measurementsLoading } =
    useGetMeasurements({});

  // State for create new modals
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false);

  // Forms for creating new items
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
      purchase_unit_quantity: "",
      total_price_in_currency: "",
      price_per_unit_currency: "",
      price_per_unit_uz: "",
      exchange_rate: "",
      base_unit_in_currency: "",
      conversion_factor: "",
    },
  });

  // Get the arrays from response data
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
  const measurements = Array.isArray(measurementsData)
    ? measurementsData
    : measurementsData?.results || [];

  // Fetch all products from all API pages
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

  // State to track if initial calculation has been done
  const [initialCalculationDone, setInitialCalculationDone] = useState(false);

  // Store calculation metadata from initial API call
  const [calculationMetadata, setCalculationMetadata] = useState<{
    conversion_factor: number;
    exchange_rate: number;
    is_base_currency: boolean;
  } | null>(null);

  // Calculate fields locally using metadata
  const calculateFields = useCallback(
    (changedField: string, currentValues: any) => {
      if (!calculationMetadata) return currentValues;

      const result = { ...currentValues };
      const { conversion_factor, exchange_rate, is_base_currency } =
        calculationMetadata;
      const qty = result.purchase_unit_quantity;

      // Quantity ↔️ purchase_unit_quantity
      if (changedField === "purchase_unit_quantity" && qty) {
        result.quantity = qty * conversion_factor;
        result.total_price_in_currency =
          (result.price_per_unit_currency || 0) * qty;
        result.total_price_in_uz = (result.price_per_unit_uz || 0) * qty;
      } else if (changedField === "quantity" && result.quantity) {
        result.purchase_unit_quantity = result.quantity / conversion_factor;
        result.total_price_in_currency =
          (result.price_per_unit_currency || 0) * result.purchase_unit_quantity;
        result.total_price_in_uz =
          (result.price_per_unit_uz || 0) * result.purchase_unit_quantity;
      }

      // Price calculations
      if (!is_base_currency && qty) {
        if (changedField === "price_per_unit_currency")
          result.total_price_in_currency = result.price_per_unit_currency * qty;
        if (changedField === "total_price_in_currency")
          result.price_per_unit_currency = result.total_price_in_currency / qty;
        result.price_per_unit_uz =
          (result.price_per_unit_currency || 0) * exchange_rate;
        result.total_price_in_uz =
          (result.total_price_in_currency || 0) * exchange_rate;
      } else if (is_base_currency && qty) {
        if (changedField === "price_per_unit_uz")
          result.total_price_in_uz = result.price_per_unit_uz * qty;
        if (changedField === "total_price_in_uz")
          result.price_per_unit_uz = result.total_price_in_uz / qty;
      }

      // Base unit cost
      if (result.quantity) {
        result.base_unit_in_currency =
          (result.total_price_in_currency || 0) / result.quantity;
        result.base_unit_in_uzs =
          (result.total_price_in_uz || 0) / result.quantity;
      }

      return result;
    },
    [calculationMetadata],
  );

  // Get field configuration when base fields are selected
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
      setDynamicFields(response.dynamic_fields);

      // Populate form with initial calculated values from the API response
      Object.entries(response.dynamic_fields).forEach(
        ([fieldName, fieldData]) => {
          if (fieldData.value !== null && fieldData.value !== undefined) {
            // Use the existing helper function to get the correct display value
            const displayValue = formatFieldValue(fieldData.value);

            form.setValue(fieldName as keyof FormValues, displayValue, {
              shouldValidate: false,
            });
          }
        },
      );

      // Extract calculation metadata
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

  // Update form values using local calculations
  const updateFormWithCalculations = useCallback(
    (changedField: string) => {
      if (!calculationMetadata) return;

      const currentValues = form.getValues();

      // Convert form values to numbers for calculations
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

      // Calculate new values
      const calculatedValues = calculateFields(changedField, numericValues);

      // Update form with calculated values
      Object.entries(calculatedValues).forEach(([fieldName, value]) => {
        if (fieldName !== changedField && value !== undefined) {
          form.setValue(fieldName as keyof FormValues, String(value), {
            shouldValidate: false,
          });
        }
      });

      // Update dynamic fields to reflect new calculated values
      const updatedDynamicFields = { ...dynamicFields };
      Object.entries(calculatedValues).forEach(([fieldName, value]) => {
        if (updatedDynamicFields[fieldName]) {
          // @ts-ignore
          updatedDynamicFields[fieldName] = {
            ...updatedDynamicFields[fieldName],
            value: value as any,
          };
        }
      });
      setDynamicFields(updatedDynamicFields);
    },
    [calculationMetadata, form, dynamicFields, calculateFields],
  );



  // State to track previous values for change detection
  const [previousValues, setPreviousValues] = useState<{
    purchase_unit_quantity?: string | number;
    total_price_in_currency?: string | number;
    price_per_unit_currency?: string | number;
    price_per_unit_uz?: string | number;
  }>({});

  // Watch only required fields for initial calculation
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

    // Trigger calculation only once when all required fields are filled and calculation hasn't been done yet
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
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [requiredFields, getFieldConfiguration, initialCalculationDone, form]);

  // Watch calculation trigger fields for updates after initial load
  const watchedFields = form.watch([
    "purchase_unit_quantity",
    "total_price_in_currency",
    "price_per_unit_currency",
    "price_per_unit_uz",
  ]);

  useEffect(() => {
    const [
      purchaseUnitQuantity,
      totalPriceInCurrency,
      pricePerUnitCurrency,
      pricePerUnitUz,
    ] = watchedFields;

    // Check if values have actually changed
    const hasChanged =
      purchaseUnitQuantity !== previousValues.purchase_unit_quantity ||
      totalPriceInCurrency !== previousValues.total_price_in_currency ||
      pricePerUnitCurrency !== previousValues.price_per_unit_currency ||
      pricePerUnitUz !== previousValues.price_per_unit_uz;

    // Only trigger calculation if values have changed and initial calculation was done
    if (hasChanged && initialCalculationDone && calculationMetadata) {
      const timeoutId = setTimeout(() => {
        // Determine which field changed
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
        }

        if (changedField) {
          updateFormWithCalculations(changedField);
        }

        // Update previous values after calculation
        setPreviousValues({
          purchase_unit_quantity: purchaseUnitQuantity,
          total_price_in_currency: totalPriceInCurrency,
          price_per_unit_currency: pricePerUnitCurrency,
          price_per_unit_uz: pricePerUnitUz,
        });
      }, 500); // 500ms debounce

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

  // Barcode scanner functionality
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      // Clear any existing timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      // Start scanning mode
      setIsScanning(true);

      // Handle Enter key (end of barcode scan)
      if (event.key === "Enter") {
        event.preventDefault();
        if (scanBuffer.trim()) {
          console.log("Searching for product with barcode:", scanBuffer.trim());

          // Search for product by barcode
          searchProductByBarcode(scanBuffer.trim())
            .then((product) => {
              if (product) {
                // Product found - select it in the form
                form.setValue("product", product.id!);
                toast.success(
                  `Product found and selected: ${product.product_name}`,
                );

                // Clear search term to show all products again
                setProductSearchTerm("");
              } else {
                // No product found - use barcode as search term
                setProductSearchTerm(scanBuffer.trim());
                toast.info(
                  `No product found with barcode: ${scanBuffer.trim()}. Showing search results.`,
                );
              }
            })
            .catch((error) => {
              console.error("Error searching for product:", error);
              // Fallback: use barcode as search term
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

      // Accumulate characters for barcode
      if (event.key.length === 1) {
        // Only single characters, not special keys
        setScanBuffer((prev) => prev + event.key);

        // Set timeout to reset buffer if scanning stops
        scanTimeoutRef.current = setTimeout(() => {
          setScanBuffer("");
          setIsScanning(false);
        }, 100); // 100ms timeout between characters
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyPress);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [scanBuffer]);

  // Define base stock fields
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
      options: measurements.map((measurement) => ({
        value: measurement.id,
        label: `${measurement.measurement_name} (${measurement.short_name || ""})`,
      })),
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
  ];

  // Dynamic calculation fields - only show fields that are marked as 'show: true' in API response AND initial calculation is done
  const calculationFields = initialCalculationDone
    ? Object.entries(dynamicFields)
        .filter(
          ([fieldName, fieldData]) =>
            [
              "purchase_unit_quantity",
              "total_price_in_currency",
              "price_per_unit_currency",
              "price_per_unit_uz",
            ].includes(fieldName) && fieldData.show,
        )
        .map(([fieldName, fieldData]) => ({
          name: fieldName,
          label: fieldData.label,
          type: "number",
          placeholder: fieldData.label,
          required: false,
          readOnly: !fieldData.editable,
        }))
    : [];

  // Helper function to safely convert value to string
  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "";
    }

    // If it's an object, try to extract meaningful value
    if (typeof value === "object") {
      // Handle direct exchange rate object like { id: 1, rate: 13000.0 }
      if (value.rate !== undefined) {
        return String(value.rate);
      }

      // Handle nested object structure like exchange_rate: { value: { id: 1, rate: 13000.0 } }
      if (value.value !== undefined && typeof value.value === "object") {
        // Check if the nested value object has a rate property
        if (value.value.rate !== undefined) {
          return String(value.value.rate);
        }
        // Check if the nested value object has an amount property
        if (value.value.amount !== undefined) {
          return String(value.value.amount);
        }
        // If nested value is a simple value, use it
        if (typeof value.value !== "object") {
          return String(value.value);
        }
        // If it's still an object, try to find any numeric property
        const numericKeys = ["rate", "amount", "price", "value", "id"];
        for (const key of numericKeys) {
          if (value.value[key] !== undefined) {
            return String(value.value[key]);
          }
        }
      }
      // If it has a direct 'value' property that's not an object, use that
      else if (value.value !== undefined) {
        return String(value.value);
      }

      // If it has an 'amount' property, use that
      if (value.amount !== undefined) {
        return String(value.amount);
      }

      // For exchange rate objects with id but no rate, show the id
      if (value.id !== undefined) {
        return String(value.id);
      }

      // Try to JSON stringify if it's a simple object, but avoid showing [object Object]
      try {
        const stringified = JSON.stringify(value);
        if (stringified === "{}" || stringified === "[]") {
          return "";
        }
        return stringified;
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  // Add dynamic backend-calculated fields based on API response (filter out input fields and only show visible fields) AND initial calculation is done
  const dynamicCalculatedFields = initialCalculationDone
    ? Object.entries(dynamicFields)
        .filter(
          ([fieldName, fieldData]) =>
            ![
              "purchase_unit_quantity",
              "total_price_in_currency",
              "price_per_unit_currency",
              "price_per_unit_uz",
            ].includes(fieldName) && fieldData.show,
        )
        .map(([fieldName, fieldData]) => ({
          name: fieldName,
          label: fieldData.label,
          type: "text",
          placeholder: fieldData.label,
          required: false,
          readOnly: !fieldData.editable,
          value: formatFieldValue(fieldData.value),
        }))
    : [];

  // Combine all fields
  const allFields = [
    ...baseStockFields,
    ...calculationFields,
    ...dynamicCalculatedFields,
  ];

  const handleSubmit = async (data: FormValues) => {
    try {
      // Validate required fields
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

      // Build the final payload combining user input and calculated values
      const payload: any = {
        // Required fields
        store: Number(data.store),
        product: Number(data.product),
        currency: Number(data.currency),
        purchase_unit: Number(data.purchase_unit),
        supplier: Number(data.supplier),
        date_of_arrived: data.date_of_arrived,

        // Include calculation input fields (user entered values)
        ...(data.purchase_unit_quantity && {
          purchase_unit_quantity: Number(data.purchase_unit_quantity),
        }),
        ...(data.total_price_in_currency && {
          total_price_in_currency: Number(data.total_price_in_currency),
        }),
        ...(data.price_per_unit_currency && {
          price_per_unit_currency: Number(data.price_per_unit_currency),
        }),
        ...(data.price_per_unit_uz && {
          price_per_unit_uz: Number(data.price_per_unit_uz),
        }),

        // Include all dynamic calculated fields from API response
        ...Object.entries(dynamicFields).reduce(
          (acc, [fieldName, fieldData]) => {
            if (fieldData.value !== null && fieldData.value !== undefined) {
              // Handle special cases where backend expects different format
              if (
                fieldName === "exchange_rate" &&
                typeof fieldData.value === "object" &&
                (fieldData.value as any).id
              ) {
                // Extract ID for exchange_rate since backend expects pk value
                acc[fieldName] = (fieldData.value as any).id;
              } else if (
                fieldName === "exchange_rate" &&
                typeof fieldData.value === "object" &&
                (fieldData.value as any).rate
              ) {
                // Extract rate for exchange_rate if it has rate property
                acc[fieldName] = (fieldData.value as any).rate;
              } else if (
                typeof fieldData.value === "object" &&
                (fieldData.value as any).id !== undefined
              ) {
                // For other objects with ID, extract the ID
                acc[fieldName] = (fieldData.value as any).id;
              } else {
                // For primitive values, use as-is
                acc[fieldName] = fieldData.value;
              }
            }
            return acc;
          },
          {} as any,
        ),
      };

      console.log("Final payload:", payload); // Debug log
      await createStock.mutateAsync(payload);
      toast.success("Stock created successfully");
      navigate("/stock");
    } catch (error) {
      toast.error("Failed to create stock");
      console.error("Failed to create stock:", error);
    }
  };

  // Handlers for creating new items
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
      {/* Barcode Scanner Status */}
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

      {/* Create Product Modal */}
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

      {/* Create Supplier Modal */}
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

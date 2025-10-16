import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResourceTable } from "../helpers/ResourseTable";
import { toast } from "sonner";
import { type Product, useGetProducts, useDeleteProduct } from "../api/product";
import { useGetCategories } from "../api/category";
import { useTranslation } from "react-i18next";
import { useGetMeasurements } from "../api/measurement";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RevaluationDialog } from "@/components/dialogs/RevaluationDialog";
import { useProductRevaluation } from "../api/revaluation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PriceEdit {
  productId: number;
  selling_price?: string;
  selling_price_in_currency?: string;
  min_price?: string;
}

const columns = (
  t: any,
  onPrint: (product: Product) => void,
  selectedProducts: number[],
  onSelectProduct: (productId: number) => void,
  priceEdits: Record<number, PriceEdit>,
  onPriceChange: (
    productId: number,
    field: "selling_price" | "selling_price_in_currency" | "min_price",
    value: string,
  ) => void,
  onCurrencyPriceChange?: (
    productId: number,
    currencyPrice: string,
    sellInCurrencyUnit: any,
  ) => void,
) => [
  {
    header: t("table.select"),
    accessorKey: "select",
    cell: (product: any) => {
      return (
        <input
          type="checkbox"
          checked={product?.id ? selectedProducts.includes(product?.id) : false}
          onChange={(e) => {
            e.stopPropagation();
            if (product?.id) {
              onSelectProduct(product?.id);
            }
          }}
          className="w-4 h-4"
        />
      );
    },
  },
  {
    header: t("table.name"),
    accessorKey: "product_name",
  },
  {
    header: t("table.category"),
    accessorKey: (row: Product) =>
      row.category_read?.category_name || row.category_write,
  },
  {
    header: t("table.selling_price_in_currency"),
    accessorKey: "selling_price_in_currency",
    cell: (product: any) => {
      if (!product?.sell_in_currency_unit) {
        return <span className="text-muted-foreground">-</span>;
      }
      const editValue = priceEdits[product?.id]?.selling_price_in_currency;
      return (
        <Input
          type="number"
          step="0.01"
          value={
            editValue !== undefined
              ? editValue
              : product?.selling_price_in_currency || ""
          }
          onChange={(e) => {
            e.stopPropagation();
            if (product?.id && onCurrencyPriceChange) {
              onCurrencyPriceChange(
                product.id,
                e.target.value,
                product.sell_in_currency_unit,
              );
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-28"
        />
      );
    },
  },
  {
    header: t("table.selling_price"),
    accessorKey: "selling_price",
    cell: (product: any) => {
      const editValue = priceEdits[product?.id]?.selling_price;
      return (
        <Input
          type="number"
          step="0.01"
          value={
            editValue !== undefined ? editValue : product?.selling_price || ""
          }
          onChange={(e) => {
            e.stopPropagation();
            if (product?.id) {
              onPriceChange(product.id, "selling_price", e.target.value);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-28"
        />
      );
    },
  },
  {
    header: t("table.min_price"),
    accessorKey: "min_price",
    cell: (product: any) => {
      const editValue = priceEdits[product?.id]?.min_price;
      return (
        <Input
          type="number"
          step="0.01"
          value={editValue !== undefined ? editValue : product?.min_price || ""}
          onChange={(e) => {
            e.stopPropagation();
            if (product?.id) {
              onPriceChange(product.id, "min_price", e.target.value);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-28"
        />
      );
    },
  },

  {
    header: t("table.actions"),
    accessorKey: "id",
    cell: (product: any) => {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (product && product.id) {
              onPrint(product);
            }
          }}
          disabled={!product?.id}
        >
          {t("buttons.print")}
        </Button>
      );
    },
  },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [isRevaluationDialogOpen, setIsRevaluationDialogOpen] = useState(false);
  const [priceEdits, setPriceEdits] = useState<Record<number, PriceEdit>>({});
  const [productTab, setProductTab] = useState<
    "with_quantity" | "without_quantity"
  >("with_quantity");

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedMeasurement, productTab]);

  const { data: productsData, isLoading } = useGetProducts({
    params: {
      page,
      non_zero: productTab === "with_quantity" ? 1 : 0,
      ...(searchTerm && { product_name: searchTerm }),
      ...(selectedCategory && { category: selectedCategory }),
      ...(selectedMeasurement && { measurement: selectedMeasurement }),
    },
  });

  // Handle both array and object response formats
  const results = Array.isArray(productsData)
    ? productsData
    : productsData?.results || [];
  const totalCount = Array.isArray(productsData)
    ? productsData.length
    : productsData?.count || 0;

  const products = results.map((product, index) => ({
    ...product,
    displayId: (page - 1) * 10 + index + 1,
  }));

  const { mutate: deleteProduct } = useDeleteProduct();

  // Fetch categories and measurements for the select dropdowns
  const { data: categoriesData } = useGetCategories({});
  const { data: measurementsData } = useGetMeasurements({});

  // Get the categories and measurements arrays
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData?.results || [];
  const measurementsList = Array.isArray(measurementsData)
    ? measurementsData
    : measurementsData?.results || [];

  const handleEdit = (product: Product) => {
    navigate(`/edit-product/${product?.id}`);
  };

  const handleDelete = (id: number) => {
    deleteProduct(id, {
      onSuccess: () =>
        toast.success(
          t("messages.success.deleted", { item: t("table.product") }),
        ),
      onError: () =>
        toast.error(t("messages.error.delete", { item: t("table.product") })),
    });
  };

  const handlePrint = (product: Product) => {
    if (!product?.id) {
      toast.error(t("messages.error.invalidProduct"));
      return;
    }
    navigate(`/print-barcode/${product.id}`);
  };

  const { mutate: revaluateProducts } = useProductRevaluation();

  const handleRevaluation = (data: {
    comment: string;
    new_selling_price: string;
    new_min_price: string;
  }) => {
    if (selectedProducts.length === 0) {
      toast.error(t("messages.error.noProductsSelected"));
      return;
    }

    revaluateProducts(
      {
        ...data,
        product_ids: selectedProducts,
      },
      {
        onSuccess: () => {
          toast.success(t("messages.success.revaluation"));
          setIsRevaluationDialogOpen(false);
          setSelectedProducts([]);
        },
        onError: () => {
          toast.error(t("messages.error.revaluation"));
        },
      },
    );
  };

  const handlePriceChange = (
    productId: number,
    field: "selling_price" | "selling_price_in_currency" | "min_price",
    value: string,
  ) => {
    setPriceEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        productId,
        [field]: value,
      },
    }));
  };

  const handleCurrencyPriceChange = (
    productId: number,
    currencyPrice: string,
    sellInCurrencyUnit: any,
  ) => {
    const price = parseFloat(currencyPrice);
    if (!isNaN(price)) {
      let calculatedPrice: number;

      if (sellInCurrencyUnit.action === "*") {
        calculatedPrice =
          price *
          sellInCurrencyUnit.exchange_rate *
          sellInCurrencyUnit.conversion;
      } else if (sellInCurrencyUnit.action === "/") {
        calculatedPrice =
          (price / sellInCurrencyUnit.exchange_rate) *
          sellInCurrencyUnit.conversion;
      } else {
        calculatedPrice =
          price *
          sellInCurrencyUnit.exchange_rate *
          sellInCurrencyUnit.conversion;
      }

      setPriceEdits((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          productId,
          selling_price_in_currency: currencyPrice,
          selling_price: calculatedPrice.toFixed(2),
        },
      }));
    } else {
      setPriceEdits((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          productId,
          selling_price_in_currency: currencyPrice,
        },
      }));
    }
  };

  const handleSavePrices = () => {
    const editsToSave = Object.values(priceEdits).filter(
      (edit) =>
        edit.selling_price !== undefined ||
        edit.selling_price_in_currency !== undefined ||
        edit.min_price !== undefined,
    );

    if (editsToSave.length === 0) {
      toast.error(
        t("messages.error.noPriceChanges") || "No price changes to save",
      );
      return;
    }

    // Save each product's price changes individually
    editsToSave.forEach((edit) => {
      const product = products.find((p) => p.id === edit.productId);
      if (!product) return;

      const newSellingPrice =
        edit.selling_price !== undefined
          ? edit.selling_price
          : String(product.selling_price);
      const newMinPrice =
        edit.min_price !== undefined
          ? edit.min_price
          : String(product.min_price);
      const newSellingPriceInCurrency =
        edit.selling_price_in_currency !== undefined
          ? edit.selling_price_in_currency
          : product.selling_price_in_currency
            ? String(product.selling_price_in_currency)
            : undefined;

      revaluateProducts(
        {
          comment: "Price update from products page",
          new_selling_price: newSellingPrice,
          new_min_price: newMinPrice,
          new_selling_price_in_currency: newSellingPriceInCurrency,
          product_ids: [edit.productId],
        },
        {
          onSuccess: () => {
            toast.success(
              t("messages.success.priceUpdated") ||
                `Price updated for ${product.product_name}`,
            );
            setPriceEdits((prev) => {
              const newEdits = { ...prev };
              delete newEdits[edit.productId];
              return newEdits;
            });
          },
          onError: () => {
            toast.error(
              t("messages.error.priceUpdate") ||
                `Failed to update price for ${product.product_name}`,
            );
          },
        },
      );
    });
  };

  return (
    <div className="container mx-auto py-3">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold">{t("navigation.products")}</h1>
        <div className="flex gap-2">
          <Button
            variant="default"
            disabled={Object.keys(priceEdits).length === 0}
            onClick={handleSavePrices}
          >
            {t("buttons.save")} ({Object.keys(priceEdits).length})
          </Button>
          {/*<Button*/}
          {/*  variant="secondary"*/}
          {/*  disabled={selectedProducts.length === 0}*/}
          {/*  onClick={() => setIsRevaluationDialogOpen(true)}*/}
          {/*>*/}
          {/*  {t("buttons.revaluate")} ({selectedProducts.length})*/}
          {/*</Button>*/}
        </div>
      </div>
      {/* Product Tabs */}
      <div className="mb-4">
        <Tabs
          value={productTab}
          onValueChange={(value) =>
            setProductTab(value as "with_quantity" | "without_quantity")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="with_quantity">
              {t("common.with_quantity") || "С количеством"}
            </TabsTrigger>
            <TabsTrigger value="without_quantity">
              {t("common.without_quantity") || "Без количества"}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <Input
          type="text"
          placeholder={t("placeholders.search_product")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder={t("placeholders.select_category")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.category_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedMeasurement}
          onValueChange={setSelectedMeasurement}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("placeholders.select_measurement")} />
          </SelectTrigger>
          <SelectContent>
            {measurementsList?.map((measurement) => (
              <SelectItem key={measurement.id} value={String(measurement.id)}>
                {measurement.measurement_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResourceTable
        data={products}
        columns={columns(
          t,
          handlePrint,
          selectedProducts,
          (productId: number) => {
            setSelectedProducts((prev) =>
              prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId],
            );
          },
          priceEdits,
          handlePriceChange,
          handleCurrencyPriceChange,
        )}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate("/create-product")}
        totalCount={totalCount}
        pageSize={30}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
        canDelete={(product: Product) => !product.is_default}
      />

      <RevaluationDialog
        isOpen={isRevaluationDialogOpen}
        onClose={() => setIsRevaluationDialogOpen(false)}
        onSubmit={handleRevaluation}
        selectedCount={selectedProducts.length}
        sellInCurrencyUnit={
          selectedProducts.length > 0
            ? products.find((p) => p.id === selectedProducts[0])
                ?.sell_in_currency_unit || null
            : null
        }
      />
    </div>
  );
}

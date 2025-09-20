// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import { useForm } from "react-hook-form";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
// } from "@/components/ui/form";
// import { fetchAllStocks } from "../api/fetchAllStocks";
// import { useGetRecyclings } from "@/core/api/recycling";
// import {
//   findRecyclingForStock,
//   calculateRecyclingProfit,
// } from "@/core/helpers/recyclingProfitUtils";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { useGetStores } from "../api/store";
// import { useGetClients } from "../api/client";
// import { useGetUsers } from "../api/user";
// import { useCreateSale, type Sale } from "@/core/api/sale";
// import { useCurrentUser } from "../hooks/useCurrentUser";
// import { addDays } from "date-fns";
// import { type User } from "../api/user";
// import {
//   ChevronDown,
//   ChevronUp,
//   Menu,
//   ExternalLink,
//   LogOut,
//   Users,
//   Minus,
//   Plus,
//   X,
//   Calculator,
//   BarChart3,
//   Edit,
//   ShoppingCart,
// } from "lucide-react";

// interface ExtendedUser extends User {
//   store_read?: {
//     id: number;
//     name: string;
//     address: string;
//     phone_number: string;
//     budget: string;
//     created_at: string;
//     is_main: boolean;
//     parent_store: number | null;
//     owner: number;
//   };
// }

// interface FormSaleItem {
//   stock_write: number;
//   selling_method: "Штук" | "Ед.измерения";
//   quantity: number;
//   subtotal: string;
// }

// interface FormSalePayment {
//   payment_method: string;
//   amount: number;
// }

// interface SaleFormData {
//   store_write: number;
//   sale_items: FormSaleItem[];
//   on_credit: boolean;
//   total_amount: string;
//   sale_payments: FormSalePayment[];
//   sold_by?: number;
//   sale_debt?: {
//     client: number;
//     due_date: string;
//     deposit?: number;
//   };
// }

// function calculateTotalProfit({
//   saleItems,
//   salePayments,
//   totalAmount,
//   selectedPrices,
//   stocks,
//   recyclingData,
//   getRecyclingRecord,
// }: {
//   saleItems: any[];
//   salePayments: any[];
//   totalAmount: number;
//   selectedPrices: Record<number, any>;
//   stocks: any[];
//   recyclingData: any;
//   getRecyclingRecord: (productId: number, stockId: number) => any;
// }) {
//   const totalPayments = salePayments.reduce(
//     (sum, payment) => sum + (payment.amount || 0),
//     0,
//   );
//   let totalProfit = 0;
//   saleItems.forEach((item, index) => {
//     if (selectedPrices[index]) {
//       const quantity = item.quantity || 1;
//       const subtotal = parseFloat(item.subtotal) || 0;
//       const itemTotal = subtotal * quantity;
//       const stockId = item.stock_write;
//       const selectedStock = stocks.find((stock) => stock.id === stockId);
//       let profitPerUnit = 0;
//       let recyclingProfitUsed = false;
//       if (selectedStock && recyclingData) {
//         const recyclingRecord = getRecyclingRecord(
//           selectedStock.product_read.id,
//           selectedStock.id,
//         );
//         if (recyclingRecord) {
//           profitPerUnit = calculateRecyclingProfit(
//             recyclingRecord,
//             1,
//             subtotal,
//           );
//           totalProfit += profitPerUnit * quantity;
//           recyclingProfitUsed = true;
//         }
//       }
//       if (!recyclingProfitUsed && selectedStock) {
//         const purchasePrice = selectedPrices[index].purchasePrice || 0;
//         profitPerUnit = subtotal - purchasePrice;
//         totalProfit += profitPerUnit * quantity;
//       }
//     }
//   });
//   return totalProfit;
// }

// export default function CreateSalePos() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { t } = useTranslation();
//   const { data: currentUser } = useCurrentUser();
//   const { data: usersData } = useGetUsers({});

//   // Get URL parameters
//   const searchParams = new URLSearchParams(location.search);
//   const productId = searchParams.get("productId");
//   const stockId = searchParams.get("stockId");

//   const users = Array.isArray(usersData) ? usersData : usersData?.results || [];

//   // POS Interface States
//   const [currentInput, setCurrentInput] = useState("");
//   const [selectedProductIndex, setSelectedProductIndex] = useState(0);

//   // Initialize selectedStore and check user roles
//   const isAdmin = currentUser?.role === "Администратор";
//   const isSuperUser = currentUser?.is_superuser === true;
//   const [selectedStore, setSelectedStore] = useState<number | null>(
//     currentUser?.store_read?.id || null,
//   );
//   const [selectedStocks, setSelectedStocks] = useState<Record<number, number>>(
//     {},
//   );
//   const [selectedPrices, setSelectedPrices] = useState<
//     Record<
//       number,
//       {
//         min: number;
//         selling: number;
//         purchasePrice: number;
//         profit: number;
//       }
//     >
//   >({});
//   const [searchTerm, setSearchTerm] = useState("");
//   const [productSearchTerm, setProductSearchTerm] = useState("");
//   const [, forceRender] = useState({});

//   // Form setup
//   const form = useForm<SaleFormData>({
//     defaultValues: {
//       sale_items: [
//         {
//           stock_write: stockId ? Number(stockId) : 0,
//           selling_method: "Штук",
//           quantity: 1,
//           subtotal: "0",
//         },
//       ],
//       sale_payments: [{ payment_method: "Наличные", amount: 0 }],
//       on_credit: false,
//       total_amount: "0",
//       store_write: currentUser?.store_read?.id || 0,
//       sold_by: !isSuperUser && !isAdmin ? currentUser?.id : undefined,
//       sale_debt: {
//         client: 0,
//         due_date: addDays(new Date(), 30).toISOString().split("T")[0],
//       },
//     },
//     mode: "onChange",
//   });

//   // Data fetching
//   const [stores, setStores] = useState<any[]>([]);
//   const [clients, setClients] = useState<any[]>([]);
//   const [stocks, setStocks] = useState<any[]>([]);
//   const [filteredStocks, setFilteredStocks] = useState<any[]>([]);

//   const { data: storesData } = useGetStores({});
//   const { data: clientsData } = useGetClients({});
//   const { data: recyclingData } = useGetRecyclings();

//   useEffect(() => {
//     if (storesData) {
//       setStores(
//         Array.isArray(storesData) ? storesData : storesData.results || [],
//       );
//     }
//     if (clientsData) {
//       setClients(
//         Array.isArray(clientsData) ? clientsData : clientsData.results || [],
//       );
//     }
//   }, [storesData, clientsData]);

//   useEffect(() => {
//     const loadStocks = async () => {
//       try {
//         const stocksData = await fetchAllStocks();
//         setStocks(stocksData);
//         setFilteredStocks(stocksData);
//       } catch (error) {
//         console.error("Error loading stocks:", error);
//         toast.error("Failed to load stocks");
//       }
//     };
//     loadStocks();
//   }, []);

//   // Calculate totals
//   const saleItems = form.watch("sale_items") || [];
//   const salePayments = form.watch("sale_payments") || [];

//   const totalAmount = useMemo(() => {
//     return saleItems.reduce((sum, item, index) => {
//       const quantity = item.quantity || 1;
//       const price = parseFloat(item.subtotal) || 0;
//       return sum + quantity * price;
//     }, 0);
//   }, [saleItems]);

//   const currentProduct = saleItems[selectedProductIndex];
//   const currentStock = currentProduct
//     ? stocks.find((s) => s.id === currentProduct.stock_write)
//     : null;

//   // POS Calculator handlers
//   const handleNumberClick = (num: string) => {
//     setCurrentInput((prev) => prev + num);
//   };

//   const handleClear = () => {
//     setCurrentInput("");
//   };

//   const handleBackspace = () => {
//     setCurrentInput((prev) => prev.slice(0, -1));
//   };

//   const handleApplyInput = () => {
//     if (currentInput && selectedProductIndex >= 0) {
//       const value = parseFloat(currentInput.replace(",", "."));
//       if (!isNaN(value)) {
//         form.setValue(
//           `sale_items.${selectedProductIndex}.subtotal`,
//           value.toString(),
//         );
//         setCurrentInput("");
//       }
//     }
//   };

//   // Add product
//   const addProduct = () => {
//     const currentItems = form.getValues("sale_items");
//     form.setValue("sale_items", [
//       ...currentItems,
//       { stock_write: 0, selling_method: "Штук", quantity: 1, subtotal: "0" },
//     ]);
//   };

//   // Remove product
//   const removeProduct = (index: number) => {
//     const currentItems = form.getValues("sale_items");
//     if (currentItems.length > 1) {
//       form.setValue(
//         "sale_items",
//         currentItems.filter((_, i) => i !== index),
//       );
//       if (selectedProductIndex >= currentItems.length - 1) {
//         setSelectedProductIndex(Math.max(0, selectedProductIndex - 1));
//       }
//     }
//   };

//   // Submit handler
//   const createSaleMutation = useCreateSale();

//   const onSubmit = async (data: SaleFormData) => {
//     try {
//       await createSaleMutation.mutateAsync(data as any);
//       toast.success(t("sale.created_successfully"));
//       navigate("/sales");
//     } catch (error) {
//       toast.error(t("sale.creation_failed"));
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Left Panel */}
//       <div className="flex-1 flex flex-col bg-white">
//         {/* Header */}
//         <div className="bg-white p-6 border-b border-gray-200">
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center space-x-6">
//               <div className="flex items-center space-x-2">
//                 <ShoppingCart className="w-6 h-6 text-gray-600" />
//                 <span className="font-bold text-lg">
//                   {t("sale.create_sale")}
//                 </span>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <BarChart3 className="w-5 h-5 text-gray-600" />
//                 <span className="text-lg">{saleItems.length}</span>
//               </div>
//             </div>
//             <div className="flex items-center space-x-4">
//               <Menu className="w-6 h-6 text-gray-700" />
//               <ExternalLink className="w-6 h-6 text-gray-700" />
//               <LogOut className="w-6 h-6 text-gray-700" />
//             </div>
//           </div>

//           {/* Current Product Header */}
//           <div className="mb-6">
//             <h2 className="text-3xl font-bold mb-2 text-gray-900">
//               {currentStock?.product_read?.name || t("sale.select_product")}
//             </h2>
//             {currentProduct && (
//               <div className="text-xl text-gray-700 font-medium">
//                 {currentProduct.quantity} x {currentProduct.subtotal} ={" "}
//                 {(
//                   currentProduct.quantity *
//                   parseFloat(currentProduct.subtotal || "0")
//                 ).toLocaleString()}
//               </div>
//             )}
//           </div>

//           {/* Summary Cards */}
//           <div className="flex space-x-4">
//             <div className="flex-1 bg-gray-100 rounded-xl p-6">
//               <div className="flex justify-between items-center">
//                 <div className="text-left">
//                   <div className="text-gray-600 text-sm">
//                     {t("sale.payment_method")}
//                   </div>
//                   <div className="text-lg font-semibold">
//                     {salePayments[0]?.payment_method || "Наличные"}
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-gray-600 text-sm mb-1">
//                     {t("sale.total")}
//                   </div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {totalAmount.toLocaleString()}
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <div className="flex-1 bg-gray-100 rounded-xl p-6">
//               <div className="flex justify-between items-center">
//                 <div className="text-left">
//                   <div className="text-gray-600 text-sm">
//                     {t("sale.discount")}
//                   </div>
//                   <div className="text-lg font-semibold">0</div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-gray-600 text-sm mb-1">
//                     {t("sale.to_pay")}
//                   </div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {totalAmount.toLocaleString()}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Product Table */}
//         <div className="flex-1 p-6">
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
//             <table className="w-full">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="text-left p-4 font-semibold text-gray-700">
//                     №
//                   </th>
//                   <th className="text-left p-4 font-semibold text-gray-700">
//                     {t("product.product")}
//                   </th>
//                   <th className="text-right p-4 font-semibold text-gray-700">
//                     {t("product.price")}
//                   </th>
//                   <th className="text-right p-4 font-semibold text-gray-700">
//                     {t("product.quantity")}
//                   </th>
//                   <th className="text-right p-4 font-semibold text-gray-700">
//                     {t("sale.amount")}
//                   </th>
//                   <th className="text-center p-4 font-semibold text-gray-700">
//                     {t("common.actions")}
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {saleItems.map((item, index) => {
//                   const stock = stocks.find((s) => s.id === item.stock_write);
//                   const isSelected = index === selectedProductIndex;
//                   return (
//                     <tr
//                       key={index}
//                       className={`cursor-pointer transition-colors ${
//                         isSelected
//                           ? "bg-blue-100 border-l-4 border-blue-500"
//                           : index % 2 === 0
//                             ? "bg-gray-50"
//                             : "bg-white"
//                       } hover:bg-blue-50`}
//                       onClick={() => setSelectedProductIndex(index)}
//                     >
//                       <td className="p-4 text-gray-900">{index + 1}</td>
//                       <td className="p-4">
//                         <Form {...form}>
//                           <FormField
//                             control={form.control}
//                             name={`sale_items.${index}.stock_write`}
//                             render={({ field }) => (
//                               <FormItem>
//                                 <Select
//                                   onValueChange={(value) =>
//                                     field.onChange(Number(value))
//                                   }
//                                   value={field.value?.toString()}
//                                 >
//                                   <SelectTrigger className="w-full">
//                                     <SelectValue
//                                       placeholder={t("product.select_product")}
//                                     />
//                                   </SelectTrigger>
//                                   <SelectContent>
//                                     {stocks.map((stock) => (
//                                       <SelectItem
//                                         key={stock.id}
//                                         value={stock.id.toString()}
//                                       >
//                                         {stock.product_read?.name ||
//                                           "Unknown Product"}
//                                       </SelectItem>
//                                     ))}
//                                   </SelectContent>
//                                 </Select>
//                               </FormItem>
//                             )}
//                           />
//                         </Form>
//                       </td>
//                       <td className="p-4 text-right">
//                         <Form {...form}>
//                           <FormField
//                             control={form.control}
//                             name={`sale_items.${index}.subtotal`}
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormControl>
//                                   <Input
//                                     {...field}
//                                     type="number"
//                                     className="text-right"
//                                     placeholder="0"
//                                   />
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />
//                         </Form>
//                       </td>
//                       <td className="p-4 text-right">
//                         <Form {...form}>
//                           <FormField
//                             control={form.control}
//                             name={`sale_items.${index}.quantity`}
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormControl>
//                                   <Input
//                                     {...field}
//                                     type="number"
//                                     className="text-right"
//                                     onChange={(e) =>
//                                       field.onChange(Number(e.target.value))
//                                     }
//                                     value={field.value}
//                                   />
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />
//                         </Form>
//                       </td>
//                       <td className="p-4 text-right font-semibold text-gray-900">
//                         {(
//                           item.quantity * parseFloat(item.subtotal || "0")
//                         ).toLocaleString()}
//                       </td>
//                       <td className="p-4 text-center">
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             removeProduct(index);
//                           }}
//                           className="text-red-500 hover:text-red-700 transition-colors"
//                         >
//                           <X className="w-4 h-4" />
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {/* Page indicator */}
//           <div className="flex items-center justify-between mt-6">
//             <div className="flex items-center space-x-3">
//               <span className="text-gray-600">{t("common.page")} № 1</span>
//               <button
//                 onClick={addProduct}
//                 className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
//               >
//                 <Plus className="w-5 h-5 text-gray-600" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Bottom Actions */}
//         <div className="p-6 border-t border-gray-200 bg-white">
//           <div className="flex space-x-3">
//             <button
//               onClick={() => navigate("/sales")}
//               className="flex-1 bg-red-500 text-white py-4 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center"
//             >
//               <X className="w-6 h-6" />
//             </button>
//             <button className="flex-1 bg-blue-500 text-white py-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center">
//               <Edit className="w-6 h-6" />
//             </button>
//             <button
//               onClick={handleApplyInput}
//               className="flex-1 bg-green-500 text-white py-4 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center"
//             >
//               <Calculator className="w-6 h-6" />
//             </button>
//             <button className="flex-1 bg-gray-500 text-white py-4 rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center">
//               <Minus className="w-6 h-6" />
//             </button>
//             <button
//               onClick={addProduct}
//               className="flex-1 bg-purple-500 text-white py-4 rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center"
//             >
//               <Plus className="w-6 h-6" />
//             </button>
//             <button className="flex-1 bg-indigo-500 text-white py-4 rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center">
//               <ChevronDown className="w-6 h-6" />
//             </button>
//             <button className="flex-1 bg-teal-500 text-white py-4 rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center">
//               <ChevronUp className="w-6 h-6" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Right Panel - Calculator */}
//       <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
//         {/* Calculator Display */}
//         <div className="p-6 border-b border-gray-200">
//           <div className="bg-gray-100 p-4 rounded-xl mb-4">
//             <div className="text-right text-3xl font-mono text-gray-900">
//               {currentInput || "0"}
//             </div>
//           </div>

//           {/* Store Selection for Admins */}
//           {isAdmin && (
//             <div className="mb-4">
//               <Form {...form}>
//                 <FormField
//                   control={form.control}
//                   name="store_write"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-sm text-gray-600">
//                         {t("store.store")}
//                       </FormLabel>
//                       <Select
//                         onValueChange={(value) => field.onChange(Number(value))}
//                         value={field.value?.toString()}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder={t("store.select_store")} />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {stores.map((store) => (
//                             <SelectItem
//                               key={store.id}
//                               value={store.id.toString()}
//                             >
//                               {store.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </FormItem>
//                   )}
//                 />
//               </Form>
//             </div>
//           )}

//           {/* Payment Method Selection */}
//           <div className="mb-4">
//             <Form {...form}>
//               <FormField
//                 control={form.control}
//                 name="sale_payments.0.payment_method"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel className="text-sm text-gray-600">
//                       {t("sale.payment_method")}
//                     </FormLabel>
//                     <Select onValueChange={field.onChange} value={field.value}>
//                       <SelectTrigger>
//                         <SelectValue
//                           placeholder={t("sale.select_payment_method")}
//                         />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Наличные">
//                           {t("payment.cash")}
//                         </SelectItem>
//                         <SelectItem value="Карта">
//                           {t("payment.card")}
//                         </SelectItem>
//                         <SelectItem value="Перевод">
//                           {t("payment.transfer")}
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </FormItem>
//                 )}
//               />
//             </Form>
//           </div>
//         </div>

//         {/* Calculator Keypad */}
//         <div className="flex-1 p-6">
//           <div className="grid grid-cols-3 gap-4 h-full">
//             {/* Row 1 */}
//             <button
//               onClick={() => handleNumberClick("1")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               1
//             </button>
//             <button
//               onClick={() => handleNumberClick("2")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               2
//             </button>
//             <button
//               onClick={() => handleNumberClick("3")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               3
//             </button>

//             {/* Row 2 */}
//             <button
//               onClick={() => handleNumberClick("4")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               4
//             </button>
//             <button
//               onClick={() => handleNumberClick("5")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               5
//             </button>
//             <button
//               onClick={() => handleNumberClick("6")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               6
//             </button>

//             {/* Row 3 */}
//             <button
//               onClick={() => handleNumberClick("7")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               7
//             </button>
//             <button
//               onClick={() => handleNumberClick("8")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               8
//             </button>
//             <button
//               onClick={() => handleNumberClick("9")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               9
//             </button>

//             {/* Row 4 */}
//             <button
//               onClick={() => handleNumberClick(",")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               ,
//             </button>
//             <button
//               onClick={() => handleNumberClick("0")}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               0
//             </button>
//             <button
//               onClick={handleBackspace}
//               className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
//             >
//               <X className="w-6 h-6" />
//             </button>

//             {/* Row 5 - Function buttons */}
//             <button
//               onClick={handleApplyInput}
//               className="bg-blue-100 hover:bg-blue-200 rounded-2xl transition-colors h-16 flex items-center justify-center"
//             >
//               <Calculator className="w-7 h-7 text-blue-600" />
//             </button>
//             <button
//               onClick={handleClear}
//               className="bg-blue-100 hover:bg-blue-200 rounded-2xl transition-colors h-16 flex items-center justify-center"
//             >
//               <BarChart3 className="w-7 h-7 text-blue-600" />
//             </button>
//             <button className="bg-blue-100 hover:bg-blue-200 rounded-2xl transition-colors h-16 flex items-center justify-center">
//               <span className="text-2xl font-bold text-blue-600">¥</span>
//             </button>
//           </div>
//         </div>

//         {/* Submit Button */}
//         <div className="p-6 border-t border-gray-200">
//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//               <button
//                 type="submit"
//                 disabled={createSaleMutation.isPending}
//                 className="w-full bg-blue-600 text-white py-5 rounded-2xl text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
//               >
//                 {createSaleMutation.isPending
//                   ? t("common.saving")
//                   : t("sale.complete_sale")}
//               </button>
//             </form>
//           </Form>
//         </div>
//       </div>
//     </div>
//   );
// }

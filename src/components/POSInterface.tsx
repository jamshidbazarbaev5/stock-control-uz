import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Menu,
  ExternalLink,
  LogOut,
  X,
  BarChart3,
  Search,
  User as UserIcon,
  Plus,
  X as CloseIcon,
} from "lucide-react";
import {
  WideDialog,
  WideDialogContent,
  WideDialogHeader,
  WideDialogTitle,
} from "@/components/ui/wide-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchAllStocks } from "@/core/api/fetchAllStocks";
import type { Stock } from "@/core/api/stock";
import { useCurrentUser } from "@/core/hooks/useCurrentUser";
import { useGetUsers } from "@/core/api/user";
import { useGetClients } from "@/core/api/client";
import type { User } from "@/core/api/user";

interface ProductInCart {
  id: number;
  stockId: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  stock: Stock;
}

interface ExtendedUser extends User {
  store_read?: {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    budget: string;
    created_at: string;
    is_main: boolean;
    parent_store: number | null;
    owner: number;
  };
}

interface SessionState {
  id: string;
  name: string;
  currentInput: string;
  previousInput: string;
  operation: string;
  waitingForNewValue: boolean;
  products: ProductInCart[];
  focusedProductIndex: number;
  selectedSeller: number | null;
  selectedClient: number | null;
  clientSearchTerm: string;
  onCredit: boolean;
}

const POSInterface = () => {
  // Session management
  const [sessions, setSessions] = useState<SessionState[]>([
    {
      id: "1",
      name: "Сессия 1",
      currentInput: "",
      previousInput: "",
      operation: "",
      waitingForNewValue: false,
      products: [],
      focusedProductIndex: -1,
      selectedSeller: null,
      selectedClient: null,
      clientSearchTerm: "",
      onCredit: false,
    },
  ]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  // Current session state (derived from active session)
  const currentSession = sessions[currentSessionIndex];
  const [currentInput, setCurrentInput] = useState(currentSession.currentInput);
  const [previousInput, setPreviousInput] = useState(
    currentSession.previousInput,
  );
  const [operation, setOperation] = useState<string>(currentSession.operation);
  const [waitingForNewValue, setWaitingForNewValue] = useState(
    currentSession.waitingForNewValue,
  );
  const [products, setProducts] = useState<ProductInCart[]>(
    currentSession.products,
  );
  const [focusedProductIndex, setFocusedProductIndex] = useState<number>(
    currentSession.focusedProductIndex,
  );
  const [selectedSeller, setSelectedSeller] = useState<number | null>(
    currentSession.selectedSeller,
  );
  const [selectedClient, setSelectedClient] = useState<number | null>(
    currentSession.selectedClient,
  );
  const [clientSearchTerm, setClientSearchTerm] = useState(
    currentSession.clientSearchTerm,
  );
  const [onCredit, setOnCredit] = useState(currentSession.onCredit);

  // Global modal states (shared across sessions)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Stock selection state
  const [selectedStocks, setSelectedStocks] = useState<Set<number>>(new Set());

  // User selection modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // User data
  const { data: currentUser } = useCurrentUser();
  const { data: usersData } = useGetUsers({});
  const { data: clientsData } = useGetClients({
    params: { name: clientSearchTerm },
  });

  const users = Array.isArray(usersData) ? usersData : usersData?.results || [];
  const clients = Array.isArray(clientsData)
    ? clientsData
    : clientsData?.results || [];

  // Check user roles
  const isAdmin = currentUser?.role === "Администратор";
  const isSuperUser = currentUser?.is_superuser === true;

  // Save current session state whenever it changes
  useEffect(() => {
    setSessions((prev) =>
      prev.map((session, index) =>
        index === currentSessionIndex
          ? {
              ...session,
              currentInput,
              previousInput,
              operation,
              waitingForNewValue,
              products,
              focusedProductIndex,
              selectedSeller,
              selectedClient,
              clientSearchTerm,
              onCredit,
            }
          : session,
      ),
    );
  }, [
    currentSessionIndex,
    currentInput,
    previousInput,
    operation,
    waitingForNewValue,
    products,
    focusedProductIndex,
    selectedSeller,
    selectedClient,
    clientSearchTerm,
    onCredit,
  ]);

  // Initialize seller selection for non-admin users
  useEffect(() => {
    if (!isAdmin && !isSuperUser && currentUser?.id && !selectedSeller) {
      setSelectedSeller(currentUser.id);
    }
  }, [currentUser?.id, isAdmin, isSuperUser, selectedSeller]);

  // Calculate totals
  const total = products.reduce((sum, product) => sum + product.total, 0);

  // Fetch stocks when modal opens or search term changes
  useEffect(() => {
    if (isSearchModalOpen) {
      const timeoutId = setTimeout(() => {
        setLoadingStocks(true);
        fetchAllStocks({
          product_name: searchTerm.length > 0 ? searchTerm : undefined,
        })
          .then((data) => setStocks(data))
          .catch((error) => console.error("Error fetching stocks:", error))
          .finally(() => setLoadingStocks(false));
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [isSearchModalOpen, searchTerm]);

  // Filter stocks based on search term and availability
  const filteredStocks = useMemo(() => {
    return stocks.filter(
      (stock) =>
        (stock.quantity ?? 0) > 0 &&
        (stock.product_read?.product_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          String(stock.id).includes(searchTerm)),
    );
  }, [stocks, searchTerm]);

  const handleNumberClick = (num: string) => {
    // Pure calculator behavior
    if (waitingForNewValue) {
      setCurrentInput(num);
      setWaitingForNewValue(false);
    } else {
      setCurrentInput((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
    setWaitingForNewValue(false);
  };

  const handleOperation = (nextOperation: string) => {
    const inputValue = parseFloat(currentInput.replace(",", ".")) || 0;

    if (previousInput === "" || waitingForNewValue) {
      setPreviousInput(inputValue.toString());
    } else if (operation) {
      const currentValue = parseFloat(currentInput.replace(",", ".")) || 0;
      const previousValue = parseFloat(previousInput) || 0;
      let result = 0;

      switch (operation) {
        case "+":
          result = previousValue + currentValue;
          break;
        case "-":
          result = previousValue - currentValue;
          break;
        case "*":
          result = previousValue * currentValue;
          break;
        case "/":
          result = currentValue !== 0 ? previousValue / currentValue : 0;
          break;
        default:
          return;
      }

      setPreviousInput(result.toString());
      setCurrentInput(result.toString());
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(currentInput.replace(",", ".")) || 0;
    const previousValue = parseFloat(previousInput) || 0;
    let result = 0;

    if (operation && previousInput !== "") {
      switch (operation) {
        case "+":
          result = previousValue + inputValue;
          break;
        case "-":
          result = previousValue - inputValue;
          break;
        case "*":
          result = previousValue * inputValue;
          break;
        case "/":
          result = inputValue !== 0 ? previousValue / inputValue : 0;
          break;
        default:
          return;
      }

      setCurrentInput(result.toString());
      setPreviousInput("");
      setOperation("");
      setWaitingForNewValue(true);
    }
  };

  const handleClearInput = () => {
    setCurrentInput("");
    setPreviousInput("");
    setOperation("");
    setWaitingForNewValue(false);
  };

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
    setSearchTerm("");
  };

  const handleUserClick = () => {
    setIsUserModalOpen(true);
    // Initialize seller selection based on user role
    if (!isAdmin && !isSuperUser && currentUser?.id) {
      setSelectedSeller(currentUser.id);
    }
  };

  // Session management functions
  const createNewSession = () => {
    const newSessionId = (sessions.length + 1).toString();
    const newSession: SessionState = {
      id: newSessionId,
      name: `Сессия ${newSessionId}`,
      currentInput: "",
      previousInput: "",
      operation: "",
      waitingForNewValue: false,
      products: [],
      focusedProductIndex: -1,
      selectedSeller:
        !isAdmin && !isSuperUser && currentUser?.id ? currentUser.id : null,
      selectedClient: null,
      clientSearchTerm: "",
      onCredit: false,
    };

    setSessions((prev) => [...prev, newSession]);
    setCurrentSessionIndex(sessions.length);
  };

  // Auto-update session name based on selected client or seller
  useEffect(() => {
    const currentSessionData = sessions[currentSessionIndex];
    if (!currentSessionData) return;

    let newName = `Сессия ${currentSessionData.id}`;

    if (selectedClient) {
      const client = clients.find((c) => c.id === selectedClient);
      if (client?.name) {
        newName = client.name;
      }
    } else if (selectedSeller) {
      const seller = users.find((u) => u.id === selectedSeller);
      if (seller?.name ) {
        newName = `${seller.name || ""}`.trim();
      }
    }

    if (newName !== currentSessionData.name) {
      setSessions((prev) =>
        prev.map((session, index) =>
          index === currentSessionIndex
            ? { ...session, name: newName }
            : session,
        ),
      );
    }
  }, [
    selectedClient,
    selectedSeller,
    currentSessionIndex,
    clients,
    users,
    sessions,
  ]);

  const switchToSession = (index: number) => {
    if (index >= 0 && index < sessions.length) {
      const targetSession = sessions[index];
      setCurrentSessionIndex(index);

      // Load session state
      setCurrentInput(targetSession.currentInput);
      setPreviousInput(targetSession.previousInput);
      setOperation(targetSession.operation);
      setWaitingForNewValue(targetSession.waitingForNewValue);
      setProducts(targetSession.products);
      setFocusedProductIndex(targetSession.focusedProductIndex);
      setSelectedSeller(targetSession.selectedSeller);
      setSelectedClient(targetSession.selectedClient);
      setClientSearchTerm(targetSession.clientSearchTerm);
      setOnCredit(targetSession.onCredit);
    }
  };

  const closeSession = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) return; // Don't close if it's the last session

    setSessions((prev) => prev.filter((_, i) => i !== index));

    // Adjust current session index if needed
    if (currentSessionIndex >= index) {
      const newIndex = Math.max(0, currentSessionIndex - 1);
      setCurrentSessionIndex(newIndex);

      // Load the new active session
      const newActiveSession = sessions[newIndex];
      if (newActiveSession) {
        setCurrentInput(newActiveSession.currentInput);
        setPreviousInput(newActiveSession.previousInput);
        setOperation(newActiveSession.operation);
        setWaitingForNewValue(newActiveSession.waitingForNewValue);
        setProducts(newActiveSession.products);
        setFocusedProductIndex(newActiveSession.focusedProductIndex);
        setSelectedSeller(newActiveSession.selectedSeller);
        setSelectedClient(newActiveSession.selectedClient);
        setClientSearchTerm(newActiveSession.clientSearchTerm);
        setOnCredit(newActiveSession.onCredit);
      }
    }
  };

  const handleProductSelect = (stock: Stock) => {
    // Always use multi-select behavior
    setSelectedStocks((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(stock.id!)) {
        newSelection.delete(stock.id!);
      } else {
        newSelection.add(stock.id!);
      }
      return newSelection;
    });

    // Also add to cart immediately for single selection
    if (!selectedStocks.has(stock.id!)) {
      if (stock.product_read?.product_name && stock.selling_price && stock.id) {
        const price = parseFloat(stock.selling_price);
        const newProduct: ProductInCart = {
          id: Date.now(), // Unique ID for the cart item
          stockId: stock.id,
          name: stock.product_read.product_name,
          price: price,
          quantity: 1,
          total: price,
          stock: stock,
        };

        // Check if product already exists in cart
        const existingProductIndex = products.findIndex(
          (p) => p.stockId === stock.id,
        );

        if (existingProductIndex >= 0) {
          // Update quantity of existing product
          const updatedProducts = [...products];
          updatedProducts[existingProductIndex].quantity += 1;
          updatedProducts[existingProductIndex].total =
            updatedProducts[existingProductIndex].quantity * price;
          setProducts(updatedProducts);
        } else {
          // Add new product to cart
          setProducts((prev) => [...prev, newProduct]);
        }
      }
    }
    console.log("Selected product:", stock);
  };

  const handleSaveSelectedStocks = () => {
    // Add all selected stocks to cart
    const selectedStockItems = stocks.filter((stock) =>
      selectedStocks.has(stock.id!),
    );

    selectedStockItems.forEach((stock) => {
      if (stock.product_read?.product_name && stock.selling_price && stock.id) {
        const price = parseFloat(stock.selling_price);
        const newProduct: ProductInCart = {
          id: Date.now() + Math.random(), // Unique ID for the cart item
          stockId: stock.id,
          name: stock.product_read.product_name,
          price: price,
          quantity: 1,
          total: price,
          stock: stock,
        };

        // Check if product already exists in cart
        const existingProductIndex = products.findIndex(
          (p) => p.stockId === stock.id,
        );

        if (existingProductIndex >= 0) {
          // Update quantity of existing product
          setProducts((prev) => {
            const updatedProducts = [...prev];
            updatedProducts[existingProductIndex].quantity += 1;
            updatedProducts[existingProductIndex].total =
              updatedProducts[existingProductIndex].quantity * price;
            return updatedProducts;
          });
        } else {
          // Add new product to cart
          setProducts((prev) => [...prev, newProduct]);
        }
      }
    });

    // Reset selection state
    setSelectedStocks(new Set());
    setIsSearchModalOpen(false);
  };

  const updateProductQuantity = (productId: number, newQuantity: number) => {
    // Prevent negative or zero quantities
    if (newQuantity <= 0) {
      return;
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, quantity: newQuantity, total: p.price * newQuantity }
          : p,
      ),
    );
  };

  const removeProduct = (productId: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCart = () => {
    setProducts([]);
    setFocusedProductIndex(-1);
  };

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (products.length === 0) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setFocusedProductIndex((prev) =>
            prev <= 0 ? products.length - 1 : prev - 1,
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedProductIndex((prev) =>
            prev >= products.length - 1 ? 0 : prev + 1,
          );
          break;
        case "+":
          e.preventDefault();
          if (focusedProductIndex >= 0) {
            const product = products[focusedProductIndex];
            updateProductQuantity(product.id, product.quantity + 1);
          }
          break;
        case "-":
          e.preventDefault();
          if (focusedProductIndex >= 0) {
            const product = products[focusedProductIndex];
            const newQuantity = product.quantity - 1;
            if (newQuantity > 0) {
              updateProductQuantity(product.id, newQuantity);
            }
          }
          break;
        case "Delete":
        case "Backspace":
          if (e.target === document.body && focusedProductIndex >= 0) {
            e.preventDefault();
            const product = products[focusedProductIndex];
            removeProduct(product.id);
            setFocusedProductIndex((prev) =>
              prev >= products.length - 1 ? products.length - 2 : prev,
            );
          }
          break;
      }
    },
    [products, focusedProductIndex, updateProductQuantity, removeProduct],
  );

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Auto-focus first product when products are added
  useEffect(() => {
    if (products.length > 0 && focusedProductIndex === -1) {
      setFocusedProductIndex(0);
    } else if (products.length === 0) {
      setFocusedProductIndex(-1);
    }
  }, [products.length, focusedProductIndex]);

  // Handle bottom button actions

  const handleBottomXClick = () => {
    if (focusedProductIndex >= 0) {
      const product = products[focusedProductIndex];
      removeProduct(product.id);
      setFocusedProductIndex((prev) =>
        prev >= products.length - 1 ? products.length - 2 : prev,
      );
    }
  };

  const handleBottomUpClick = () => {
    if (products.length === 0) return;
    setFocusedProductIndex((prev) =>
      prev <= 0 ? products.length - 1 : prev - 1,
    );
  };

  const handleBottomDownClick = () => {
    if (products.length === 0) return;
    setFocusedProductIndex((prev) =>
      prev >= products.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Session Tabs */}
        <div className="bg-white px-6 pt-4 border-b border-gray-200">
          <div
            className="flex space-x-2 mb-4 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className={`relative group rounded-t-lg flex-shrink-0 min-w-max ${
                  index === currentSessionIndex
                    ? "bg-blue-500"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <button
                  onClick={() => switchToSession(index)}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors w-full text-left whitespace-nowrap ${
                    index === currentSessionIndex
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  {session.name}
                  {session.products.length > 0 && (
                    <span className="ml-2 bg-white bg-opacity-30 text-xs px-1.5 py-0.5 rounded-full">
                      {session.products.length}
                    </span>
                  )}
                  {session.products.length > 0 && (
                    <div className="text-xs opacity-75 mt-0.5">
                      {session.products
                        .reduce((sum, product) => sum + product.total, 0)
                        .toLocaleString()}{" "}
                      сум
                    </div>
                  )}
                </button>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => closeSession(index, e)}
                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                      index === currentSessionIndex
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-500 text-white hover:bg-gray-600"
                    }`}
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-gray-500 rounded-sm transform rotate-45 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full transform -rotate-45"></div>
                </div>
                <span className="font-bold text-lg">123</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <span className="text-lg">11</span>
              </div>
              <div className="text-gray-600 text-lg">%</div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSearchClick}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                title="Поиск товаров"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={handleUserClick}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center relative ${
                  selectedSeller || selectedClient
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
                title="Выбор пользователя"
              >
                <UserIcon className="w-5 h-5" />
                {(selectedSeller || selectedClient) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                )}
              </button>

              <button
                onClick={createNewSession}
                className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
                title="Новая сессия"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                onClick={handleBottomDownClick}
                disabled={products.length === 0}
                className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Вниз по списку"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                onClick={handleBottomUpClick}
                disabled={products.length === 0}
                className="bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Вверх по списку"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <Menu className="w-6 h-6 text-gray-700" />
              <ExternalLink className="w-6 h-6 text-gray-700" />
              <LogOut className="w-6 h-6 text-gray-700" />
            </div>
          </div>

          {/* Product Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              {products.length > 0
                ? `${products.length} товар(ов) в корзине`
                : "Корзина пуста"}
            </h2>
            <div className="text-xl text-gray-700 font-medium">
              Общая сумма: {total.toLocaleString()} сум
            </div>

            {/* User Selection Display */}
            {(selectedSeller || selectedClient) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    <div className="text-sm">
                      {selectedSeller && (
                        <span className="text-blue-700 font-medium">
                          Продавец:{" "}
                          {users.find((u) => u.id === selectedSeller)?.name}
                        </span>
                      )}
                      {selectedSeller && selectedClient && (
                        <span className="text-gray-400 mx-2">•</span>
                      )}
                      {selectedClient && (
                        <span className="text-blue-700 font-medium">
                          Клиент:{" "}
                          {clients.find((c) => c.id === selectedClient)?.name}
                          {onCredit && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                              В кредит
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSeller(null);
                      setSelectedClient(null);
                      setOnCredit(false);
                      setClientSearchTerm("");
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Очистить выбор"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="flex space-x-4">
            <div className="flex-1 bg-gray-100 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="text-gray-600 text-sm">Карта</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-600 text-sm mb-1">Итого</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <div className="text-gray-600 text-sm">Скидка</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-600 text-sm mb-1">К оплате</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="flex-1 p-6">
          <div
            ref={tableRef}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          >
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    №
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Товар
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-700">
                    Цена
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-700">
                    Кол-во
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-700">
                    Сумма
                  </th>
                  <th className="text-center p-4 font-semibold text-gray-700 w-20">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <Search className="w-12 h-12 text-gray-300" />
                        <span>Добавьте товары в корзину</span>
                        <span className="text-sm">
                          Нажмите на синюю кнопку поиска чтобы найти товары
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`${
                        index === focusedProductIndex
                          ? "bg-blue-100 border-l-4 border-blue-500"
                          : index % 2 === 0
                            ? "bg-gray-50"
                            : "bg-white"
                      } transition-all duration-200 hover:bg-gray-100`}
                    >
                      <td className="p-4 text-gray-900">{index + 1}</td>
                      <td className="p-4 font-medium text-gray-900">
                        <div>
                          <div>{product.name}</div>
                          <div className="text-xs text-gray-500">
                            Остаток: {product.stock.quantity ?? 0}{" "}
                            {product.stock.measurement_read?.[0]
                              ?.measurement_read?.measurement_name || "шт"}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right text-gray-900">
                        {product.price.toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-gray-900">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              const newQuantity = product.quantity - 1;
                              if (newQuantity > 0) {
                                updateProductQuantity(product.id, newQuantity);
                              }
                            }}
                            disabled={product.quantity <= 1}
                            className={`w-6 h-6 rounded-full ${
                              index === focusedProductIndex
                                ? "bg-blue-200 hover:bg-blue-300 text-blue-800"
                                : "bg-gray-200 hover:bg-gray-300"
                            } ${product.quantity <= 1 ? "opacity-50 cursor-not-allowed" : ""} flex items-center justify-center text-sm font-bold transition-colors`}
                          >
                            −
                          </button>
                          <input
                            type="text"
                            value={product.quantity.toFixed(2)}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value);
                              if (newValue > 0) {
                                updateProductQuantity(product.id, newValue);
                              }
                            }}
                            onBlur={(e) => {
                              const newValue = parseFloat(e.target.value);
                              if (!newValue || newValue <= 0) {
                                // Reset to minimum quantity of 1 if invalid
                                updateProductQuantity(product.id, 1);
                              }
                            }}
                            className={`min-w-[50px] text-center bg-transparent border rounded px-1 py-1 text-sm ${
                              index === focusedProductIndex
                                ? "border-blue-500 bg-white focus:ring-2 focus:ring-blue-200"
                                : "border-transparent hover:border-gray-300"
                            } focus:outline-none transition-all`}
                            onFocus={() => setFocusedProductIndex(index)}
                          />
                          <button
                            onClick={() =>
                              updateProductQuantity(
                                product.id,
                                product.quantity + 1,
                              )
                            }
                            className={`w-6 h-6 rounded-full ${
                              index === focusedProductIndex
                                ? "bg-blue-200 hover:bg-blue-300 text-blue-800"
                                : "bg-gray-200 hover:bg-gray-300"
                            } flex items-center justify-center text-sm font-bold transition-colors`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold text-gray-900">
                        {product.total.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            removeProduct(product.id);
                            if (index === focusedProductIndex) {
                              setFocusedProductIndex((prev) =>
                                prev >= products.length - 1
                                  ? products.length - 2
                                  : prev,
                              );
                            }
                          }}
                          className={`w-8 h-8 rounded-full ${
                            index === focusedProductIndex
                              ? "bg-red-200 hover:bg-red-300 text-red-700 ring-2 ring-red-400"
                              : "bg-red-100 hover:bg-red-200 text-red-600"
                          } flex items-center justify-center transition-all`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Page indicator */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-3">
              <span className="text-gray-600">
                Товаров в корзине: {products.length}
              </span>
              <button
                onClick={clearCart}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-colors"
                disabled={products.length === 0}
              >
                Очистить корзину
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={handleBottomXClick}
              disabled={focusedProductIndex === -1}
              className="flex-1 bg-red-500 text-white py-4 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Удалить выбранный товар"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Calculator */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Calculator Display */}
        <div className="p-6 border-b border-gray-200">
          <div className="bg-gray-100 p-4 rounded-xl mb-4">
            {operation && previousInput && (
              <div className="text-right text-lg text-gray-600 font-mono">
                {previousInput} {operation}
              </div>
            )}
            <div className="text-right text-3xl font-mono text-gray-900">
              {currentInput || "0"}
            </div>
          </div>
        </div>

        {/* Calculator Keypad */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-4 gap-4 h-full">
            {/* Row 1 */}
            <button
              onClick={handleClearInput}
              className="bg-orange-100 hover:bg-orange-200 rounded-2xl transition-colors h-16 flex items-center justify-center col-span-2"
            >
              <span className="text-lg font-bold text-orange-600">CLEAR</span>
            </button>
            <button
              onClick={handleBackspace}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleOperation("/")}
              className="bg-blue-100 hover:bg-blue-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-blue-600"
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              onClick={() => handleNumberClick("7")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              7
            </button>
            <button
              onClick={() => handleNumberClick("8")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              8
            </button>
            <button
              onClick={() => handleNumberClick("9")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              9
            </button>
            <button
              onClick={() => handleOperation("*")}
              className="bg-blue-100 hover:bg-blue-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-blue-600"
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              onClick={() => handleNumberClick("4")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              4
            </button>
            <button
              onClick={() => handleNumberClick("5")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              5
            </button>
            <button
              onClick={() => handleNumberClick("6")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              6
            </button>
            <button
              onClick={() => handleOperation("-")}
              className="bg-blue-100 hover:bg-blue-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-blue-600"
            >
              −
            </button>

            {/* Row 4 */}
            <button
              onClick={() => handleNumberClick("1")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              1
            </button>
            <button
              onClick={() => handleNumberClick("2")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              2
            </button>
            <button
              onClick={() => handleNumberClick("3")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              3
            </button>
            <button
              onClick={() => handleOperation("+")}
              className="bg-blue-100 hover:bg-blue-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-blue-600"
            >
              +
            </button>

            {/* Row 5 */}
            <button
              onClick={() => handleNumberClick("0")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900 col-span-2"
            >
              0
            </button>
            <button
              onClick={() => handleNumberClick(",")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              ,
            </button>
            <button
              onClick={handleEquals}
              className="bg-green-100 hover:bg-green-200 rounded-2xl transition-colors h-16 flex items-center justify-center"
            >
              <span className="text-2xl font-bold text-green-600">=</span>
            </button>

            {/* Row 6 - PAY button */}
            <button
              onClick={() => {
                /* TODO: Implement payment logic */
              }}
              disabled={products.length === 0}
              className="bg-green-100 hover:bg-green-200 rounded-2xl transition-colors h-16 flex items-center justify-center disabled:bg-gray-200 disabled:cursor-not-allowed col-span-4"
            >
              <span className="text-lg font-bold text-green-600">
                PAY - {total.toLocaleString()} сум
              </span>
            </button>
          </div>
        </div>

        {/* Payment Button */}
        <div className="p-6 border-t border-gray-200">
          <button
            disabled={products.length === 0}
            className={`w-full py-5 rounded-2xl text-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${
              onCredit
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {products.length === 0
              ? "Добавьте товары"
              : onCredit
                ? `В долг ${total.toLocaleString()} сум`
                : `Оплатить ${total.toLocaleString()} сум`}
          </button>
        </div>
      </div>

      {/* Product Search Modal */}
      <WideDialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <WideDialogContent
          className="max-h-[90vh] overflow-hidden p-0"
          width="extra-wide"
        >
          <WideDialogHeader className="p-6 pb-4">
            <WideDialogTitle className="text-xl font-bold">
              Поиск товаров
            </WideDialogTitle>
          </WideDialogHeader>

          <div className="px-6 pb-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск по товарам..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* Selection info and controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedStocks.size > 0 && (
                  <span className="text-sm text-gray-600">
                    Выбрано: {selectedStocks.size} товар(ов)
                  </span>
                )}
              </div>

              {selectedStocks.size > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedStocks(new Set())}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    Очистить
                  </button>
                  <button
                    onClick={handleSaveSelectedStocks}
                    className="px-4 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Добавить в корзину ({selectedStocks.size})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="flex-1 overflow-hidden">
            <div className="border-t border-gray-200 bg-gray-50 max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="text-center p-4 font-semibold text-gray-700 w-16">
                      <input
                        type="checkbox"
                        checked={
                          filteredStocks.length > 0 &&
                          filteredStocks.every((stock) =>
                            selectedStocks.has(stock.id!),
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStocks(
                              new Set(filteredStocks.map((s) => s.id!)),
                            );
                          } else {
                            setSelectedStocks(new Set());
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700 w-16">
                      №
                    </th>
                    <th className="text-left p-4 font-semibold text-gray-700">
                      Наименование товара
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-700">
                      ИКПУ
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-700">
                      Штрихкод
                    </th>
                    <th className="text-right p-4 font-semibold text-gray-700">
                      Цена
                    </th>
                    <th className="text-center p-4 font-semibold text-gray-700 w-24">
                      •••
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStocks ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span>Загрузка товаров...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStocks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-500">
                        {searchTerm
                          ? "Товары не найдены"
                          : "Начните ввод для поиска товаров"}
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.map((stock, index) => (
                      <tr
                        key={stock.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } ${selectedStocks.has(stock.id!) ? "bg-blue-100" : ""} hover:bg-blue-50 transition-colors border-b border-gray-100`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStocks.has(stock.id!)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleProductSelect(stock);
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="p-4 text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td
                          className="p-4 cursor-pointer"
                          onClick={() => handleProductSelect(stock)}
                        >
                          <div>
                            <div className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors">
                              {stock.product_read?.product_name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Остаток: {stock.quantity ?? 0}{" "}
                              {stock.measurement_read?.[0]?.measurement_read
                                ?.measurement_name || "шт"}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center text-gray-600 font-mono text-sm">
                          {stock.product_read?.id
                            ?.toString()
                            .padStart(10, "0") || "N/A"}
                        </td>
                        <td className="p-4 text-center text-gray-600 font-mono text-sm">
                          {stock.id?.toString().padStart(10, "0") || "N/A"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-gray-900 font-semibold">
                            {parseFloat(
                              stock.selling_price || "0",
                            ).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductSelect(stock);
                            }}
                          >
                            •••
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </WideDialogContent>
      </WideDialog>

      {/* User Selection Modal */}
      <WideDialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <WideDialogContent className="max-h-[90vh] overflow-hidden p-0">
          <WideDialogHeader className="p-6 pb-4">
            <WideDialogTitle className="text-xl font-bold">
              Выбор пользователя для долга
            </WideDialogTitle>
          </WideDialogHeader>

          <div className="p-6 space-y-6">
            {/* Seller Selection - Only for admin/superuser */}
            {(isAdmin || isSuperUser) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Продавец
                </label>
                <Select
                  value={selectedSeller?.toString() || ""}
                  onValueChange={(value) =>
                    setSelectedSeller(parseInt(value, 10))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите продавца" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((user) => {
                        const extendedUser = user as ExtendedUser;
                        return (
                          (user.role === "Продавец" ||
                            user.role === "Администратор") &&
                          extendedUser.store_read
                        );
                      })
                      .map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id?.toString() || ""}
                        >
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Credit Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                В кредит
              </label>
              <Select
                value={onCredit ? "true" : "false"}
                onValueChange={(value) => {
                  const isCredit = value === "true";
                  setOnCredit(isCredit);
                  if (!isCredit) {
                    setSelectedClient(null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Да</SelectItem>
                  <SelectItem value="false">Нет</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Клиент
              </label>
              <Input
                type="text"
                placeholder="Поиск клиентов..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="mb-2"
                autoComplete="off"
              />
              <Select
                value={selectedClient?.toString() || ""}
                onValueChange={(value) =>
                  setSelectedClient(parseInt(value, 10))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите клиента" />
                </SelectTrigger>
                <SelectContent>
                  <div className="max-h-[200px] overflow-y-auto">
                    {clients && clients.length > 0 ? (
                      clients
                        .filter(
                          (client) =>
                            (onCredit ? true : client.type === "Юр.лицо") &&
                            client.name
                              .toLowerCase()
                              .includes(clientSearchTerm.toLowerCase()),
                        )
                        .map((client) => (
                          <SelectItem
                            key={client.id}
                            value={client.id?.toString() || ""}
                          >
                            {client.name}{" "}
                            {client.type !== "Юр.лицо" && `(${client.type})`}
                          </SelectItem>
                        ))
                    ) : (
                      <div className="p-2 text-center text-gray-500 text-sm">
                        Клиенты не найдены
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Current Selection Display */}
            {(selectedSeller || selectedClient) && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  Текущий выбор:
                </h4>
                {selectedSeller && (
                  <p className="text-sm text-blue-700">
                    <strong>Продавец:</strong>{" "}
                    {users.find((u) => u.id === selectedSeller)?.name}
                  </p>
                )}
                {selectedClient && (
                  <p className="text-sm text-blue-700">
                    <strong>Клиент:</strong>{" "}
                    {clients.find((c) => c.id === selectedClient)?.name}
                    {onCredit && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        В кредит
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={() => {
                  // Reset selections
                  setSelectedSeller(null);
                  setSelectedClient(null);
                  setOnCredit(false);
                  setClientSearchTerm("");
                }}
                variant="outline"
                className="flex-1"
              >
                Очистить
              </Button>
              <Button
                onClick={() => setIsUserModalOpen(false)}
                className="flex-1"
              >
                Готово
              </Button>
            </div>
          </div>
        </WideDialogContent>
      </WideDialog>
    </div>
  );
};

export default POSInterface;

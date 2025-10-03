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
import {
  fetchAllProducts,
  fetchProductByBarcode,
} from "@/core/api/fetchAllProducts";
import type { Product } from "@/core/api/product";
import { useCurrentUser } from "@/core/hooks/useCurrentUser";
import { useGetUsers } from "@/core/api/user";
import { useGetClients } from "@/core/api/client";
import type { User } from "@/core/api/user";

interface ProductInCart {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  product: Product;
  barcode?: string;
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
  const [cartProducts, setCartProducts] = useState<ProductInCart[]>(
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
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [barcodeScanInput, setBarcodeScanInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // Toggle with Ctrl+D
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");

  // Product selection state
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set(),
  );

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
              products: cartProducts,
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
    cartProducts,
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
  const total = cartProducts.reduce((sum, product) => sum + product.total, 0);

  // Fetch products when modal opens or search term changes
  useEffect(() => {
    if (isSearchModalOpen) {
      const timeoutId = setTimeout(() => {
        setLoadingProducts(true);
        fetchAllProducts({
          product_name: searchTerm.length > 0 ? searchTerm : undefined,
        })
          .then((data) => setFetchedProducts(data))
          .catch((error) => console.error("Error fetching products:", error))
          .finally(() => setLoadingProducts(false));
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [isSearchModalOpen, searchTerm]);

  // Handle adding product directly to cart
  const handleProductDirectAdd = useCallback(
    (product: Product) => {
      if (product.product_name && product.id) {
        // For now, use a default price - you might want to fetch this from elsewhere
        const price = 10000; // Default price, replace with actual price logic
        const newProduct: ProductInCart = {
          id: Date.now(), // Unique ID for the cart item
          productId: product.id,
          name: product.product_name,
          price: price,
          quantity: 1,
          total: price,
          product: product,
          barcode: product.barcode,
        };

        // Check if product already exists in cart
        const existingProductIndex = cartProducts.findIndex(
          (p) => p.productId === product.id,
        );

        if (existingProductIndex >= 0) {
          // Update quantity of existing product
          const updatedProducts = [...cartProducts];
          updatedProducts[existingProductIndex].quantity += 1;
          updatedProducts[existingProductIndex].total =
            updatedProducts[existingProductIndex].quantity * price;
          setCartProducts(updatedProducts);
        } else {
          // Add new product to cart
          setCartProducts((prev) => [...prev, newProduct]);
        }
      }
    },
    [cartProducts],
  );

  // Handle barcode scanning with Enter key support
  const processBarcodeInput = useCallback(
    async (barcode: string) => {
      if (isProcessingBarcode) return;

      // Clean the barcode (remove any whitespace)
      const cleanBarcode = barcode.trim();

      if (cleanBarcode.length >= 6) {
        setIsProcessingBarcode(true);
        setLoadingProducts(true);

        try {
          const product = await fetchProductByBarcode(cleanBarcode);
          if (product) {
            handleProductDirectAdd(product);
            if (debugMode) {
              console.log("✅ Product found and added:", product);
            }
          } else {
            // eslint-disable-next-line no-constant-condition
            if (debugMode || true) {
              // Always log when product not found
              console.warn("❌ Product not found for barcode:", cleanBarcode);
            }
            alert(`Product not found for barcode: ${cleanBarcode}`);
          }
        } catch (error) {
          console.error("Error fetching product by barcode:", error);
        } finally {
          setLoadingProducts(false);
          setIsProcessingBarcode(false);
          setBarcodeScanInput("");
          // Refocus the input
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
          }
        }
      }
    },
    [isProcessingBarcode, handleProductDirectAdd],
  );

  // Handle barcode input changes and Enter key
  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeScanInput(value);
    if (debugMode) {
      console.log("📝 Barcode input changed:", {
        newValue: value,
        length: value.length,
        lastChar: value[value.length - 1],
        charCode: value.charCodeAt(value.length - 1),
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (debugMode) {
      console.log("⌨️ Key pressed in barcode input:", {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        charCode: e.charCode,
        currentValue: barcodeScanInput,
        valueLength: barcodeScanInput.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (
      e.key === "Enter" ||
      e.key === "\n" ||
      e.key === "\r" ||
      e.keyCode === 13
    ) {
      e.preventDefault();
      console.log(
        "✅ ENTER KEY DETECTED! Processing barcode:",
        barcodeScanInput,
        "Length:",
        barcodeScanInput.length,
      );
      setLastScannedBarcode(barcodeScanInput);
      processBarcodeInput(barcodeScanInput);
    }
  };

  // Debug mode toggle with Ctrl+D and global keyboard logging
  useEffect(() => {
    const handleDebugToggle = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        setDebugMode((prev) => {
          const newMode = !prev;
          console.log(`Debug mode ${newMode ? "ENABLED" : "DISABLED"}`);
          return newMode;
        });
      }
    };

    // Global keyboard event logger for debugging scanner
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if (debugMode) {
        console.log("🎹 GLOBAL KEY EVENT:", {
          key: e.key,
          code: e.code,
          keyCode: e.keyCode,
          charCode: e.charCode,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
          target: e.target,
          targetTagName: (e.target as HTMLElement)?.tagName,
          targetId: (e.target as HTMLElement)?.id,
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener("keydown", handleDebugToggle);
    document.addEventListener("keydown", handleGlobalKeydown);

    return () => {
      document.removeEventListener("keydown", handleDebugToggle);
      document.removeEventListener("keydown", handleGlobalKeydown);
    };
  }, [debugMode]);

  // Keep barcode input always focused
  useEffect(() => {
    const focusInput = () => {
      if (
        barcodeInputRef.current &&
        document.activeElement !== barcodeInputRef.current
      ) {
        if (debugMode) {
          console.log("Refocusing barcode input");
        }
        barcodeInputRef.current.focus();
      }
    };

    // Initial focus
    focusInput();

    // Refocus when clicking anywhere on the document
    const handleClick = () => {
      setTimeout(focusInput, 100);
    };

    // Refocus on window focus
    const handleWindowFocus = () => {
      focusInput();
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [currentSessionIndex]);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    return fetchedProducts.filter(
      (product) =>
        product.product_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.barcode?.includes(searchTerm) ||
        String(product.id).includes(searchTerm),
    );
  }, [fetchedProducts, searchTerm]);

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
    const newIndex = sessions.length;
    setCurrentSessionIndex(newIndex);
    
    // Clear all state for the new session
    setCurrentInput("");
    setPreviousInput("");
    setOperation("");
    setWaitingForNewValue(false);
    setCartProducts([]);
    setFocusedProductIndex(-1);
    setSelectedSeller(!isAdmin && !isSuperUser && currentUser?.id ? currentUser.id : null);
    setSelectedClient(null);
    setClientSearchTerm("");
    setOnCredit(false);
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
      if (seller?.name) {
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
      // First save current session state
      const updatedSessions = [...sessions];
      updatedSessions[currentSessionIndex] = {
        ...updatedSessions[currentSessionIndex],
        currentInput,
        previousInput,
        operation,
        waitingForNewValue,
        products: cartProducts,
        focusedProductIndex,
        selectedSeller,
        selectedClient,
        clientSearchTerm,
        onCredit,
      };
      setSessions(updatedSessions);

      // Then switch to new session
      const targetSession = updatedSessions[index];
      setCurrentSessionIndex(index);

      // Load target session state
      setCurrentInput(targetSession.currentInput);
      setPreviousInput(targetSession.previousInput);
      setOperation(targetSession.operation);
      setWaitingForNewValue(targetSession.waitingForNewValue);
      setCartProducts(targetSession.products);
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
        setCartProducts(newActiveSession.products);
        setFocusedProductIndex(newActiveSession.focusedProductIndex);
        setSelectedSeller(newActiveSession.selectedSeller);
        setSelectedClient(newActiveSession.selectedClient);
        setClientSearchTerm(newActiveSession.clientSearchTerm);
        setOnCredit(newActiveSession.onCredit);
      }
    }
  };

  const handleProductSelect = (product: Product) => {
    // Always use multi-select behavior
    setSelectedProducts((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(product.id!)) {
        newSelection.delete(product.id!);
      } else {
        newSelection.add(product.id!);
      }
      return newSelection;
    });

    // Also add to cart immediately for single selection
    if (!selectedProducts.has(product.id!)) {
      handleProductDirectAdd(product);
    }
    console.log("Selected product:", product);
  };

  const handleSaveSelectedProducts = () => {
    // Add all selected products to cart
    const selectedProductItems = fetchedProducts.filter((product) =>
      selectedProducts.has(product.id!),
    );

    selectedProductItems.forEach((product) => {
      handleProductDirectAdd(product);
    });

    // Reset selection state
    setSelectedProducts(new Set());
    setIsSearchModalOpen(false);
  };

  const updateProductQuantity = useCallback(
    (productId: number, newQuantity: number) => {
      // Prevent negative or zero quantities
      if (newQuantity <= 0) {
        return;
      }

      setCartProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, quantity: newQuantity, total: p.price * newQuantity }
            : p,
        ),
      );
    },
    [],
  );

  const removeProduct = useCallback((productId: number) => {
    setCartProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const clearCart = () => {
    setCartProducts([]);
    setFocusedProductIndex(-1);
  };

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (cartProducts.length === 0) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setFocusedProductIndex((prev) =>
            prev <= 0 ? cartProducts.length - 1 : prev - 1,
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedProductIndex((prev) =>
            prev >= cartProducts.length - 1 ? 0 : prev + 1,
          );
          break;
        case "+":
          e.preventDefault();
          if (focusedProductIndex >= 0) {
            const product = cartProducts[focusedProductIndex];
            updateProductQuantity(product.id, product.quantity + 1);
          }
          break;
        case "-":
          e.preventDefault();
          if (focusedProductIndex >= 0) {
            const product = cartProducts[focusedProductIndex];
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
            const product = cartProducts[focusedProductIndex];
            removeProduct(product.id);
            setFocusedProductIndex((prev) =>
              prev >= cartProducts.length - 1 ? cartProducts.length - 2 : prev,
            );
          }
          break;
      }
    },
    [cartProducts, focusedProductIndex, updateProductQuantity, removeProduct],
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
    if (cartProducts.length > 0 && focusedProductIndex === -1) {
      setFocusedProductIndex(0);
    } else if (cartProducts.length === 0) {
      setFocusedProductIndex(-1);
    }
  }, [cartProducts.length, focusedProductIndex]);

  // Handle bottom button actions

  const handleBottomXClick = () => {
    if (focusedProductIndex >= 0) {
      const product = cartProducts[focusedProductIndex];
      removeProduct(product.id);
      setFocusedProductIndex((prev) =>
        prev >= cartProducts.length - 1 ? cartProducts.length - 2 : prev,
      );
    }
  };

  const handleBottomUpClick = () => {
    if (cartProducts.length === 0) return;
    setFocusedProductIndex((prev) =>
      prev <= 0 ? cartProducts.length - 1 : prev - 1,
    );
  };

  const handleBottomDownClick = () => {
    if (cartProducts.length === 0) return;
    setFocusedProductIndex((prev) =>
      prev >= cartProducts.length - 1 ? 0 : prev + 1,
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
                disabled={cartProducts.length === 0}
                className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Вниз по списку"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                onClick={handleBottomUpClick}
                disabled={cartProducts.length === 0}
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
              {cartProducts.length > 0
                ? `${cartProducts.length} товар(ов) в корзине`
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

          {/* Debug Mode Display */}
          {debugMode && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
              <div className="text-sm font-bold text-yellow-800 mb-2">
                🔧 DEBUG MODE ACTIVE (Ctrl+D to toggle)
              </div>
              <div className="space-y-1 text-xs text-yellow-700 font-mono">
                <div>
                  Barcode Input Focus:{" "}
                  {document.activeElement === barcodeInputRef.current
                    ? "✅ YES"
                    : "❌ NO"}
                </div>
                <div>Current Input: "{barcodeScanInput}"</div>
                <div>Last Scanned: "{lastScannedBarcode}"</div>
                <div>Processing: {isProcessingBarcode ? "YES" : "NO"}</div>
                <div className="text-yellow-600 mt-2">
                  Open console (F12) to see detailed logs
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Try: 1) Type any number 2) Press Enter 3) Check console
                </div>
              </div>
            </div>
          )}

          {/* Barcode Display */}
          {(barcodeScanInput || isProcessingBarcode) && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600 font-medium">
                  {isProcessingBarcode ? "Обработка:" : "Сканирование:"}
                </span>
                <span className="text-sm text-blue-900 font-mono">
                  {barcodeScanInput || "..."}
                </span>
              </div>
            </div>
          )}

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
          {/* Barcode Scanner Input - Positioned off-screen but still focusable */}
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcodeScanInput}
            onChange={handleBarcodeInputChange}
            onKeyPress={handleBarcodeKeyPress}
            onKeyDown={(e) => {
              if (debugMode) {
                console.log("🔽 KeyDown in barcode input:", {
                  key: e.key,
                  code: e.code,
                  keyCode: e.keyCode,
                  isEnter: e.key === "Enter" || e.keyCode === 13,
                  currentValue: barcodeScanInput,
                });
              }
              // Also handle Enter in keydown as some scanners might not trigger keypress
              if (e.key === "Enter" || e.keyCode === 13) {
                e.preventDefault();
                console.log(
                  "✅ ENTER in KeyDown! Processing:",
                  barcodeScanInput,
                );
                setLastScannedBarcode(barcodeScanInput);
                processBarcodeInput(barcodeScanInput);
              }
            }}
            onKeyUp={(e) => {
              if (debugMode) {
                console.log("🔼 KeyUp in barcode input:", {
                  key: e.key,
                  code: e.code,
                  keyCode: e.keyCode,
                });
              }
            }}
            onInput={(e) => {
              if (debugMode) {
                console.log("📥 Input event:", {
                  value: (e.target as HTMLInputElement).value,
                  inputType: (e as any).inputType,
                  data: (e as any).data,
                });
              }
            }}
            onBlur={(_e) => {
              // Prevent losing focus
              setTimeout(() => {
                if (barcodeInputRef.current) {
                  if (debugMode) {
                    console.log("Input lost focus, refocusing...");
                  }
                  barcodeInputRef.current.focus();
                }
              }, 10);
            }}
            onFocus={() => {
              if (debugMode) {
                console.log("Barcode input gained focus");
              }
            }}
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
            }}
            autoFocus
            autoComplete="off"
            placeholder="Barcode scanner input"
          />

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
                {cartProducts.length === 0 ? (
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
                  cartProducts.map((product, index) => (
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
                          {product.barcode && (
                            <div className="text-xs text-gray-500">
                              Штрихкод: {product.barcode}
                            </div>
                          )}
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
                                prev >= cartProducts.length - 1
                                  ? cartProducts.length - 2
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
                Товаров в корзине: {cartProducts.length}
              </span>
              <button
                onClick={clearCart}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-colors"
                disabled={cartProducts.length === 0}
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
              disabled={cartProducts.length === 0}
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
            disabled={cartProducts.length === 0}
            className={`w-full py-5 rounded-2xl text-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${
              onCredit
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {cartProducts.length === 0
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
                {selectedProducts.size > 0 && (
                  <>
                    <span className="text-sm text-gray-600">
                      Выбрано: {selectedProducts.size} товар(ов)
                    </span>
                    <button
                      onClick={handleSaveSelectedProducts}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Добавить выбранные
                    </button>
                  </>
                )}
              </div>

              {selectedProducts.size > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedProducts(new Set())}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    Очистить
                  </button>
                  <button
                    onClick={handleSaveSelectedProducts}
                    className="px-4 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Добавить в корзину ({selectedProducts.size})
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
                          filteredProducts.length > 0 &&
                          filteredProducts.every((product) =>
                            selectedProducts.has(product.id!),
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(
                              new Set(filteredProducts.map((p) => p.id!)),
                            );
                          } else {
                            setSelectedProducts(new Set());
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
                  {loadingProducts ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span>Загрузка товаров...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-500">
                        {searchTerm
                          ? "Товары не найдены"
                          : "Начните ввод для поиска товаров"}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } ${selectedProducts.has(product.id!) ? "bg-blue-100" : ""} hover:bg-blue-50 transition-colors border-b border-gray-100`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id!)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleProductSelect(product);
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="p-4 text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td
                          className="p-4 cursor-pointer"
                          onClick={() => handleProductSelect(product)}
                        >
                          <div>
                            <div className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors">
                              {product.product_name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {product.has_barcode && product.barcode && (
                                <span>Штрихкод: {product.barcode}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center text-gray-600 font-mono text-sm">
                          {product.id?.toString().padStart(10, "0") || "N/A"}
                        </td>
                        <td className="p-4 text-center text-gray-600 font-mono text-sm">
                          {product.barcode || "—"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-gray-900 font-semibold">
                            {"10,000"}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductSelect(product);
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

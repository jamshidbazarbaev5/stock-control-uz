import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Menu,
  ExternalLink,
  LogOut,
  Minus,
  Plus,
  X,
  Calculator,
  BarChart3,
  Edit,
} from "lucide-react";

const POSInterface = () => {
  const [selectedProduct, _setSelectedProduct] = useState("Молоко");
  const [quantity, _setQuantity] = useState("1,00");
  const [price, _setPrice] = useState("11,000");
  const [currentInput, setCurrentInput] = useState("");

  const products = [
    { id: 1, name: "Круассан", price: 8000, quantity: 1.0, total: 8000 },
    { id: 2, name: "Рулет с маком", price: 6000, quantity: 1.0, total: 6000 },
    { id: 3, name: "Молоко", price: 11000, quantity: 1.0, total: 11000 },
  ];

  const total = 25000;

  const handleNumberClick = (num: string) => {
    setCurrentInput((prev) => prev + num);
  };



  const handleBackspace = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col bg-white">
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
            <div className="flex items-center space-x-4">
              <Menu className="w-6 h-6 text-gray-700" />
              <ExternalLink className="w-6 h-6 text-gray-700" />
              <LogOut className="w-6 h-6 text-gray-700" />
            </div>
          </div>

          {/* Product Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              {selectedProduct}
            </h2>
            <div className="text-xl text-gray-700 font-medium">
              {quantity} x {price} ={" "}
              {(
                parseFloat(quantity.replace(",", ".")) *
                parseFloat(price.replace(",", ""))
              ).toLocaleString()}
            </div>
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
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
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr
                    key={product.id}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="p-4 text-gray-900">{product.id}</td>
                    <td className="p-4 font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="p-4 text-right text-gray-900">
                      {product.price.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-gray-900">
                      {product.quantity.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-semibold text-gray-900">
                      {product.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Page indicator */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-3">
              <span className="text-gray-600">Страница № 1</span>
              <button className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Plus className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="flex space-x-3">
            <button className="flex-1 bg-red-500 text-white py-4 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center">
              <X className="w-6 h-6" />
            </button>
            <button className="flex-1 bg-blue-500 text-white py-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center">
              <Edit className="w-6 h-6" />
            </button>
            <button className="flex-1 bg-green-500 text-white py-4 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center">
              <Calculator className="w-6 h-6" />
            </button>
            <button className="flex-1 bg-gray-500 text-white py-4 rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center">
              <Minus className="w-6 h-6" />
            </button>
            <button className="flex-1 bg-purple-500 text-white py-4 rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </button>
            <button className="flex-1 bg-indigo-500 text-white py-4 rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center">
              <ChevronDown className="w-6 h-6" />
            </button>
            <button className="flex-1 bg-teal-500 text-white py-4 rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center">
              <ChevronUp className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Calculator */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Calculator Display */}
        <div className="p-6 border-b border-gray-200">
          <div className="bg-gray-100 p-4 rounded-xl mb-4">
            <div className="text-right text-3xl font-mono text-gray-900">
              {currentInput || "0"}
            </div>
          </div>
        </div>

        {/* Calculator Keypad */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* Row 1 */}
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

            {/* Row 2 */}
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

            {/* Row 3 */}
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

            {/* Row 4 */}
            <button
              onClick={() => handleNumberClick(",")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              ,
            </button>
            <button
              onClick={() => handleNumberClick("0")}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="bg-gray-100 hover:bg-gray-200 rounded-2xl text-2xl font-semibold transition-colors h-16 flex items-center justify-center text-gray-900"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Row 5 - Function buttons */}
            <button className="bg-blue-100 hover:bg-blue-200 rounded-2xl transition-colors h-16 flex items-center justify-center">
              <Calculator className="w-7 h-7 text-blue-600" />
            </button>
            <button className="bg-blue-100 hover:bg-blue-200 rounded-2xl transition-colors h-16 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-blue-600" />
            </button>
            <button className="bg-blue-100 hover:bg-blue-200 rounded-2xl transition-colors h-16 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">¥</span>
            </button>
          </div>
        </div>

        {/* Payment Button */}
        <div className="p-6 border-t border-gray-200">
          <button className="w-full bg-blue-600 text-white py-5 rounded-2xl text-lg font-semibold hover:bg-blue-700 transition-colors">
            Выбор оплаты
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSInterface;

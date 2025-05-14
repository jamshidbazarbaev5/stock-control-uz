import { 
  ShoppingBag,
  User2,
  List as ListView,
  Ruler,
  Package
} from 'lucide-react';
import { useLocation } from 'react-router-dom';



export default function Layout({ children }: any) {
  const location = useLocation();
  
  const navItems = [
    { icon: User2, label: 'Пользователи', href: '/users' },
    { icon: ShoppingBag, label: 'Магазины', href: '/stores' },
    { icon: ListView, label: 'Категории', href: '/categories' },
    { icon: Ruler, label: 'Единицы измерения', href: '/measurements' },
    { icon: ShoppingBag, label: 'Товары', href: '/products' },
    { icon: Package, label: 'Склад', href: '/stock' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Боковая панель */}
      <aside className="w-full md:w-64 bg-white shadow-lg">
        {/* Логотип */}
        <div className="px-4 md:px-6 py-4 md:py-6 border-b">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-500">C</span>
            </div>
            <div className="font-semibold text-gray-800">
              Coco  
            </div>
          </div>
        </div>

        {/* Навигация */}
        <nav className="px-2 md:px-3 py-2 md:py-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
          {navItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg text-left mb-1 transition-colors whitespace-nowrap
                ${location.pathname === item.href
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <item.icon size={20} className={location.pathname === item.href ? 'text-emerald-500' : 'text-gray-500'} />
              <span className="font-medium">{item.label}</span>
              {location.pathname === item.href && (
                <span className="ml-auto">
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    className="text-emerald-500"
                  >
                    <path 
                      d="M9 18l6-6-6-6" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </a>
          ))}
        </nav>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 p-4 md:p-8 w-full overflow-x-auto">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

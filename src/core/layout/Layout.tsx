import { 
  Tags,
  Box,
  ShoppingBag,
  BarChart3,
  User,
  Mail,
  File,
  User2,
} from 'lucide-react';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  const navItems = [
    { icon: User2, label: 'Люди', href: '/users' },
    { icon: ShoppingBag, label: 'Магазины', href: '/stores' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Боковая панель */}
      <aside className="w-64 bg-white shadow-lg">
        {/* Логотип */}
        <div className="px-6 py-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-500">C</span>
            </div>
            <div className="font-semibold text-gray-800">
              Coco  
            </div>
          </div>
        </div>

        {/* Навигация */}
        <nav className="px-3 py-4">
          {navItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left mb-1 transition-colors
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
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}

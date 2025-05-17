import { 
  ShoppingBag,
  User2,
  List as ListView,
  Ruler,
  Package,
  ArrowLeftRight,
  Menu,
  X
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Layout({ children }: any) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  
  const navItems = [
    { icon: User2, label: t('navigation.users'), href: '/users' },
    { icon: ShoppingBag, label: t('navigation.stores'), href: '/stores' },
    { icon: ListView, label: t('navigation.categories'), href: '/categories' },
    { icon: Ruler, label: t('navigation.measurements'), href: '/measurements' },
    { icon: ShoppingBag, label: t('navigation.products'), href: '/products' },
    { icon: Package, label: t('navigation.stocks'), href: '/stock' },
    { icon: ListView, label: t('navigation.suppliers'), href: '/suppliers' },
    { icon: ArrowLeftRight, label: t('navigation.transfers'), href: '/transfers' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-500">C</span>
          </div>
          <div className="font-semibold text-gray-800">
            Coco
          </div>
        </div>
        <div className="flex items-center gap-4">
        
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-gray-600" />
            ) : (
              <Menu size={24} className="text-gray-600" />
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar - Desktop and Mobile */}
        <aside className={`
          ${mobileMenuOpen ? 'block' : 'hidden'}
          md:block
          w-full md:w-64 bg-white shadow-lg
          fixed md:relative
          top-[3.5rem] md:top-0
          h-[calc(100vh-3.5rem)] md:h-screen
          z-50
        `}>
          {/* Desktop Logo and Language Switcher */}
          <div className="hidden md:block px-6 py-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-500">C</span>
                </div>
                <div className="font-semibold text-gray-800">
                  Coco
                </div>
              </div>
              
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-4 flex flex-col overflow-y-auto bg-white relative z-50">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left mb-1 transition-colors
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

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 w-full overflow-x-auto md:ml-0">
          <div className='flex items-center justify-end'>
            <LanguageSwitcher />

          </div>
          <div className="container mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div 
            // className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

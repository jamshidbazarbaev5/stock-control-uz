import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  EyeIcon,
  TrashIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from 'lucide-react';
import { t } from 'i18next';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';

interface Column<T> {
  header: string;
  accessorKey: keyof T | string | ((row: T) => React.ReactNode);
  cell?: (row: T) => React.ReactNode;
}

interface ResourceTableProps<T extends { id?: number }> {
  data: T[];
  columns: Column<T>[];
  isLoading: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
  onAdd?: () => void;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  expandedRowRenderer?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function ResourceTable<T extends { id?: number }>({
  data,
  columns,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
  pageSize = 30,
  totalCount = 0,
  onPageChange,
  currentPage = 1,
  expandedRowRenderer,
  onRowClick,
}: ResourceTableProps<T>) {
  // Handle case when data is undefined
  const tableData = data || [];
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // State for delete confirmation modal and expanded row
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | undefined>(undefined);
  const [expandedRow, setExpandedRow] = useState<number>(-1);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    let startPage = Math.max(currentPage - 1, 2);
    let endPage = Math.min(currentPage + 1, totalPages - 1);

    if (currentPage <= 3) {
      endPage = 4;
    }

    if (currentPage >= totalPages - 2) {
      startPage = totalPages - 3;
    }

    if (startPage > 2) {
      pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const getRowNumber = (index: number) => {
    return ((currentPage - 1) * pageSize) + index + 1;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold"></h2>
        {onAdd && (
          <Button onClick={onAdd} className="flex items-center gap-1">
            <PlusIcon className="h-4 w-4" /> {t('common.create')}
          </Button>
        )}
      </div>
      
      <div className="rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50/50">
              <TableHead className="text-xs uppercase text-gray-500 font-medium w-[60px]">
                №
              </TableHead>
              {columns.map((column, index) => (
                <TableHead key={index} className="text-xs uppercase text-gray-500 font-medium">
                  {column.header}
                </TableHead>
              ))}
              {(onEdit || onDelete) && (
                <TableHead className="text-xs uppercase text-gray-500 font-medium text-right">
                  Действия
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="border-b border-gray-100 last:border-0">
                  <TableCell className="w-[60px]">
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell className="w-[100px]">
                      <div className="flex gap-1 justify-end">
                        <Skeleton className="h-8 w-8" />
                        {onDelete && <Skeleton className="h-8 w-8" />}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : tableData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1 + (onEdit || onDelete ? 1 : 0)} className="text-center text-gray-500">
                  Данные отсутствуют
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <TableRow 
                    className={`border-b border-gray-100 ${(expandedRowRenderer || onRowClick) ? 'cursor-pointer hover:bg-gray-50/50 transition-colors' : ''}`}
                    onClick={(e) => {
                      if (expandedRowRenderer) {
                        e.stopPropagation();
                        setExpandedRow(expandedRow === rowIndex ? -1 : rowIndex);
                      }
                      if (onRowClick) {
                        onRowClick(row);
                      }
                    }}
                  >
                    <TableCell className="w-[60px] font-medium text-gray-500 flex items-center gap-2">
                      {getRowNumber(rowIndex)}
                      {(row as any)?.store_read?.color && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: (row as any).store_read.color,
                            border: '1px solid #e5e7eb', // Tailwind gray-200
                          }}
                          title={(row as any)?.store_read?.name}
                        />
                      )}
                    </TableCell>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {column.cell 
                          ? column.cell(row)
                          : typeof column.accessorKey === 'function'
                            ? column.accessorKey(row)
                            : String(
                                typeof column.accessorKey === 'string' 
                                  ? (row as any)[column.accessorKey] || ''
                                  : row[column.accessorKey as keyof T] || ''
                              )}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete) && (
                      <TableCell className="text-right w-[100px]" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          {onEdit && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onEdit(row)}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              <EyeIcon className="h-4 w-4 text-gray-500" />
                            </Button>
                          )}
                          {onDelete && row.id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setItemToDelete(row.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-red-50 text-red-500"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {expandedRowRenderer && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRow(expandedRow === rowIndex ? -1 : rowIndex);
                              }}
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                            >
                              {expandedRow === rowIndex ? (
                                <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  {expandedRowRenderer && expandedRow === rowIndex && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 1 + (onEdit || onDelete ? 1 : 0)}
                        className="bg-gray-50/50 border-b border-gray-100"
                      >
                        {expandedRowRenderer(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages >= 1 && (
        <div className="flex justify-end gap-2 items-center text-sm text-gray-600">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onPageChange?.(currentPage - 1)} 
            disabled={currentPage === 1}
            className="hover:bg-gray-100"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          <div className="flex gap-1">
            {getPageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <Button
                  key={index}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange?.(page)}
                  className={`h-8 w-8 p-0 ${
                    currentPage === page 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {page}
                </Button>
              ) : (
                <span key={index} className="px-2">
                  {page}
                </span>
              )
            ))}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onPageChange?.(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="hover:bg-gray-100"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (itemToDelete && onDelete) {
            onDelete(itemToDelete);
          }
          setIsDeleteModalOpen(false);
        }}
      />
    </div>
  );
}
import React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';

// =========================================================
// SEARCH INPUT
// =========================================================

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 bg-white border-2 border-ink-black text-xs font-sans text-ink-black placeholder-neutral-400 outline-none focus:border-[#E63946] shadow-[2px_2px_0px_#141414] transition-shadow"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 text-neutral-400 hover:text-ink-black transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// =========================================================
// FILTER DROPDOWN
// =========================================================

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  label?: string;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  value,
  onChange,
  options,
  label = 'Filter',
  className = '',
}) => {
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 bg-white border-2 border-ink-black text-xs font-mono font-bold uppercase text-ink-black outline-none cursor-pointer shadow-[2px_2px_0px_#141414] focus:border-[#E63946] transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-500 pointer-events-none" />
    </div>
  );
};

// =========================================================
// DATA TABLE
// =========================================================

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  onRowClick,
  loading,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="border-2 border-ink-black shadow-[4px_4px_0px_#141414] bg-white">
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-ink-black border-t-transparent animate-spin mx-auto" />
          <p className="font-mono text-xs text-neutral-500 mt-3 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-ink-black shadow-[4px_4px_0px_#141414] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-ink-black">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-[9px] font-mono font-extrabold text-white uppercase tracking-widest border-r border-neutral-700 last:border-r-0 ${col.width ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center font-mono text-xs text-neutral-400 uppercase tracking-widest"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={String(row[keyField])}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-neutral-100 last:border-b-0 transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-neutral-50' : ''
                  } ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/40'}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 border-r border-neutral-100 last:border-r-0"
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =========================================================
// PAGINATION
// =========================================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1.5 border-2 border-ink-black text-xs font-mono font-bold shadow-[2px_2px_0px_#141414] disabled:opacity-40 hover:bg-ink-black hover:text-white transition-colors cursor-pointer"
      >
        ← Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-8 h-8 border-2 border-ink-black text-xs font-mono font-bold transition-colors cursor-pointer ${
            page === currentPage
              ? 'bg-ink-black text-white shadow-[2px_2px_0px_#141414]'
              : 'bg-white hover:bg-neutral-50'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1.5 border-2 border-ink-black text-xs font-mono font-bold shadow-[2px_2px_0px_#141414] disabled:opacity-40 hover:bg-ink-black hover:text-white transition-colors cursor-pointer"
      >
        Next →
      </button>
      <span className="font-mono text-[10px] text-neutral-400 ml-2">
        Page {currentPage} / {totalPages}
      </span>
    </div>
  );
};

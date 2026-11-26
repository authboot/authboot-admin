'use client';

import type { Column, Table } from '@tanstack/react-table';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataTableViewOptions } from '@/components/ui/table/data-table-view-options';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

// ============================================================
// Filter toolbar — search box + "add filter" chips
// ============================================================
// Alternative to DataTableToolbar for tables with several filterable columns.
// One text column is promoted to the search box; every other filterable
// column is reachable from the filter button and appears as a chip once
// added. Values go through TanStack column filters, so the URL sync and
// server round-trips from `useDataTable` apply unchanged.
//
// Column meta drives the editor:
//   variant 'text'                → free text
//   variant 'select'/'multiSelect' → option list (meta.options)

interface DataTableFilterToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  /** Column shown as the search box; default: the first filterable text column. */
  searchColumnId?: string;
  searchPlaceholder?: string;
}

export function DataTableFilterToolbar<TData>({
  table,
  searchColumnId,
  searchPlaceholder = 'Search…',
  children,
  className,
  ...props
}: DataTableFilterToolbarProps<TData>) {
  const filterable = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table]
  );
  const searchColumn = React.useMemo(
    () =>
      (searchColumnId ? filterable.find((c) => c.id === searchColumnId) : undefined) ??
      filterable.find((c) => c.columnDef.meta?.variant === 'text'),
    [filterable, searchColumnId]
  );
  const chipColumns = React.useMemo(
    () => filterable.filter((c) => c.id !== searchColumn?.id),
    [filterable, searchColumn]
  );

  // Chips the user added explicitly; a chip with a value is always shown.
  const [added, setAdded] = React.useState<string[]>([]);
  const active = chipColumns.filter((c) => added.includes(c.id) || hasValue(c.getFilterValue()));
  const addable = chipColumns.filter((c) => !active.some((a) => a.id === c.id));

  function remove(column: Column<TData>) {
    column.setFilterValue(undefined);
    setAdded((prev) => prev.filter((id) => id !== column.id));
  }

  function clearAll() {
    table.resetColumnFilters();
    setAdded([]);
  }

  const anyValue = filterable.some((c) => hasValue(c.getFilterValue()));

  return (
    <div className={cn('flex w-full flex-col gap-2', className)} {...props}>
      <div className='flex items-center gap-2'>
        {searchColumn && (
          <div className='relative w-full max-w-sm'>
            <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
            <Input
              value={(searchColumn.getFilterValue() as string) ?? ''}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className='h-9 pl-8'
              onChange={(event) => searchColumn.setFilterValue(event.target.value || undefined)}
            />
          </div>
        )}
        <div className='ml-auto flex items-center gap-2'>
          {children}
          <DataTableViewOptions table={table} />
          {chipColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='outline'
                    size='icon-sm'
                    aria-label='Add filter'
                    disabled={addable.length === 0}
                  />
                }
              >
                <Icons.filter />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='min-w-44'>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                </DropdownMenuGroup>
                {addable.map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    onClick={() => setAdded((prev) => [...prev, column.id])}
                  >
                    {column.columnDef.meta?.label ?? column.id}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {(active.length > 0 || anyValue) && (
        <div className='flex flex-wrap items-center gap-2'>
          {active.map((column) => (
            <FilterChip key={column.id} column={column} onRemove={() => remove(column)} />
          ))}
          <Button
            variant='ghost'
            size='xs'
            className='text-muted-foreground'
            onClick={clearAll}
            disabled={!anyValue && active.length === 0}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

interface FilterChipProps<TData> {
  column: Column<TData>;
  onRemove: () => void;
}

/**
 * One active filter: "Label · value" with a popover editor. Newly added chips
 * open their editor immediately so the user can type without a second click.
 */
function FilterChip<TData>({ column, onRemove }: FilterChipProps<TData>) {
  const meta = column.columnDef.meta;
  const label = meta?.label ?? column.id;
  const value = column.getFilterValue();
  const [open, setOpen] = React.useState(!hasValue(value));

  const isSelect = meta?.variant === 'select' || meta?.variant === 'multiSelect';
  const options = meta?.options ?? [];
  const selected = new Set(Array.isArray(value) ? (value as string[]) : []);

  const summary = isSelect
    ? options
        .filter((o) => selected.has(o.value))
        .map((o) => o.label)
        .join(', ')
    : typeof value === 'string'
      ? value
      : '';

  function toggleOption(optionValue: string) {
    const next = new Set(selected);
    if (meta?.variant === 'multiSelect') {
      if (next.has(optionValue)) next.delete(optionValue);
      else next.add(optionValue);
    } else {
      next.clear();
      if (!selected.has(optionValue)) next.add(optionValue);
    }
    column.setFilterValue(next.size ? Array.from(next) : undefined);
    if (meta?.variant !== 'multiSelect') setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Badge
        variant='outline'
        className='h-7 gap-0 p-0 pr-1 text-xs font-normal has-[button[data-slot=chip-remove]:hover]:border-destructive/50'
      >
        <PopoverTrigger
          render={
            <button
              type='button'
              aria-label={`Edit ${label} filter`}
              className='flex h-full items-center gap-1 pr-1 pl-2'
            />
          }
        >
          <Icons.filter className='text-muted-foreground size-3' />
          <span className='font-medium'>{label}</span>
          <span className='text-muted-foreground max-w-40 truncate'>
            {summary || (isSelect ? 'Select…' : 'Enter value')}
          </span>
          <Icons.chevronDown className='text-muted-foreground size-3' />
        </PopoverTrigger>
        <button
          type='button'
          data-slot='chip-remove'
          aria-label={`Remove ${label} filter`}
          className='hover:bg-muted flex size-5 items-center justify-center rounded-sm'
          onClick={onRemove}
        >
          <Icons.close className='size-3' />
        </button>
      </Badge>

      <PopoverContent align='start' className={cn('p-1', isSelect ? 'w-48' : 'w-64 p-2')}>
        {isSelect ? (
          <div className='max-h-64 overflow-y-auto'>
            {options.map((option) => {
              const checked = selected.has(option.value);
              return (
                <button
                  key={option.value}
                  type='button'
                  aria-pressed={checked}
                  className='hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm'
                  onClick={() => toggleOption(option.value)}
                >
                  <Icons.check className={cn('size-4', checked ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : (
          <Input
            autoFocus
            value={typeof value === 'string' ? value : ''}
            placeholder={meta?.placeholder ?? `Filter by ${label.toLowerCase()}…`}
            aria-label={label}
            className='h-8'
            onChange={(event) => column.setFilterValue(event.target.value || undefined)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === 'Escape') setOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

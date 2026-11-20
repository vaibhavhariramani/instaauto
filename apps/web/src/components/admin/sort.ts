export type SortDir = 'asc' | 'desc';

// Text columns read naturally A→Z first; numeric/date columns are most useful biggest-first.
export function nextSort<K extends string>(
  column: K,
  current: { column: K; dir: SortDir },
  textColumns: readonly K[],
): { column: K; dir: SortDir } {
  if (column === current.column) return { column, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  return { column, dir: textColumns.includes(column) ? 'asc' : 'desc' };
}

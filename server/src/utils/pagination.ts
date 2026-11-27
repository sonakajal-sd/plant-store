// Reads ?page=2&pageSize=12 from the URL safely.
// Bad or missing values fall back to page 1 and the default size; the size is capped.
export function readPage(query: Record<string, unknown>, defaultSize: number, maxSize = 100) {
  let page = Number(query.page);
  let pageSize = Number(query.pageSize);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(pageSize) || pageSize < 1) pageSize = defaultSize;
  if (pageSize > maxSize) pageSize = maxSize;

  // skip = how many rows to jump over (page 3 of 12 → skip 24)
  return { page: page, pageSize: pageSize, skip: (page - 1) * pageSize };
}

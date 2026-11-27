// One page of a long list, as the server sends it
export type Paged<T> = {
  items: T[];
  total: number; // how many there are in total (all pages)
  page: number; // this page (starts at 1)
  pageSize: number; // how many per page
};

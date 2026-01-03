import type { Order, Product } from "@/lib/types";

type Store = {
  products: Product[];
  orders: Order[];
};

const globalKey = Symbol.for("shoestore.store");

function initStore(): Store {
  return {
    products: [],
    orders: [],
  };
}

// @ts-ignore
const g: any = globalThis as any;
if (!g[globalKey]) {
  g[globalKey] = initStore();
}

const store: Store = g[globalKey] as Store;

export function listProducts() {
  return store.products;
}

export function getProduct(id: string) {
  return store.products.find((p) => p.id === id || p.slug === id) || null;
}

export function createProduct(input: Omit<Product, "id"> & { id?: string }) {
  const id = input.id || `custom-${Date.now()}`;
  const product: Product = { ...input, id } as Product;
  const existingIdx = store.products.findIndex((p) => p.slug === product.slug || p.id === product.id);
  if (existingIdx >= 0) {
    store.products[existingIdx] = product;
  } else {
    store.products.unshift(product);
  }
  return product;
}

export function updateProduct(id: string, input: Partial<Product>) {
  const idx = store.products.findIndex((p) => p.id === id || p.slug === id);
  if (idx < 0) return null;
  const next = { ...store.products[idx], ...input } as Product;
  store.products[idx] = next;
  return next;
}

export function deleteProduct(id: string) {
  const before = store.products.length;
  store.products = store.products.filter((p) => p.id !== id && p.slug !== id);
  return store.products.length !== before;
}

export function listOrders() {
  return store.orders;
}

export function getOrder(id: string) {
  return store.orders.find((o) => o.id === id) || null;
}

export function createOrder(order: Order) {
  const existing = store.orders.findIndex((o) => o.id === order.id);
  if (existing >= 0) {
    store.orders[existing] = order;
  } else {
    store.orders.unshift(order);
  }
  return order;
}

export function updateOrder(id: string, input: Partial<Order>) {
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  const next = { ...store.orders[idx], ...input } as Order;
  store.orders[idx] = next;
  return next;
}

export function deleteOrder(id: string) {
  const before = store.orders.length;
  store.orders = store.orders.filter((o) => o.id !== id);
  return store.orders.length !== before;
}

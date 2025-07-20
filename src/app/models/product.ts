export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'cremes' | 'gels' | 'parfums';
  inStock: boolean;
  stock_quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

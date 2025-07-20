export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'cremes' | 'gels' | 'parfums';
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      try {
        const response = await AsyncStorage.getItem('@GoCart:Cart');
        if (!!response) {
          setProducts([...JSON.parse(response)]);
        }
      } catch (err) {
        console.log(err);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      try {
        const filterProducts = products.filter(product => product.id !== id);

        const newProduct = products.find(product => product.id === id);

        if (newProduct) {
          newProduct.quantity += 1;
          setProducts([...filterProducts, newProduct]);
        }

        await AsyncStorage.setItem('@GoCart:Cart', JSON.stringify(products));
      } catch (err) {
        console.log(err);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      try {
        const filterProducts = products.filter(product => product.id !== id);

        const newProduct = products.find(product => product.id === id);

        if (newProduct && newProduct.quantity === 1) {
          setProducts(filterProducts);
          return await AsyncStorage.setItem(
            '@GoCart:Cart',
            JSON.stringify(products),
          );
        }

        if (!!newProduct) {
          newProduct.quantity -= 1;
          setProducts([...filterProducts, newProduct]);
        }

        await AsyncStorage.setItem('@GoCart:Cart', JSON.stringify(products));
      } catch (err) {
        console.log(err);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      try {
        const productIndex = products.findIndex(
          storedProduct => storedProduct.id === product.id,
        );

        if (productIndex < 0) {
          setProducts([...products, { ...product, quantity: 1 }]);
          await AsyncStorage.setItem(
            '@GoCart:Cart',
            JSON.stringify([...products, { ...product, quantity: 1 }]),
          );
        } else {
          increment(product.id);
        }
      } catch (err) {
        console.log(err);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };

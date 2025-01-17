export const searchProduct = async (query: string): Promise<SearchProductResult> => {
  const url = new URL('https://dummyjson.com/products/search');

  url.searchParams.set('q', query);
  url.searchParams.set('limit', '10');

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
};

interface SearchProductResult {
  products: Product[];
}

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  sku: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  reviews: {
    rating: number;
    comment: string;
    date: string;
    reviewerName: string;
    reviewerEmail: string;
  }[];
  returnPolicy: string;
  minimumOrderQuantity: number;
  meta: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
  images: string[];
  thumbnail: string;
}

export const searchPost = async (query: string): Promise<SearchPostResult> => {
  const url = new URL(`https://dummyjson.com/posts/search`);

  url.searchParams.set('limit', '10');
  url.searchParams.set('q', query);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
};

interface Post {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: {
      likes: number;
      dislikes: number;
  };
  views: number;
  userId: number;
}

interface SearchPostResult {
  posts: Post[]
}

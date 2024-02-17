type Item = {
  shortDescription: string;
  price: number;
};

export type Receipt = {
  retailer: string;
  purchaseDate: Date;
  purchaseTime: string;
  total: number;
  items: Array<Item>;
};

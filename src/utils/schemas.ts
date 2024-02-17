import Joi, { CustomValidator } from "joi";
/**
 * Example
 * 
 * {
    "retailer": "Walgreens",
    "purchaseDate": "2022-01-02",
    "purchaseTime": "08:13",
    "total": "2.65",
    "items": [
        {"shortDescription": "Pepsi - 12-oz", "price": "1.25"},
        {"shortDescription": "Dasani", "price": "1.40"}
    ]
}
 */
const assert = (condition: boolean, message?: string) => {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
};

const timeValidator: CustomValidator = (value: string, helpers) => {
  assert(value.length === 5, "String length must be 5");
  assert(value[2] === ":", ": must be the separator");

  const hour = +value.substring(0, 2);
  assert(hour >= 0 && hour < 24, "24 hour format required");
  const minute = +value.substring(3);
  assert(minute >= 0 && minute < 60, "Minutes must be between 0 and 59");

  return value;
};

const GenericStringSchema = Joi.string().pattern(new RegExp("^[\\S\\s\\-]+$"));
const CostSchema = Joi.string().pattern(new RegExp("^\\d+\\.\\d{2}$"));

const ItemSchema = Joi.object({
  shortDescription: GenericStringSchema.required(),
  price: CostSchema.required(),
});

export const ReceiptSchema = Joi.object({
  retailer: GenericStringSchema.required(),
  purchaseDate: Joi.date().required(),
  purchaseTime: Joi.custom(timeValidator).required(),
  total: CostSchema.required(),
  items: Joi.array().items(ItemSchema).min(1).required(),
});

import { Receipt } from "../utils/models";
import moment, { Moment } from "moment";
import { v4 as uuidv4 } from "uuid";

const ALPHANUMERIC_FILTER = new RegExp("[^0-9A-Za-z]+", "g");

export class ReceiptProcessor {
  private receipt: Receipt;
  private purchaseTime: Moment;
  private id: string;

  constructor(receipt: Object) {
    this.receipt = receipt as Receipt;

    // some conversions because the request body values are strings
    this.receipt.purchaseDate = new Date(this.receipt.purchaseDate);
    this.receipt.total = +this.receipt.total;
    this.receipt.items = this.receipt.items.map((val) => {
      return {
        shortDescription: val.shortDescription,
        price: +val.price,
      };
    });

    this.purchaseTime = moment(this.receipt.purchaseTime, "HH:mm");
    this.id = uuidv4();
  }

  private isTotalWholeNumber(): boolean {
    return this.receipt.total - Math.floor(this.receipt.total) === 0;
  }

  private isTotalDivisibleByN(n: number): boolean {
    return this.receipt.total % n === 0;
  }

  private getItemPoints(): number {
    let points = 0;
    this.receipt.items.forEach((item) => {
      const trimmedDescription = item.shortDescription.trim();

      if (trimmedDescription.length % 3 === 0) {
        points += Math.ceil(item.price * 0.2);
      }
    });

    return points;
  }

  private isPurchaseDateOdd(): boolean {
    return this.receipt.purchaseDate.getUTCDate() % 2 === 1;
  }

  private isPurchaseTimeInRange(start: string, end: string) {
    return (
      this.purchaseTime.isAfter(moment(start, "HH:mm")) &&
      this.purchaseTime.isBefore(moment(end, "HH:mm"))
    );
  }

  public getId(): string {
    return this.id;
  }

  public checkCost(): boolean {
    // sanity check

    // this has some floating point number errors
    const totalItemCost = this.receipt.items.reduce(
      (acc, cv) => acc + Number(cv.price),
      0
    );
    return this.receipt.total === totalItemCost;
  }

  public calculatePoints(): number {
    /**
     * Points breakdown:
     * - 1 pt for every alphanumeric character in retailer name
     * - 50 pts: total is a whole number
     * - 25 pts: total is a multiple of 0.25
     * - 5 pts: every two items
     * - trimmed length of item description is multiple of 3 => mul price by 0.2, round up
     * - 6 pts: day of purchase date is odd
     * - 10 pts: time of purchase is after 2:00pm and before 4:00 pm
     */

    let points = 0;
    points += this.receipt.retailer
      .trim()
      .replace(ALPHANUMERIC_FILTER, "").length;
    if (this.isTotalWholeNumber()) points += 50;
    if (this.isTotalDivisibleByN(0.25)) points += 25;
    points += Math.floor(this.receipt.items.length / 2) * 5;
    points += this.getItemPoints();
    if (this.isPurchaseDateOdd()) points += 6;
    if (this.isPurchaseTimeInRange("14:00", "16:00")) points += 10;

    return points;
  }
}

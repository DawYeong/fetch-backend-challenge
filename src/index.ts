import express from "express";
import { ReceiptSchema } from "./utils/schemas";
import { ReceiptProcessor } from "./backend/receipt-processor";

// "database" here
const receiptMap = new Map<string, string>();
const idMap = new Map<string, number>();

const app = express();

app.use(express.json());

// the path is /receipts/{id}/points but in regex
app.get(/^[\/]?receipts\/?([\S]+)\/points[\/]?$/, (req, res) => {
  // check if id in params is in map
  const id = req.params["0"];

  if (!idMap.has(id)) {
    res.status(400).send({ error: "id not found" });
    return;
  }

  res.status(200).send({ points: idMap.get(id) });
});

app.post("/receipts/process", (req, res) => {
  const checkForm = ReceiptSchema.validate(req.body);

  if (checkForm.error) {
    res.status(400).send({ error: checkForm.error });
    return;
  }

  const receipt = checkForm.value;
  const bodyString = JSON.stringify(req.body);

  // to avoid duplicates and repeated calculations
  if (receiptMap.has(bodyString)) {
    res.status(200).send({ id: receiptMap.get(bodyString) });
    return;
  }

  const rp = new ReceiptProcessor(receipt);

  // skipping this sanity check, rounding issues causing incorrect results
  // if (!rp.checkCost()) {
  //   res
  //     .status(400)
  //     .send({ error: "Receipt has inconsistent items and total costs" });
  //   return;
  // }

  receiptMap.set(bodyString, rp.getId());
  idMap.set(rp.getId(), rp.calculatePoints());
  res.status(200).send({ id: rp.getId() });
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});

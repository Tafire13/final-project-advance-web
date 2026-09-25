import express from "express";
import cors from "cors";
import { router as customerRoutes } from "./src/routes/customerRoutes";
import { router as orderRoutes } from "./src/routes/orderRoutes";

export const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());


app.use("/api/customer", customerRoutes);
app.use("/api/order", orderRoutes);

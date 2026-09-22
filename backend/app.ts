import express from "express";
import { router as customerRoutes } from "./src/routes/customerRoutes";
import { router as orderRoutes} from './src/routes/orderRoutes';

export const app = express();

app.use(express.json());
app.use(express.text());


app.use("/api/customer", customerRoutes);
app.use("/api/order", orderRoutes);

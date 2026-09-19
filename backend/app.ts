import express from "express";
import { router as customerRoutes } from "./routes/customerRoutes";
import { router as orderRoutes} from './routes/orderRoutes';

export const app = express();

app.use(express.json());
app.use(express.text());


app.use("/api/customer", customerRoutes);
app.use("/api/order", orderRoutes);

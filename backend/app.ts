import express from "express";
import { router as customerRoutes } from "./routes/customerRoutes";

export const app = express();

app.use(express.json());
app.use(express.text());


app.use("/api/customer", customerRoutes);
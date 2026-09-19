import express from "express";
import { getCustomers } from "../controllers/customerController";

export const router = express.Router();

router.get("/", getCustomers);
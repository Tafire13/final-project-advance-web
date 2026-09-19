import express from "express";
import { getCustomers, getCustomersByID } from "../controllers/customerController";

export const router = express.Router();

router.get("/", getCustomers);
router.get("/:id", getCustomersByID);
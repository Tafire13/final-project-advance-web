import express from 'express';
import { getOrder } from '../controllers/orderController';

export const router = express.Router();

router.get('/', getOrder);
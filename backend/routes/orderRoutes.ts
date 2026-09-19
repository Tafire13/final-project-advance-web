import express from 'express';
import { createOrder, deleteOrderByID, getOrder, getOrderByID, updateOrderByID } from '../controllers/orderController';

export const router = express.Router();

router.get('/', getOrder);
router.get('/:id', getOrderByID);
router.put('/:id', updateOrderByID);
router.post('/', createOrder);
router.delete('/:id', deleteOrderByID);
import { Request, Response } from "express";
import { conn } from "../config/dbconnect";
import { ResultSetHeader } from "mysql2";
import { CreateOrderModel, OrderModel, UpdateOrderModel } from "../models/orderModel";

export const getOrder = async (req: Request, res: Response) => {
    try {
        const [rows] = await conn.query('SELECT * FROM orders');
        const orders = rows as OrderModel[];
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Database error'
        });
    }
}

export const getOrderByID = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const [rows] = await conn.query('SELECT * FROM orders WHERE id = ?', [
            id
        ]);

        const orders = rows as OrderModel[];

        if (orders.length === 0) {
            res.status(404).json({
                error: 'Order not found'
            });
        }

        const order: OrderModel = orders[0]!;
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Database error'
        });
    }
}

export const createOrder = async (req: Request, res: Response) => {
    try {
        const order: CreateOrderModel = req.body

        if (!order.customer_id || !order.order_date || !order.quantity) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

        if (order.quantity < 1 || order.quantity > 3) {
            return res.status(400).json({
                error: "Quantity must be between 1 and 3"
            });
        }

        const [customers] = await conn.query('SELECT id FROM customers WHERE id = ? and deleted_at IS NULL', [customer_id]);

        const customerRows = customers as any[];
        
        if (customerRows.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        const [result] = await conn.query<ResultSetHeader>('INSERT INTO orders (customer_id, quantity, order_date) VALUES (?, ?, ?)',
            [
                order.customer_id,
                order.quantity,
                order.order_date
            ]
        );

        res.status(201).json({
            affected_rows: result.affectedRows,
            last_id: result.insertId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Database error'
        });
    }
}

export const updateOrderByID = async (req: Request,res: Response) => {
    try {
        const id = req.params.id;
        const order: UpdateOrderModel = req.body;

        const [rows] = await conn.query(
            `SELECT * FROM orders WHERE id = ?`,
            [id]
        );

        const orders = rows as OrderModel[];

        if (orders.length === 0) {
            return res.status(404).json({
                error: "Order not found"
            });
        }

        const originalOrder = orders[0];

        const updatedOrder = {
            ...originalOrder,
            ...order
        };

        if (updatedOrder.quantity! < 1 || updatedOrder.quantity! > 3) {
            return res.status(400).json({
                error: "Quantity must be between 1 and 3"
            });
        }

        const [customers] = await conn.query(
            `SELECT id
             FROM customers
             WHERE id = ?
             AND deleted_at IS NULL`,
            [updatedOrder.customer_id]
        );

        const customerRows = customers as { id: number }[];

        if (customerRows.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        const [result] = await conn.query<ResultSetHeader>(
            `UPDATE orders
                SET customer_id = ?,
                quantity = ?,
                order_date = ?,
                status = ?
                WHERE id = ?`,
            [
                updatedOrder.customer_id,
                updatedOrder.quantity,
                updatedOrder.order_date,
                updatedOrder.status,
                id
            ]
        );

        res.status(200).json({
            message: "Order updated successfully",
            affected_rows: result.affectedRows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Database error"
        });
    }
};

export const deleteOrderByID = async (req: Request,res: Response) => {
    try {
        const id = req.params.id;

        const [result] =
            await conn.query<ResultSetHeader>(
                `UPDATE orders
                 SET status = 'cancelled'
                 WHERE id = ?
                 AND status != 'cancelled'`,
                [id]
            );

        if (result.affectedRows === 0) {

            const [rows] = await conn.query(
                `SELECT id, status
                 FROM orders
                 WHERE id = ?`,
                [id]
            );

            const orders = rows as OrderModel[];

            if (orders.length === 0) {
                return res.status(404).json({
                    error: "Order not found"
                });
            }

            return res.status(400).json({
                error: "Order already cancelled"
            });
        }

        res.status(200).json({
            message: "Order cancelled successfully"
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Database error"
        });
    }
};

export const randomOrder = async (
    req: Request,
    res: Response
) => {
    try {
        const amount = Number(req.body.amount ?? 10);

        const [rows] = await conn.query(
            `SELECT id
             FROM customers
             WHERE deleted_at IS NULL`
        );

        const customers = rows as { id: number }[];

        if (customers.length === 0) {
            return res.status(400).json({
                error: "No customers available"
            });
        }

        for (let i = 0; i < amount; i++) {
            const randomCustomer =
                customers[
                    Math.floor(
                        Math.random() * customers.length
                    )
                ];

            const quantity =
                Math.floor(Math.random() * 3) + 1;

            await conn.query(
                `INSERT INTO orders
                (customer_id, quantity, order_date, status, is_demo)
                VALUES (?, ?, CURDATE(), 'pending', TRUE)`,
                [
                    randomCustomer!.id,
                    quantity
                ]
            );
        }

        res.status(201).json({
            message: "Random orders generated",
            amount
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Database error"
        });
    }
};
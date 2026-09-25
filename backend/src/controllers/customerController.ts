import { Request, Response } from "express";
import { conn } from "../config/dbconnect";
import { CustomerModel } from "../models/customerModel";
import { ResultSetHeader } from "mysql2";

export const getCustomers = async (req: Request, res: Response) => {
    try {
        const [rows] = await conn.query('SELECT * FROM customers');
        const customers = rows as CustomerModel[];
        return res.json(customers); 
    } catch (err: any) {
        console.error("Error in getCustomers:", err);
        return res.status(500).json({
            error: "Database error",
            details: err?.message || String(err)
        });
    }
};

export const getCustomersByID = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const [rows] = await conn.query('SELECT * FROM customers WHERE id = ?', [id]);
        const customers = rows as CustomerModel[];

        if (customers.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        return res.json(customers[0]);
    } catch (err: any) {
        console.error("Error in getCustomersByID:", err);
        return res.status(500).json({
            error: "Database error",
            details: err?.message || String(err)
        });
    }
};

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const { name, phone, address, latitude, longitude } = req.body;

        const sql = 'INSERT INTO customers (name, phone, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)';
        const [result] = await conn.query<ResultSetHeader>(sql, [name, phone, address, latitude, longitude]);

        return res.status(201).json({ 
            affected_rows: result.affectedRows,
            last_id: result.insertId
        });
    } catch (err: any) {
        console.error("Error in createCustomer:", err);
        return res.status(500).json({ 
            error: "Database error",
            details: err?.message || String(err)
        });
    }
};

export const deleteCustomerByID = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        await conn.query('DELETE FROM orders WHERE customer_id = ?', [id]);

        const [result] = await conn.query<ResultSetHeader>('DELETE FROM customers WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        return res.status(200).json({
            message: "Deleted customer and related orders successfully",
            affected_row: result.affectedRows
        });
    } catch (err: any) {
        console.error("Error in deleteCustomerByID:", err);
        return res.status(500).json({
            error: 'Database error',
            details: err?.message || String(err)
        });
    }
};

export const updateCustomerByID = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { name, phone, address, latitude, longitude } = req.body;

        const sql = `
            UPDATE customers
            SET name = ?,
                phone = ?,
                address = ?,
                latitude = ?,
                longitude = ?
            WHERE id = ?
        `;

        const [result] = await conn.query<ResultSetHeader>(sql, [
            name,
            phone,
            address,
            latitude,
            longitude,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        return res.status(200).json({
            affected_row: result.affectedRows
        });
    } catch (err: any) {
        console.error("Error in updateCustomerByID:", err);
        return res.status(500).json({ 
            error: "Database error",
            details: err?.message || String(err)
        });
    }
};
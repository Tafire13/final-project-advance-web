import { Request, Response } from "express";
import { conn } from "../config/dbconnect";
import { CustomerModel } from "../models/customerModel";
import { ResultSetHeader } from "mysql2";

export const getCustomers = async (req: Request, res: Response) => {
    const [rows] = await conn.query('select * from customers');
    const customers = rows as CustomerModel[];
    res.json(customers);
}

export const getCustomersByID = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const [rows] = await conn.query('select * from customers where id = ?', [
            id
        ]);

        const customers = rows as CustomerModel[];

        if (customers.length === 0) {
            res.status(404).json({
                error: "Customer not found"
            });
        }

        const customer = customers[0];


        res.json(customer);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Database error"
        });
    }
}

export const createCustomer = async (req: Request, res: Response) => {
    try {
        const {
            name,
            phone,
            address,
            latitude,
            longitude
        } = req.body;
        console.log(req.body);

        const sql = 'insert into customers (name, phone, address, latitude, longitude) values (?, ?, ?, ?, ?)';

        const [result] = await conn.query<ResultSetHeader>(sql,
            [name, phone, address, latitude, longitude]
        );

        res.status(201).json({
            affected_rows: result.affectedRows,
            last_id: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Database error"
        });
    }
}

export const deleteCustomerByID = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const [result] = await conn.query<ResultSetHeader>('DELETE FROM customers WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        res.status(200).json({
            affected_row: result.affectedRows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Database error'
        });
    }
}

export const updateCustomerByID = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const customer: CustomerModel = req.body;

        const [rows] = await conn.query(
            'SELECT * FROM customers WHERE id = ?',
            [id]
        );

        const customers = rows as CustomerModel[];

        if (customers.length === 0) {
            return res.status(404).json({
                error: "Customer not found"
            });
        }

        const customerOriginal = customers[0];

        const updateCustomer = {...customerOriginal, ...customer};

        const sql = `
            UPDATE customers
            SET name = ?,
                phone = ?,
                address = ?,
                latitude = ?,
                longitude = ?
            WHERE id = ?
        `;

        const [result] = await conn.query<ResultSetHeader>(
            sql,
            [
                updateCustomer.name,
                updateCustomer.phone,
                updateCustomer.address,
                updateCustomer.latitude,
                updateCustomer.longitude,
                id
            ]
        );

        res.status(200).json({
            affected_row: result.affectedRows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Database error"
        });
    }
};
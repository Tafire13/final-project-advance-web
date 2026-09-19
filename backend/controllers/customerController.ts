import { Request, Response } from "express";
import { conn } from "../config/dbconnect";

export const getCustomers = async (req: Request, res: Response) => {
    const [rows] = await conn.query('select * from customers');
    res.send(rows);
}

export const getCustomersByID = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const [rows] = await conn.query('select * from customers where id = ?', [
            id
        ]);
        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Database error"
        });
    }
}
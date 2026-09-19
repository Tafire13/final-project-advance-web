import { Request, Response } from "express";

export const getCustomers = (req: Request, res: Response) => {
    res.send('this is path: api/customer');
}
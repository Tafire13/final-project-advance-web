import { Request, Response } from "express";

export const getOrder = async (req: Request, res: Response) => {
    res.send('This is path: api/order');
}
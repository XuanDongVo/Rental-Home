import { PrismaClient } from "@prisma/client";
import { getLeaseByPropertyId as getLeaseByPropertyIdService } from "../services/leaseService";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getLeasePayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const payments = await prisma.payment.findMany({
      where: { leaseId: Number(id) },
    });
    res.json(payments);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving lease payments: ${error.message}` });
  }
};

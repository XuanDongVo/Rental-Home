import { Request, Response } from "express";
import * as applicationService from "../services/applicationService";

export const listApplications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const applications = await applicationService.listApplications(req.query);
    res.json(applications);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving applications: ${error.message}` });
  }
};

export const createApplication = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const newApplication = await applicationService.createApplication(req.body);
    res.status(201).json(newApplication);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: `Error creating application: ${error.message}`,
    });
  }
};

export const updateApplicationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedApplication = await applicationService.updateApplicationStatus(
      Number(id),
      status
    );
    res.json(updatedApplication);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: `Error updating application status: ${error.message}`,
    });
  }
};

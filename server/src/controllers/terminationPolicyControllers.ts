import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { promises } from "dns";
import { parse } from "path";

const prisma = new PrismaClient();

// Default termination policy rules
const DEFAULT_POLICY_RULES = [
  {
    minDaysNotice: 0,
    maxDaysNotice: 29,
    penaltyPercentage: 100,
    description: "Less than 30 days notice",
  },
  {
    minDaysNotice: 30,
    maxDaysNotice: 59,
    penaltyPercentage: 50,
    description: "30-59 days notice",
  },
  {
    minDaysNotice: 60,
    maxDaysNotice: 999,
    penaltyPercentage: 0,
    description: "60+ days notice (no penalty)",
  },
];

const DEFAULT_WAIVER_CONDITIONS = [
  "Medical emergency",
  "Job relocation (with proof)",
  "Military deployment",
  "Domestic violence",
  "Property uninhabitable",
];

// Get termination policies for a property
export const getTerminationPolicies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId, active } = req.query;

    if (!propertyId) {
      res.status(400).json({ error: "Property ID is required" });
      return;
    }

    const whereClause: any = {
      propertyId: parseInt(propertyId as string),
    };

    if (active === "true") {
      whereClause.isActive = true;
    }

    const policies = await prisma.terminationPolicy.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    // If no policies found and querying for active policies, create default policy
    if (policies.length === 0 && active === "true") {
      console.log(
        `No policies found for property ${propertyId}, creating default policy...`
      );

      // Verify property exists first
      const property = await prisma.property.findUnique({
        where: { id: parseInt(propertyId as string) },
        include: { manager: true },
      });

      if (property) {
        // Create default policy
        const defaultPolicy = await prisma.terminationPolicy.create({
          data: {
            propertyId: parseInt(propertyId as string),
            isActive: true,
            minimumNoticedays: 30,
            penaltyRules: DEFAULT_POLICY_RULES,
            allowWaiverConditions: DEFAULT_WAIVER_CONDITIONS,
            gracePeriodDays: 60,
            createdById: property.manager.id,
          },
        });

        policies.push(defaultPolicy);
        console.log(`Default policy created for property ${propertyId}`);
      }
    }

    // Transform the data to match frontend expectations
    const transformedPolicies = policies.map((policy) => ({
      id: policy.id,
      propertyId: policy.propertyId,
      isActive: policy.isActive,
      minimumNoticeRequired: policy.minimumNoticedays,
      rules: policy.penaltyRules as any[],
      allowEmergencyWaiver: policy.allowWaiverConditions ? true : false,
      emergencyCategories: (policy.allowWaiverConditions as string[]) || [],
      gracePeriodDays: policy.gracePeriodDays,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    }));

    res.json(transformedPolicies);
  } catch (error) {
    console.error("Error fetching termination policies:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get specific termination policy
export const getTerminationPolicy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const policy = await prisma.terminationPolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }

    const transformedPolicy = {
      id: policy.id,
      propertyId: policy.propertyId,
      isActive: policy.isActive,
      minimumNoticeRequired: policy.minimumNoticedays,
      rules: policy.penaltyRules as any[],
      allowEmergencyWaiver: policy.allowWaiverConditions ? true : false,
      emergencyCategories: (policy.allowWaiverConditions as string[]) || [],
      gracePeriodDays: policy.gracePeriodDays,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };

    res.json(transformedPolicy);
  } catch (error) {
    console.error("Error fetching termination policy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new termination policy
export const createTerminationPolicy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      propertyId,
      minimumNoticeRequired = 30,
      rules,
      allowEmergencyWaiver = true,
      emergencyCategories,
      gracePeriodDays = 60,
    } = req.body;

    const user = (req as any).user;
    const propertyIdNumber = parseInt(propertyId);

    if (!propertyIdNumber) {
      res.status(400).json({ error: "Property ID is required" });
      return;
    }

    // Verify property exists and user has access
    const property = await prisma.property.findFirst({
      where: {
        id: propertyIdNumber,
        managerCognitoId: user.id as string,
      },
    });

    if (!property) {
      res.status(404).json({ error: "Property not found or access denied" });
      return;
    }

    // Get manager ID
    const manager = await prisma.manager.findUnique({
      where: { cognitoId: user.id as string },
    });

    if (!manager) {
      res.status(404).json({ error: "Manager not found" });
      return;
    }

    // Deactivate existing policies for this property
    await prisma.terminationPolicy.updateMany({
      where: { propertyId: propertyIdNumber, isActive: true },
      data: { isActive: false },
    });

    // Use provided rules or default rules
    const policyRules =
      rules && rules.length > 0 ? rules : DEFAULT_POLICY_RULES;
    const waiverConditions =
      emergencyCategories && emergencyCategories.length > 0
        ? emergencyCategories
        : allowEmergencyWaiver
        ? DEFAULT_WAIVER_CONDITIONS
        : null;

    const policy = await prisma.terminationPolicy.create({
      data: {
        propertyId: propertyIdNumber,
        isActive: true,
        minimumNoticedays: minimumNoticeRequired,
        penaltyRules: policyRules,
        allowWaiverConditions: waiverConditions,
        gracePeriodDays,
        createdById: manager.id,
      },
    });

    const transformedPolicy = {
      id: policy.id,
      propertyId: policy.propertyId,
      isActive: policy.isActive,
      minimumNoticeRequired: policy.minimumNoticedays,
      rules: policy.penaltyRules as any[],
      allowEmergencyWaiver: policy.allowWaiverConditions ? true : false,
      emergencyCategories: (policy.allowWaiverConditions as string[]) || [],
      gracePeriodDays: policy.gracePeriodDays,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };

    res.status(201).json(transformedPolicy);
  } catch (error) {
    console.error("Error creating termination policy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update termination policy
export const updateTerminationPolicy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      minimumNoticeRequired,
      rules,
      allowEmergencyWaiver,
      emergencyCategories,
      gracePeriodDays,
      isActive,
    } = req.body;

    const user = (req as any).user;

    // Verify policy exists and user has access
    const existingPolicy = await prisma.terminationPolicy.findFirst({
      where: {
        id,
        property: {
          managerCognitoId: user.userInfo.cognitoId,
        },
      },
    });

    if (!existingPolicy) {
      res.status(404).json({ error: "Policy not found or access denied" });
      return;
    }

    const updateData: any = {};

    if (minimumNoticeRequired !== undefined) {
      updateData.minimumNoticedays = minimumNoticeRequired;
    }
    if (rules !== undefined) {
      updateData.penaltyRules = rules;
    }
    if (
      allowEmergencyWaiver !== undefined ||
      emergencyCategories !== undefined
    ) {
      updateData.allowWaiverConditions = allowEmergencyWaiver
        ? emergencyCategories || DEFAULT_WAIVER_CONDITIONS
        : null;
    }
    if (gracePeriodDays !== undefined) {
      updateData.gracePeriodDays = gracePeriodDays;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const policy = await prisma.terminationPolicy.update({
      where: { id },
      data: updateData,
    });

    const transformedPolicy = {
      id: policy.id,
      propertyId: policy.propertyId,
      isActive: policy.isActive,
      minimumNoticeRequired: policy.minimumNoticedays,
      rules: policy.penaltyRules as any[],
      allowEmergencyWaiver: policy.allowWaiverConditions ? true : false,
      emergencyCategories: (policy.allowWaiverConditions as string[]) || [],
      gracePeriodDays: policy.gracePeriodDays,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };

    res.json(transformedPolicy);
  } catch (error) {
    console.error("Error updating termination policy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete termination policy
export const deleteTerminationPolicy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Verify policy exists and user has access
    const existingPolicy = await prisma.terminationPolicy.findFirst({
      where: {
        id,
        property: {
          managerCognitoId: user.userInfo.cognitoId,
        },
      },
    });

    if (!existingPolicy) {
      res.status(404).json({ error: "Policy not found or access denied" });
      return;
    }

    await prisma.terminationPolicy.delete({
      where: { id },
    });

    res.json({ message: "Policy deleted successfully" });
  } catch (error) {
    console.error("Error deleting termination policy:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Calculate termination penalty
export const calculateTerminationPenalty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { propertyId, requestedEndDate, monthlyRent, leaseId } = req.body;
    const leaseIdNumber = parseInt(leaseId);
    if (!propertyId || !requestedEndDate || !monthlyRent || !leaseIdNumber) {
      res.status(400).json({
        error:
          "Property ID, lease ID, requested end date, and monthly rent are required",
      });
      return;
    }

    // Lấy thông tin về hợp đồng thuê
    const lease = await prisma.lease.findUnique({
      where: { id: leaseIdNumber },
    });

    if (!lease) {
      res.status(404).json({ error: "Lease not found" });
      return;
    }

    // Get active policy for property
    let policy = await prisma.terminationPolicy.findFirst({
      where: {
        propertyId: parseInt(propertyId),
        isActive: true,
      },
    });

    // If no active policy found, create a default one
    if (!policy) {
      console.log(
        `No active policy found for property ${propertyId}, creating default policy...`
      );

      // Verify property exists first
      const property = await prisma.property.findUnique({
        where: { id: parseInt(propertyId) },
        include: { manager: true },
      });

      if (!property) {
        res.status(404).json({ error: "Property not found" });
        return;
      }

      // Create default policy
      policy = await prisma.terminationPolicy.create({
        data: {
          propertyId: parseInt(propertyId),
          isActive: true,
          minimumNoticedays: 30,
          penaltyRules: DEFAULT_POLICY_RULES,
          allowWaiverConditions: DEFAULT_WAIVER_CONDITIONS,
          gracePeriodDays: 60,
          createdById: property.manager.id,
        },
      });

      console.log(`Default policy created for property ${propertyId}`);
    }

    // Tính số tháng còn lại trong hợp đồng
    const requestedDate = new Date(requestedEndDate);
    const leaseEndDate = new Date(lease.endDate);

    // Tính số tháng còn lại từ ngày chấm dứt đến ngày kết thúc hợp đồng
    const monthsRemaining =
      (leaseEndDate.getFullYear() - requestedDate.getFullYear()) * 12 +
      (leaseEndDate.getMonth() - requestedDate.getMonth());

    // Calculate days notice (giữ lại cho mục đích tương thích)
    const today = new Date();
    const timeDiff = requestedDate.getTime() - today.getTime();
    const daysNotice = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const rules = policy.penaltyRules as any[];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate minimum notice requirement
    if (daysNotice < policy.minimumNoticedays) {
      errors.push(
        `Minimum notice required is ${policy.minimumNoticedays} days. ` +
          `You are only giving ${daysNotice} days notice.`
      );
    }

    // Tìm quy tắc áp dụng dựa trên số tháng còn lại
    const applicableRule = rules.find(
      (rule) =>
        monthsRemaining >= rule.minMonthsRemaining &&
        monthsRemaining <= rule.maxMonthsRemaining
    );

    let penaltyPercentage = 0;
    let penaltyAmount = 0;

    if (applicableRule) {
      penaltyPercentage = applicableRule.penaltyPercentage;
      penaltyAmount = (monthlyRent * penaltyPercentage) / 100;
    } else {
      // Không tìm thấy quy tắc, áp dụng mức phạt cao nhất
      const highestPenaltyRule = rules.reduce(
        (max, rule) =>
          rule.penaltyPercentage > max.penaltyPercentage ? rule : max,
        { penaltyPercentage: 0 }
      );

      if (highestPenaltyRule.penaltyPercentage > 0) {
        penaltyPercentage = highestPenaltyRule.penaltyPercentage;
        penaltyAmount = (monthlyRent * penaltyPercentage) / 100;
        warnings.push(
          "Không tìm thấy quy tắc cụ thể. Áp dụng mức phạt cao nhất."
        );
      }
    }

    // Thêm cảnh báo cho các khoản phạt cao
    if (penaltyPercentage >= 50) {
      warnings.push(
        `Mức phạt cao (${penaltyPercentage}%). ` +
          `Hãy cân nhắc gia hạn thêm thời gian thuê hoặc thương lượng.`
      );
    }

    const calculation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      appliedPolicy: {
        id: policy.id,
        minimumNoticeRequired: policy.minimumNoticedays,
        rules: policy.penaltyRules,
        allowEmergencyWaiver: policy.allowWaiverConditions ? true : false,
        emergencyCategories: (policy.allowWaiverConditions as string[]) || [],
      },
      appliedRule: applicableRule || null,
      penaltyAmount: Math.round(penaltyAmount * 100) / 100,
      penaltyPercentage,
      daysNotice,
      monthsRemaining,
      leaseEndDate: lease.endDate,
      canWaiveForEmergency: policy.allowWaiverConditions ? true : false,
      emergencyCategories: (policy.allowWaiverConditions as string[]) || [],
    };

    res.json(calculation);
  } catch (error) {
    console.error("Error calculating termination penalty:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

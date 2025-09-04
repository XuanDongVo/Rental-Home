import * as applicationRepository from "../repositories/applicationRepository";
import * as paymentService from "./paymentService";
import { NotificationService } from "./NotificationService";

const notificationService = new NotificationService();

export const listApplications = async (query: any) => {
  const { userId, userType } = query;

  let whereClause = {};

  if (userId && userType) {
    if (userType === "tenant") {
      whereClause = { tenantCognitoId: String(userId) };
    } else if (userType === "manager") {
      whereClause = {
        property: {
          managerCognitoId: String(userId),
        },
      };
    }
  }

  const applications = await applicationRepository.findApplications(
    whereClause
  );

  const formattedApplications = await Promise.all(
    applications.map(async (app) => {
      const lease = await applicationRepository.findLeaseByTenantAndProperty(
        app.tenantCognitoId,
        app.propertyId
      );

      return {
        ...app,
        property: {
          ...app.property,
          address: app.property.location.address,
        },
        manager: app.property.manager,
        lease: lease
          ? {
              ...lease,
              nextPaymentDate: calculateNextPaymentDate(lease.startDate),
            }
          : null,
      };
    })
  );

  return formattedApplications;
};

export const createApplication = async (data: any) => {
  const {
    applicationDate,
    status,
    propertyId,
    tenantCognitoId,
    name,
    email,
    phoneNumber,
    message,
  } = data;

  const property = await applicationRepository.findPropertyById(propertyId);
  if (!property) {
    throw { status: 404, message: "Property not found" };
  }

  const application = await applicationRepository.createApplication({
    applicationDate: new Date(applicationDate),
    status,
    name,
    email,
    phoneNumber,
    message,
    propertyId,
    tenantCognitoId,
  });

  // Send notification to property manager
  await notificationService.notifyApplicationSubmitted(
    application.id,
    name,
    property.name,
    property.managerCognitoId
  );

  return application;
};

export const updateApplicationStatus = async (id: number, status: string) => {
  const application = await applicationRepository.findApplicationById(id);
  if (!application) {
    throw { status: 404, message: "Application not found" };
  }

  let updatedApplication;

  if (status === "Approved") {
    // Kiểm tra xem đã có lease chưa, nếu chưa thì tạo mới
    let leaseId = application.leaseId;

    if (!leaseId) {
      const newLease = await applicationRepository.createLease({
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        rent: application.property.pricePerMonth,
        deposit: application.property.securityDeposit,
        propertyId: application.propertyId,
        tenantCognitoId: application.tenantCognitoId,
      });
      leaseId = newLease.id;

      // Tạo payment cho tháng hiện tại only
      await paymentService.createCurrentMonthPayment(newLease.id);

      await applicationRepository.connectTenantToProperty(
        application.propertyId,
        application.tenantCognitoId
      );
    }

    updatedApplication = await applicationRepository.updateApplication(id, {
      status,
      leaseId: leaseId,
    });
  } else {
    updatedApplication = await applicationRepository.updateApplication(id, {
      status,
    });
  }

  // Send notification to tenant about status change
  await notificationService.notifyApplicationStatusChanged(
    application.id,
    status,
    application.property.name,
    application.tenantCognitoId
  );

  return updatedApplication;
};

function calculateNextPaymentDate(startDate: Date): Date {
  const today = new Date();
  const nextPaymentDate = new Date(startDate);
  while (nextPaymentDate <= today) {
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
  }
  return nextPaymentDate;
}

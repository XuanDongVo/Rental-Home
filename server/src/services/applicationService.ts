import * as applicationRepository from "../repositories/applicationRepository";

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

  return await applicationRepository.createApplicationWithLease({
    applicationDate: new Date(applicationDate),
    status,
    name,
    email,
    phoneNumber,
    message,
    propertyId,
    tenantCognitoId,
    leaseData: {
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      rent: property.pricePerMonth,
      deposit: property.securityDeposit,
    },
  });
};

export const updateApplicationStatus = async (id: number, status: string) => {
  const application = await applicationRepository.findApplicationById(id);
  if (!application) {
    throw { status: 404, message: "Application not found" };
  }

  if (status === "Approved") {
    const newLease = await applicationRepository.createLease({
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      rent: application.property.pricePerMonth,
      deposit: application.property.securityDeposit,
      propertyId: application.propertyId,
      tenantCognitoId: application.tenantCognitoId,
    });

    await applicationRepository.connectTenantToProperty(
      application.propertyId,
      application.tenantCognitoId
    );

    return await applicationRepository.updateApplication(id, {
      status,
      leaseId: newLease.id,
    });
  } else {
    return await applicationRepository.updateApplication(id, { status });
  }
};

function calculateNextPaymentDate(startDate: Date): Date {
  const today = new Date();
  const nextPaymentDate = new Date(startDate);
  while (nextPaymentDate <= today) {
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
  }
  return nextPaymentDate;
}

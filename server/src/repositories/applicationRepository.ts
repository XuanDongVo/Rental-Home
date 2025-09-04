import { ApplicationStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const findApplications = async (whereClause: any) => {
  return await prisma.application.findMany({
    where: whereClause,
    include: {
      property: {
        include: {
          location: true,
          manager: true,
        },
      },
      tenant: true,
    },
  });
};

export const findPropertyById = async (propertyId: number) => {
  return await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      pricePerMonth: true,
      securityDeposit: true,
      name: true,
      managerCognitoId: true,
    },
  });
};

export const findLeaseByTenantAndProperty = async (
  tenantCognitoId: string,
  propertyId: number
) => {
  return await prisma.lease.findFirst({
    where: {
      tenant: { cognitoId: tenantCognitoId },
      propertyId,
    },
    orderBy: { startDate: "desc" },
  });
};

export const createApplicationWithLease = async (data: {
  applicationDate: Date;
  status: ApplicationStatus;
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  propertyId: number;
  tenantCognitoId: string;
  leaseData: {
    startDate: Date;
    endDate: Date;
    rent: number;
    deposit: number;
  };
}) => {
  return await prisma.$transaction(async (prisma) => {
    const lease = await prisma.lease.create({
      data: {
        startDate: data.leaseData.startDate,
        endDate: data.leaseData.endDate,
        rent: data.leaseData.rent,
        deposit: data.leaseData.deposit,
        property: { connect: { id: data.propertyId } },
        tenant: { connect: { cognitoId: data.tenantCognitoId } },
      },
    });

    return await prisma.application.create({
      data: {
        applicationDate: data.applicationDate,
        status: data.status,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        message: data.message,
        property: { connect: { id: data.propertyId } },
        tenant: { connect: { cognitoId: data.tenantCognitoId } },
        lease: { connect: { id: lease.id } },
      },
      include: {
        property: true,
        tenant: true,
        lease: true,
      },
    });
  });
};

export const createApplication = async (data: {
  applicationDate: Date;
  status: ApplicationStatus;
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  propertyId: number;
  tenantCognitoId: string;
}) => {
  return await prisma.application.create({
    data: {
      applicationDate: data.applicationDate,
      status: data.status,
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      message: data.message,
      property: { connect: { id: data.propertyId } },
      tenant: { connect: { cognitoId: data.tenantCognitoId } },
    },
    include: {
      property: true,
      tenant: true,
    },
  });
};

export const findApplicationById = async (id: number) => {
  return await prisma.application.findUnique({
    where: { id },
    include: {
      property: true,
      tenant: true,
      lease: true,
    },
  });
};

export const createLease = async (data: {
  startDate: Date;
  endDate: Date;
  rent: number;
  deposit: number;
  propertyId: number;
  tenantCognitoId: string;
}) => {
  return await prisma.lease.create({
    data: {
      startDate: data.startDate,
      endDate: data.endDate,
      rent: data.rent,
      deposit: data.deposit,
      propertyId: data.propertyId,
      tenantCognitoId: data.tenantCognitoId,
    },
  });
};

export const connectTenantToProperty = async (
  propertyId: number,
  tenantCognitoId: string
) => {
  return await prisma.property.update({
    where: { id: propertyId },
    data: {
      tenants: {
        connect: { cognitoId: tenantCognitoId },
      },
    },
  });
};

export const updateApplication = async (id: number, data: any) => {
  return await prisma.application.update({
    where: { id },
    data,
    include: {
      property: true,
      tenant: true,
      lease: true,
    },
  });
};

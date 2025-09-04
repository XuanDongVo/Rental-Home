import { ApplicationStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getLeaseDetailByPropertyId = async (
  propertyId: number,
  cognitoId: string
) => {
  const leases = await prisma.lease.findMany({
    where: {
      propertyId: propertyId,
      tenant: {
        cognitoId: cognitoId,
      },
    },
    include: {
      property: {
        include: {
          location: true,
          manager: true,
        },
      },
      tenant: true,
      payments: {
        orderBy: {
          dueDate: "desc",
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });
  return leases;
};

export const getLeasesByPropertyId = async (propertyId: number) => {
  const leases = await prisma.lease.findMany({
    where: {
      propertyId: propertyId,
    },
    include: {
      property: {
        include: {
          location: true,
          manager: true,
        },
      },
      tenant: true,
      payments: {
        orderBy: {
          dueDate: "desc",
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });
  return leases;
};

export const getLeasesByManagerId = async (managerCognitoId: string) => {
  const leases = await prisma.lease.findMany({
    where: {
      property: {
        managerCognitoId: managerCognitoId,
      },
    },
    include: {
      property: {
        include: {
          location: true,
          manager: true,
        },
      },
      tenant: true,
      payments: {
        orderBy: {
          dueDate: "desc",
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });
  return leases;
};

export const getLeasesByTenantId = async (tenantCognitoId: string) => {
  const leases = await prisma.lease.findMany({
    where: {
      tenant: {
        cognitoId: tenantCognitoId,
      },
    },
    include: {
      property: {
        include: {
          location: true,
          manager: true,
        },
      },
      tenant: true,
      payments: {
        orderBy: {
          dueDate: "desc",
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });
  return leases;
};

export const getLeaseById = async (leaseId: number) => {
  const lease = await prisma.lease.findUnique({
    where: {
      id: leaseId,
    },
    include: {
      property: {
        include: {
          location: true,
          manager: true,
        },
      },
      tenant: true,
      payments: {
        orderBy: {
          dueDate: "desc",
        },
      },
    },
  });
  return lease;
};

export const createLease = async (leaseData: {
  propertyId: number;
  tenantCognitoId: string;
  startDate: Date;
  endDate: Date;
  rent: number;
  deposit: number;
}) => {
  const lease = await prisma.lease.create({
    data: leaseData,
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
  return lease;
};

export const updateLeaseStatus = async (
  leaseId: number,
  status: string,
  terminationDate?: Date,
  terminationReason?: string
) => {
  const updateData: any = { status };

  if (terminationDate) {
    updateData.terminationDate = terminationDate;
  }

  if (terminationReason) {
    updateData.terminationReason = terminationReason;
  }

  const lease = await prisma.lease.update({
    where: {
      id: leaseId,
    },
    data: updateData,
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
  return lease;
};

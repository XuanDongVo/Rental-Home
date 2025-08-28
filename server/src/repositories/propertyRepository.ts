import { PrismaClient, Prisma } from "@prisma/client";
import { Location } from "@prisma/client";

const prisma = new PrismaClient();

export const getProperties = async (whereConditions: Prisma.Sql[]) => {
  const completeQuery = Prisma.sql`
    SELECT 
      p.*,
      json_build_object(
        'id', l.id,
        'address', l.address,
        'city', l.city,
        'state', l.state,
        'country', l.country,
        'postalCode', l."postalCode",
        'coordinates', json_build_object(
          'longitude', ST_X(l."coordinates"::geometry),
          'latitude', ST_Y(l."coordinates"::geometry)
        )
      ) as location
    FROM "Property" p
    JOIN "Location" l ON p."locationId" = l.id
    ${
      whereConditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`
        : Prisma.empty
    }
  `;
  return await prisma.$queryRaw(completeQuery);
};

export const getPropertyById = async (id: number) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      location: true,
      applications: true,
      leases: true,
    },
  });
  return property;
};

export const getLocationCoordinates = async (locationId: number) => {
  return await prisma.$queryRaw<{ coordinates: string }[]>`
    SELECT ST_AsText(coordinates) as coordinates FROM "Location" WHERE id = ${locationId}
  `;
};

export const createLocation = async (
  address: string,
  city: string,
  state: string,
  country: string,
  postalCode: string,
  longitude: number,
  latitude: number
) => {
  return await prisma.$queryRaw<Location[]>`
    INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
    VALUES (${address}, ${city}, ${state}, ${country}, ${postalCode}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
    RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
  `;
};

export const createProperty = async (data: any) => {
  return await prisma.property.create({
    data,
    include: { location: true, manager: true },
  });
};

export const updateProperty = async (id: number, data: any) => {
  return await prisma.property.update({
    where: { id },
    data,
    include: { location: true },
  });
};

export const updateLocation = async (
  locationId: number,
  address: string,
  city: string,
  state: string,
  country: string,
  postalCode: string,
  longitude: number,
  latitude: number
) => {
  return await prisma.$queryRaw<Location[]>`
    UPDATE "Location"
    SET address = ${address}, city = ${city}, state = ${state}, country = ${country}, "postalCode" = ${postalCode}, coordinates = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
    WHERE id = ${locationId}
    RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) AS coordinates;
  `;
};

export const findPropertyWithLeasesAndApplications = async (id: number) => {
  return await prisma.property.findUnique({
    where: { id },
    include: { leases: true, applications: true },
  });
};

export const softDeleteProperty = async (id: number) => {
  return await prisma.property.update({
    where: { id },
    data: { isDeleted: true },
  });
};

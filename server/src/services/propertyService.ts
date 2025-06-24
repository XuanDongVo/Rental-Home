import { wktToGeoJSON } from "@terraformer/wkt";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import axios from "axios";
import * as propertyRepository from "../repositories/propertyRepository";
import { Prisma } from "@prisma/client";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION,
});

export const getProperties = async (query: any) => {
  const {
    favoriteIds,
    priceMin,
    priceMax,
    beds,
    baths,
    propertyType,
    squareFeetMin,
    squareFeetMax,
    amenities,
    availableFrom,
    latitude,
    longitude,
  } = query;

  let whereConditions: Prisma.Sql[] = [];

  if (favoriteIds) {
    const favoriteIdsArray = (favoriteIds as string).split(",").map(Number);
    whereConditions.push(
      Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
    );
  }

  if (priceMin) {
    whereConditions.push(Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`);
  }

  if (priceMax) {
    whereConditions.push(Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`);
  }

  if (beds && beds !== "any") {
    whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
  }

  if (baths && baths !== "any") {
    whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
  }

  if (squareFeetMin) {
    whereConditions.push(
      Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`
    );
  }

  if (squareFeetMax) {
    whereConditions.push(
      Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`
    );
  }

  if (propertyType && propertyType !== "any") {
    whereConditions.push(
      Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`
    );
  }

  if (amenities && amenities !== "any") {
    const amenitiesArray = (amenities as string).split(",");
    whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}`);
  }

  if (availableFrom && availableFrom !== "any") {
    const availableFromDate =
      typeof availableFrom === "string" ? availableFrom : null;
    if (availableFromDate) {
      const date = new Date(availableFromDate);
      if (!isNaN(date.getTime())) {
        whereConditions.push(
          Prisma.sql`EXISTS (
            SELECT 1 FROM "Lease" l 
            WHERE l."propertyId" = p.id 
            AND l."startDate" <= ${date.toISOString()}
          )`
        );
      }
    }
  }

  if (latitude && longitude) {
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const radiusInKilometers = 1000;
    const degrees = radiusInKilometers / 111;

    whereConditions.push(
      Prisma.sql`ST_DWithin(
        l.coordinates::geometry,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${degrees}
      )`
    );
  }

  whereConditions.push(Prisma.sql`p."isDeleted" = false`);

  return await propertyRepository.getProperties(whereConditions);
};

export const getProperty = async (id: number) => {
  const property = await propertyRepository.getPropertyById(id);
  if (!property) return null;

  const coordinates = await propertyRepository.getLocationCoordinates(
    property.location.id
  );
  const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");
  const longitude = geoJSON.coordinates[0];
  const latitude = geoJSON.coordinates[1];

  return {
    ...property,
    location: {
      ...property.location,
      coordinates: { longitude, latitude },
    },
  };
};

export const createProperty = async (
  data: any,
  files: Express.Multer.File[]
) => {
  const {
    address,
    city,
    state,
    country,
    postalCode,
    managerCognitoId,
    ...propertyData
  } = data;

  const photoUrls =
    files && files.length > 0
      ? await Promise.all(
          files.map(async (file) => {
            const uploadParams = {
              Bucket: process.env.S3_BUCKET_NAME!,
              Key: `properties/${Date.now()}-${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype,
            };

            const uploadResult = await new Upload({
              client: s3Client,
              params: uploadParams,
            }).done();

            return uploadResult.Location as string;
          })
        )
      : [];

  const normalizedAddress = address.toLowerCase();
  const normalizedCity = city.toLowerCase();
  const normalizedState = state.toLowerCase();
  const fullQueryAddress =
    normalizedAddress.includes(normalizedCity) &&
    normalizedAddress.includes(normalizedState)
      ? `${address}, ${country}`
      : `${address}, ${city}, ${state}, ${country}`;

  const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
    {
      q: fullQueryAddress,
      format: "json",
      limit: "1",
    }
  ).toString()}`;

  const geocodingResponse = await axios.get(geocodingUrl, {
    headers: { "User-Agent": "RealEstateApp (voxuandong1405@gmail.com)" },
  });

  const [longitude, latitude] =
    geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
      ? [
          parseFloat(geocodingResponse.data[0].lon),
          parseFloat(geocodingResponse.data[0].lat),
        ]
      : [0, 0];

  const [location] = await propertyRepository.createLocation(
    address,
    city,
    state,
    country,
    postalCode,
    longitude,
    latitude
  );

  return await propertyRepository.createProperty({
    ...propertyData,
    photoUrls,
    locationId: location.id,
    managerCognitoId,
    amenities:
      typeof propertyData.amenities === "string"
        ? propertyData.amenities.split(",")
        : [],
    highlights:
      typeof propertyData.highlights === "string"
        ? propertyData.highlights.split(",")
        : [],
    isPetsAllowed: propertyData.isPetsAllowed === "true",
    isParkingIncluded: propertyData.isParkingIncluded === "true",
    pricePerMonth: parseFloat(propertyData.pricePerMonth),
    securityDeposit: parseFloat(propertyData.securityDeposit),
    applicationFee: parseFloat(propertyData.applicationFee),
    beds: parseInt(propertyData.beds),
    baths: parseFloat(propertyData.baths),
    squareFeet: parseInt(propertyData.squareFeet),
  });
};

export const deleteProperty = async (id: number) => {
  const currentDate = new Date();
  const property =
    await propertyRepository.findPropertyWithLeasesAndApplications(id);

  if (!property) {
    throw { status: 404, message: "Property not found" };
  }

  if (property.applications.length > 0) {
    throw {
      status: 400,
      message: "Cannot delete property because it has related applications.",
    };
  }

  if (property.leases.length > 0) {
    const hasActiveLease = property.leases.some((lease) => {
      const endDate = new Date(lease.endDate);
      return endDate >= currentDate;
    });

    if (hasActiveLease) {
      throw {
        status: 400,
        message: "Cannot delete property because there are active leases.",
      };
    }
  }

  await propertyRepository.softDeleteProperty(id);
};

export const updateProperty = async (
  id: number,
  data: any,
  files: Express.Multer.File[]
) => {
  const {
    address,
    city,
    state,
    country,
    postalCode,
    managerCognitoId,
    ...propertyData
  } = data;

  const property = await propertyRepository.getPropertyById(id);
  if (!property) {
    throw { status: 404, message: "Property not found" };
  }

  const photoUrls =
    files && files.length > 0
      ? await Promise.all(
          files.map(async (file) => {
            const uploadParams = {
              Bucket: process.env.S3_BUCKET_NAME!,
              Key: `properties/${Date.now()}-${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype,
            };

            const uploadResult = await new Upload({
              client: s3Client,
              params: uploadParams,
            }).done();

            return uploadResult.Location as string;
          })
        )
      : [];

  const normalizedAddress = address.toLowerCase();
  const normalizedCity = city.toLowerCase();
  const normalizedState = state.toLowerCase();
  const fullQueryAddress =
    normalizedAddress.includes(normalizedCity) &&
    normalizedAddress.includes(normalizedState)
      ? `${address}, ${country}`
      : `${address}, ${city}, ${state}, ${country}`;

  const hasAddressChanged =
    property.location.address !== address ||
    property.location.city !== city ||
    property.location.state !== state ||
    property.location.country !== country;

  if (hasAddressChanged) {
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
      {
        q: fullQueryAddress,
        format: "json",
        limit: "1",
      }
    ).toString()}`;

    const geocodingResponse = await axios.get(geocodingUrl, {
      headers: { "User-Agent": "RealEstateApp (voxuandong1405@gmail.com)" },
    });

    const longitude = parseFloat(geocodingResponse.data[0]?.lon || 0);
    const latitude = parseFloat(geocodingResponse.data[0]?.lat || 0);

    await propertyRepository.updateLocation(
      property.location.id,
      address,
      city,
      state,
      country,
      postalCode,
      longitude,
      latitude
    );
  }

  return await propertyRepository.updateProperty(id, {
    ...propertyData,
    managerCognitoId,
    amenities:
      typeof propertyData.amenities === "string"
        ? propertyData.amenities.split(",")
        : [],
    highlights:
      typeof propertyData.highlights === "string"
        ? propertyData.highlights.split(",")
        : [],
    isPetsAllowed: propertyData.isPetsAllowed === "true",
    isParkingIncluded: propertyData.isParkingIncluded === "true",
    pricePerMonth: parseFloat(propertyData.pricePerMonth),
    securityDeposit: parseFloat(propertyData.securityDeposit),
    applicationFee: parseFloat(propertyData.applicationFee),
    beds: parseInt(propertyData.beds),
    baths: parseFloat(propertyData.baths),
    squareFeet: parseInt(propertyData.squareFeet),
    ...(photoUrls.length > 0 && { photoUrls }),
  });
};

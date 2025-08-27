"use client";

import { CustomFormField } from "@/components/FormField";
import Header from "@/components/Header";
import { Form } from "@/components/ui/form";
import { PropertyFormData, propertySchema } from "@/lib/schemas";
import { useCreatePropertyMutation, useUpdatePropertyMutation, useGetAuthUserQuery } from "@/state/api";
import { AmenityEnum, HighlightEnum, PropertyTypeEnum } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Property } from "@/types/prismaTypes";

interface PropertyFormProps {
    mode: "create" | "edit";
    property?: Property; // Chỉ có khi mode = "edit"
    onSuccess?: () => void; // Callback khi submit thành công
}

const PropertyForm: React.FC<PropertyFormProps> = ({ mode, property, onSuccess }) => {
    const [createProperty] = useCreatePropertyMutation();
    const [updateProperty] = useUpdatePropertyMutation();
    const { data: authUser } = useGetAuthUserQuery();

    // Dynamic title based on mode
    const title = mode === "create" ? "Add New Property" : `Edit Property: ${property?.name || ""}`;
    const subtitle = mode === "create"
        ? "Create a new property listing with detailed information"
        : "Update property information and details";

    const form = useForm<PropertyFormData>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            name: property?.name || "",
            description: property?.description || "",
            pricePerMonth: property?.pricePerMonth || 1000,
            securityDeposit: property?.securityDeposit || 500,
            applicationFee: property?.applicationFee || 100,
            isPetsAllowed: property?.isPetsAllowed ?? true,
            isParkingIncluded: property?.isParkingIncluded ?? true,
            photoUrls: [], // Always empty for file upload
            amenities: property?.amenities?.join(",") || "",
            highlights: property?.highlights?.join(",") || "",
            beds: property?.beds || 1,
            baths: property?.baths || 1,
            squareFeet: property?.squareFeet || 1000,
            propertyType: property?.propertyType || undefined,
            address: property?.location?.address || "",
            city: property?.location?.city || "",
            state: property?.location?.state || "",
            country: property?.location?.country || "",
            postalCode: property?.location?.postalCode || "",
        },
    });

    const onSubmit = async (data: PropertyFormData) => {
        if (!authUser?.cognitoInfo?.userId) {
            throw new Error("No manager ID found");
        }

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key === "photoUrls") {
                const files = value as File[];
                files.forEach((file: File) => {
                    formData.append("photos", file);
                });
            } else if (Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, String(value));
            }
        });

        formData.append("managerCognitoId", authUser.cognitoInfo.userId);

        try {
            if (mode === "create") {
                await createProperty(formData).unwrap();
            } else if (mode === "edit" && property) {
                await updateProperty({ id: property.id, formData }).unwrap();
            }

            // Call success callback if provided
            onSuccess?.();
        } catch (error) {
            console.error(`Failed to ${mode} property:`, error);
        }
    };

    // Location selection logic (same as before)
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    const [selectedCountry, setSelectedCountry] = useState(property?.location?.country || "");
    const [selectedState, setSelectedState] = useState(property?.location?.state || "");
    const [selectedCity, setSelectedCity] = useState(property?.location?.city || "");

    useEffect(() => {
        axios
            .get("https://countriesnow.space/api/v0.1/countries/positions")
            .then((res) => {
                const countryList = res.data.data.map((item: { name: string }) => item.name as string);
                setCountries(countryList);
            });
    }, []);

    // Load states if country is pre-selected (edit mode)
    useEffect(() => {
        if (selectedCountry && mode === "edit") {
            axios
                .post("https://countriesnow.space/api/v0.1/countries/states", { country: selectedCountry })
                .then((res) => {
                    const stateList = res.data.data.states.map((item: { name: string }) => item.name);
                    setStates(stateList);
                });
        }
    }, [selectedCountry, mode]);

    // Load cities if state is pre-selected (edit mode)
    useEffect(() => {
        if (selectedState && selectedCountry && mode === "edit") {
            axios
                .post("https://countriesnow.space/api/v0.1/countries/state/cities", {
                    country: selectedCountry,
                    state: selectedState,
                })
                .then((res) => {
                    setCities(res.data.data);
                });
        }
    }, [selectedState, selectedCountry, mode]);

    const handleCountryChange = (e: any) => {
        const country = e.target.value;
        setSelectedCountry(country);
        form.setValue("country", country);

        setSelectedState("");
        setSelectedCity("");
        form.setValue("state", "");
        form.setValue("city", "");

        setStates([]);
        setCities([]);

        if (country) {
            axios
                .post("https://countriesnow.space/api/v0.1/countries/states", { country })
                .then((res) => {
                    const stateList = res.data.data.states.map((item: { name: string }) => item.name);
                    setStates(stateList);
                });
        }
    };

    const handleStateChange = (e: any) => {
        const state = e.target.value;
        setSelectedState(state);
        form.setValue("state", state);
        setSelectedCity("");
        form.setValue("city", "");
        setCities([]);

        if (state) {
            axios
                .post("https://countriesnow.space/api/v0.1/countries/state/cities", {
                    country: selectedCountry,
                    state,
                })
                .then((res) => {
                    setCities(res.data.data);
                });
        }
    };

    const handleCityChange = (e: any) => {
        const city = e.target.value;
        setSelectedCity(city);
        form.setValue("city", city);
    };

    return (
        <div className="dashboard-container">
            <Header title={title} subtitle={subtitle} />
            <div className="bg-white rounded-xl p-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="p-4 space-y-10"
                    >
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                            <div className="space-y-4">
                                <CustomFormField name="name" label="Property Name" />
                                <CustomFormField
                                    name="description"
                                    label="Description"
                                    type="textarea"
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-gray-200" />

                        {/* Fees */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold mb-4">Fees</h2>
                            <CustomFormField
                                name="pricePerMonth"
                                label="Price per Month"
                                type="number"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomFormField
                                    name="securityDeposit"
                                    label="Security Deposit"
                                    type="number"
                                />
                                <CustomFormField
                                    name="applicationFee"
                                    label="Application Fee"
                                    type="number"
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-gray-200" />

                        {/* Property Details */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold mb-4">Property Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <CustomFormField
                                    name="beds"
                                    label="Number of Beds"
                                    type="number"
                                />
                                <CustomFormField
                                    name="baths"
                                    label="Number of Baths"
                                    type="number"
                                />
                                <CustomFormField
                                    name="squareFeet"
                                    label="Square Feet"
                                    type="number"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <CustomFormField
                                    name="isPetsAllowed"
                                    label="Pets Allowed"
                                    type="switch"
                                />
                                <CustomFormField
                                    name="isParkingIncluded"
                                    label="Parking Included"
                                    type="switch"
                                />
                            </div>
                            <div className="mt-4">
                                <CustomFormField
                                    name="propertyType"
                                    label="Property Type"
                                    type="select"
                                    options={Object.keys(PropertyTypeEnum).map((type) => ({
                                        value: type,
                                        label: type,
                                    }))}
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-gray-200" />

                        {/* Amenities and Highlights */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">
                                Amenities and Highlights
                            </h2>
                            <div className="space-y-6">
                                <CustomFormField
                                    name="amenities"
                                    label="Amenities"
                                    type="select"
                                    options={Object.keys(AmenityEnum).map((amenity) => ({
                                        value: amenity,
                                        label: amenity,
                                    }))}
                                />
                                <CustomFormField
                                    name="highlights"
                                    label="Highlights"
                                    type="select"
                                    options={Object.keys(HighlightEnum).map((highlight) => ({
                                        value: highlight,
                                        label: highlight,
                                    }))}
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-gray-200" />

                        {/* Photos */}
                        <div>
                            <h2 className="text-lg font-semibold mb-4">Photos</h2>
                            <CustomFormField
                                name="photoUrls"
                                label="Property Photos"
                                type="file"
                                accept="image/*"
                                currentPhotos={mode === "edit" ? property?.photoUrls : undefined}
                            />
                        </div>

                        <hr className="my-6 border-gray-200" />

                        {/* Additional Information */}
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold mb-4">Additional Information</h2>

                            {/* Country Select */}
                            <div>
                                <label className="block mb-1">Country</label>
                                <select
                                    value={selectedCountry}
                                    onChange={handleCountryChange}
                                    className="w-full border px-3 py-2 rounded"
                                >
                                    <option value="">Select Country</option>
                                    {countries.map((country) => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>

                            {/* State Select */}
                            <div>
                                <label className="block mb-1">State</label>
                                <select
                                    value={selectedState}
                                    onChange={handleStateChange}
                                    disabled={!selectedCountry}
                                    className="w-full border px-3 py-2 rounded disabled:opacity-50"
                                >
                                    <option value="">{selectedCountry ? "Select State" : "Select Country first"}</option>
                                    {states.map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>

                            {/* City Select */}
                            <div>
                                <label className="block mb-1">City</label>
                                <select
                                    value={selectedCity}
                                    onChange={handleCityChange}
                                    disabled={!selectedState}
                                    className="w-full border px-3 py-2 rounded disabled:opacity-50"
                                >
                                    <option value="">{selectedState ? "Select City" : "Select State first"}</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>

                            <CustomFormField name="address" label="Address" />
                            <CustomFormField name="postalCode" label="Postal Code" />
                        </div>

                        <Button
                            type="submit"
                            className="bg-primary-700 text-white w-full mt-8"
                        >
                            {mode === "create" ? "Create Property" : "Update Property"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default PropertyForm;

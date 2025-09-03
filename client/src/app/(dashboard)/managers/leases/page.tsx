"use client";

import React, { useState } from "react";
import Loading from "@/components/Loading";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    useGetAuthUserQuery,
    useGetLeasesQuery,
} from "@/state/api";
import { Lease } from "@/types/prismaTypes";
import {
    MapPin,
    Calendar,
    DollarSign,
    User,
    Eye,
    Building,
    Search,
    Filter,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

const getLeaseStatusColor = (lease: Lease) => {
    const now = new Date();
    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);

    if (now < startDate) {
        return "bg-blue-100 text-blue-800 border-blue-300";
    } else if (now >= startDate && now <= endDate) {
        return "bg-green-100 text-green-800 border-green-300";
    } else {
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
};

const getLeaseStatusText = (lease: Lease) => {
    const now = new Date();
    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);

    if (now < startDate) {
        return "Upcoming";
    } else if (now >= startDate && now <= endDate) {
        return "Active";
    } else {
        return "Expired";
    }
};

const isLeaseActive = (lease: Lease) => {
    const now = new Date();
    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);
    return now >= startDate && now <= endDate;
};

const ManagerLeases = () => {
    const { data: authUser } = useGetAuthUserQuery();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const {
        data: leases,
        isLoading,
        error,
    } = useGetLeasesQuery(
        parseInt(authUser?.cognitoInfo?.userId || "0"),
        { skip: !authUser?.cognitoInfo?.userId }
    );

    if (isLoading) return <Loading />;
    if (error) return <div>Error loading leases</div>;

    // Filter leases based on search and status
    const filteredLeases = leases?.filter(lease => {
        const matchesSearch =
            lease.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lease.tenant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lease.tenant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lease.property.location?.address?.toLowerCase().includes(searchTerm.toLowerCase());

        if (statusFilter === "all") return matchesSearch;

        const status = getLeaseStatusText(lease).toLowerCase();
        return matchesSearch && status === statusFilter;
    }) || [];

    const activeLeases = leases?.filter(lease => isLeaseActive(lease)).length || 0;
    const upcomingLeases = leases?.filter(lease => {
        const now = new Date();
        const startDate = new Date(lease.startDate);
        return now < startDate;
    }).length || 0;
    const expiredLeases = leases?.filter(lease => {
        const now = new Date();
        const endDate = new Date(lease.endDate);
        return now > endDate;
    }).length || 0;

    return (
        <div className="dashboard-container">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600">
                    <h1 className="text-2xl font-bold text-white">
                        Lease Management
                    </h1>
                    <p className="text-primary-100 mt-1">
                        Manage all lease agreements across your properties
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!leases || leases.length === 0 ? (
                        <div className="text-center py-12">
                            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <div className="text-gray-400 text-lg mb-2">
                                No lease agreements found
                            </div>
                            <p className="text-gray-500 mb-4">
                                Leases will appear here once tenants sign agreements for your properties
                            </p>
                            <Link href="/managers/properties">
                                <Button className="bg-primary-600 hover:bg-primary-700">
                                    Manage Properties
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Statistics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="text-green-600 text-sm font-medium">Active Leases</div>
                                    <div className="text-green-800 text-2xl font-bold">{activeLeases}</div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="text-blue-600 text-sm font-medium">Upcoming</div>
                                    <div className="text-blue-800 text-2xl font-bold">{upcomingLeases}</div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="text-gray-600 text-sm font-medium">Expired</div>
                                    <div className="text-gray-800 text-2xl font-bold">{expiredLeases}</div>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="text-purple-600 text-sm font-medium">Total Leases</div>
                                    <div className="text-purple-800 text-2xl font-bold">{leases.length}</div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search by property, tenant, or address..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-500" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                            </div>

                            {/* Leases Table */}
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Property</TableHead>
                                            <TableHead>Tenant</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead>Lease Period</TableHead>
                                            <TableHead>Monthly Rent</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLeases.map((lease) => (
                                            <TableRow key={lease.id} className="h-20">
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                                                            <span className="text-primary-700 font-semibold text-lg">
                                                                {lease.property.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                {lease.property.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {lease.property.propertyType}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {lease.tenant?.firstName} {lease.tenant?.lastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {lease.tenant?.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        {lease.property.location?.address || "N/A"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm space-y-1">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                                                            <span className="font-medium">From:</span>
                                                            <span className="ml-1">
                                                                {new Date(lease.startDate).toLocaleDateString("en-US")}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                                                            <span className="font-medium">To:</span>
                                                            <span className="ml-1">
                                                                {new Date(lease.endDate).toLocaleDateString("en-US")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-green-600 font-semibold">
                                                        <DollarSign className="w-4 h-4 mr-1" />
                                                        {lease.rent}/month
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${getLeaseStatusColor(lease)} border`}
                                                    >
                                                        {getLeaseStatusText(lease)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Link href={`/managers/properties/${lease.property.id}`}>
                                                            <Button size="sm" variant="outline">
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {filteredLeases.length === 0 && (searchTerm || statusFilter !== "all") && (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 text-lg mb-2">
                                        No leases match your filters
                                    </div>
                                    <p className="text-gray-500">
                                        Try adjusting your search terms or filters
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerLeases;

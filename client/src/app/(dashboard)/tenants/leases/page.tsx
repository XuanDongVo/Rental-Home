"use client";

import React, { useState } from "react";
import Loading from "@/components/Loading";
import TerminateLeaseModal from "@/components/TerminateLeaseModal";
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
    XCircle,
    Eye,
    Home,
} from "lucide-react";
import Link from "next/link";

const getLeaseStatusColor = (lease: Lease) => {
    // Giả lập logic status dựa trên ngày
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
        return "Sắp bắt đầu";
    } else if (now >= startDate && now <= endDate) {
        return "Đang hoạt động";
    } else {
        return "Đã hết hạn";
    }
};

const isLeaseActive = (lease: Lease) => {
    const now = new Date();
    const startDate = new Date(lease.startDate);
    const endDate = new Date(lease.endDate);
    return now >= startDate && now <= endDate;
};

const LeasesList = () => {
    const { data: authUser } = useGetAuthUserQuery();
    const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
    const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);

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

    const handleTerminate = (lease: Lease) => {
        setSelectedLease(lease);
        setIsTerminateModalOpen(true);
    };

    const handleTerminateSuccess = () => {
        setSelectedLease(null);
        console.log("Terminate request sent successfully");
    };

    return (
        <div className="dashboard-container">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600">
                    <h1 className="text-2xl font-bold text-white">
                        Danh sách hợp đồng thuê
                    </h1>
                    <p className="text-primary-100 mt-1">
                        Quản lý tất cả hợp đồng thuê của bạn
                    </p>
                </div>

                {/* Leases Table */}
                <div className="p-6">
                    {!leases || leases.length === 0 ? (
                        <div className="text-center py-12">
                            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <div className="text-gray-400 text-lg mb-2">
                                Bạn chưa có hợp đồng thuê nào
                            </div>
                            <p className="text-gray-500 mb-4">
                                Hãy tìm kiếm và ứng tuyển thuê nhà để có hợp đồng đầu tiên
                            </p>
                            <Link href="/search">
                                <Button className="bg-primary-600 hover:bg-primary-700">
                                    Tìm kiếm nhà thuê
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="text-green-600 text-sm font-medium">Đang hoạt động</div>
                                    <div className="text-green-800 text-2xl font-bold">
                                        {leases.filter(lease => isLeaseActive(lease)).length}
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="text-blue-600 text-sm font-medium">Tổng hợp đồng</div>
                                    <div className="text-blue-800 text-2xl font-bold">
                                        {leases.length}
                                    </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="text-gray-600 text-sm font-medium">Đã kết thúc</div>
                                    <div className="text-gray-800 text-2xl font-bold">
                                        {leases.filter(lease => !isLeaseActive(lease) && new Date() > new Date(lease.endDate)).length}
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bất động sản</TableHead>
                                            <TableHead>Địa chỉ</TableHead>
                                            <TableHead>Thời gian thuê</TableHead>
                                            <TableHead>Tiền thuê</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leases.map((lease) => (
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
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        {lease.property.location?.address || "N/A"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm space-y-1">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                                                            <span className="font-medium">Từ:</span>
                                                            <span className="ml-1">
                                                                {new Date(lease.startDate).toLocaleDateString("vi-VN")}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                                                            <span className="font-medium">Đến:</span>
                                                            <span className="ml-1">
                                                                {new Date(lease.endDate).toLocaleDateString("vi-VN")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-green-600 font-semibold">
                                                        <DollarSign className="w-4 h-4 mr-1" />
                                                        ${lease.rent}/tháng
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
                                                        <Link href={`/tenants/residences/${lease.property.id}`}>
                                                            <Button size="sm" variant="outline">
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                Xem
                                                            </Button>
                                                        </Link>
                                                        {isLeaseActive(lease) && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleTerminate(lease)}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                Chấm dứt
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Terminate Lease Modal */}
            {selectedLease && (
                <TerminateLeaseModal
                    isOpen={isTerminateModalOpen}
                    onClose={() => {
                        setIsTerminateModalOpen(false);
                        setSelectedLease(null);
                    }}
                    lease={selectedLease}
                    onSuccess={handleTerminateSuccess}
                />
            )}
        </div>
    );
};

export default LeasesList;

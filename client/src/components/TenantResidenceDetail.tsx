"use client";

import Image from "next/image";
import Loading from "@/components/Loading";
import TerminateLeaseModal from "@/components/TerminateLeaseModal";
import TenantPaymentInterface from "@/components/TenantPaymentInterface";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    useGetAuthUserQuery,
    useGetPropertyQuery,
    useGetCurrentLeaseByPropertyQuery,
    useGetPaymentsByPropertyQuery,
    useGetCurrentMonthPaymentStatusByPropertyQuery,
} from "@/state/api";
import { Lease, Payment, Property } from "@/types/prismaTypes";
import {
    ArrowDownToLineIcon,
    Check,
    CreditCard,
    Download,
    Edit,
    FileText,
    Mail,
    MapPin,
    User,
    XCircle,
    Calendar,
    DollarSign,
    AlertTriangle,
    Clock,
    CheckCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";

const PaymentStatus = ({
    currentPayment,
    lease,
    onOpenPayment
}: {
    currentPayment: any;
    lease: Lease;
    onOpenPayment: () => void;
}) => {
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            "Paid": { className: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
            "Pending": { className: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
            "PartiallyPaid": { className: "bg-blue-100 text-blue-800 border-blue-300", icon: DollarSign },
            "Overdue": { className: "bg-red-100 text-red-800 border-red-300", icon: AlertTriangle },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
        const Icon = config.icon;

        return (
            <Badge className={`${config.className} border`}>
                <Icon className="w-3 h-3 mr-1" />
                {status}
            </Badge>
        );
    };

    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    nextPaymentDate.setDate(new Date(lease.startDate).getDate());

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 mt-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Payment Status</h2>
                    <p className="text-gray-600">Manage your monthly rent payments</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={onOpenPayment}
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            View Payments
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Payment Management</DialogTitle>
                            <DialogDescription>
                                Manage your rent payments and view payment history
                            </DialogDescription>
                        </DialogHeader>
                        <TenantPaymentInterface
                            leaseId={lease.id}
                            tenantName="Current Tenant"
                            propertyName={lease.property?.name || "Property"}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Month Payment */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">This Month</h3>
                        {currentPayment && getStatusBadge(currentPayment.paymentStatus)}
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Amount Due:</span>
                            <span className="font-semibold">${lease.rent}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Due Date:</span>
                            <span className="font-semibold">
                                {new Date().toLocaleDateString()}
                            </span>
                        </div>
                        {currentPayment?.paymentStatus === "Paid" && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Paid Amount:</span>
                                <span className="font-semibold text-green-600">
                                    ${currentPayment.amountPaid}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Next Payment */}
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-blue-800">Next Payment</h3>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            <Calendar className="w-3 h-3 mr-1" />
                            Upcoming
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-blue-600">Amount:</span>
                            <span className="font-semibold text-blue-800">${lease.rent}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-blue-600">Due Date:</span>
                            <span className="font-semibold text-blue-800">
                                {nextPaymentDate.toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full text-green-700 border-green-300 hover:bg-green-100"
                                    size="sm"
                                >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Make Payment
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Make a Payment</DialogTitle>
                                    <DialogDescription>
                                        Pay your monthly rent securely
                                    </DialogDescription>
                                </DialogHeader>
                                <TenantPaymentInterface
                                    leaseId={lease.id}
                                    tenantName="Current Tenant"
                                    propertyName={lease.property?.name || "Property"}
                                />
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="outline"
                            className="w-full text-gray-700 border-gray-300 hover:bg-gray-100"
                            size="sm"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Payment History
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResidenceCard = ({
    property,
    currentLease,
    onTerminate,
}: {
    property: Property;
    currentLease: Lease;
    onTerminate: () => void;
}) => {
    // Tính toán next payment date (tháng tiếp theo)
    const calculateNextPaymentDate = (startDate: string): Date => {
        const today = new Date();
        const start = new Date(startDate);
        const nextPayment = new Date(start);

        // Tìm ngày thanh toán tiếp theo (cùng ngày trong tháng với start date)
        nextPayment.setFullYear(today.getFullYear());
        nextPayment.setMonth(today.getMonth());

        // Nếu ngày thanh toán trong tháng này đã qua, chuyển sang tháng sau
        if (nextPayment <= today) {
            nextPayment.setMonth(nextPayment.getMonth() + 1);
        }

        return nextPayment;
    };

    const nextPaymentDate = calculateNextPaymentDate(currentLease.startDate);
    const endDate = new Date(currentLease.endDate);
    const daysUntilEnd = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex gap-5">
                <div className="w-64 h-32 object-cover bg-slate-500 rounded-xl overflow-hidden flex items-center justify-center">
                    <Image
                        src={property.photoUrls?.[0] || "/placeholder.jpg"}
                        alt={property.name}
                        width={256}
                        height={128}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex flex-col justify-between">
                    <div>
                        <div className="bg-green-500 w-fit text-white px-4 py-1 rounded-full text-sm font-semibold">
                            Active Leases
                        </div>

                        <h2 className="text-2xl font-bold my-2">{property.name}</h2>
                        <div className="flex items-center mb-2">
                            <MapPin className="w-5 h-5 mr-1" />
                            <span>
                                {property.location.city}, {property.location.country}
                            </span>
                        </div>
                    </div>
                    <div className="text-xl font-bold">
                        ${currentLease.rent}{" "}
                        <span className="text-gray-500 text-sm font-normal">/ month</span>
                    </div>
                </div>
            </div>

            {/* Lease Info */}
            <div className="my-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center mb-2">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-semibold text-blue-800">Lease Information</span>
                </div>
                <div className="text-sm text-gray-600">
                    <div className="mb-1">
                        <span className="font-medium">Remaining time:</span> {daysUntilEnd} days
                    </div>
                    <div>
                        <span className="font-medium">Contract duration:</span> 12 months
                    </div>
                </div>
            </div>

            {/* Dates */}
            <div>
                <hr className="my-4" />
                <div className="flex justify-between items-center">
                    <div className="xl:flex">
                        <div className="text-gray-500 mr-2">Start Date: </div>
                        <div className="font-semibold">
                            {new Date(currentLease.startDate).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="border-[0.5px] border-primary-300 h-4" />
                    <div className="xl:flex">
                        <div className="text-gray-500 mr-2">End Date: </div>
                        <div className="font-semibold">
                            {new Date(currentLease.endDate).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="border-[0.5px] border-primary-300 h-4" />
                    <div className="xl:flex">
                        <div className="text-gray-500 mr-2">Next Payment: </div>
                        <div className="font-semibold text-blue-600">
                            {nextPaymentDate.toLocaleDateString()}
                        </div>
                    </div>
                </div>
                <hr className="my-4" />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 w-full">
                <button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50">
                    <User className="w-5 h-5 mr-2" />
                    Manager
                </button>
                <button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50">
                    <Download className="w-5 h-5 mr-2" />
                    Download Agreement
                </button>
                <button
                    onClick={onTerminate}
                    className="bg-red-50 border border-red-300 text-red-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
                >
                    <XCircle className="w-5 h-5 mr-2" />
                    Terminate Lease
                </button>
            </div>
        </div>
    );
};

const BillingHistory = ({ payments }: { payments: Payment[] }) => {
    return (
        <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Billing History</h2>
                    <p className="text-sm text-gray-500">
                        Download your previous plan receipts and usage details.
                    </p>
                </div>
                <div>
                    <button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center hover:bg-primary-700 hover:text-primary-50">
                        <Download className="w-5 h-5 mr-2" />
                        <span>Download All</span>
                    </button>
                </div>
            </div>
            <hr className="mt-4 mb-1" />
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Billing Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment.id} className="h-16">
                                <TableCell className="font-medium">
                                    <div className="flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Invoice #{payment.id} -{" "}
                                        {new Date(payment.paymentDate).toLocaleString("default", {
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${payment.paymentStatus === "Paid"
                                            ? "bg-green-100 text-green-800 border-green-300"
                                            : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                            }`}
                                    >
                                        {payment.paymentStatus === "Paid" ? (
                                            <Check className="w-4 h-4 inline-block mr-1" />
                                        ) : null}
                                        {payment.paymentStatus}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>${payment.amountPaid.toFixed(2)}</TableCell>
                                <TableCell>
                                    <button className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center justify-center font-semibold hover:bg-primary-700 hover:text-primary-50">
                                        <ArrowDownToLineIcon className="w-4 h-4 mr-1" />
                                        Download
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

const Residence = () => {
    const { id } = useParams();
    const { data: authUser } = useGetAuthUserQuery();
    const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const {
        data: property,
        isLoading: propertyLoading,
        error: propertyError,
    } = useGetPropertyQuery(Number(id));

    // Try different ways to get user ID
    const userId = authUser?.cognitoInfo?.userId || authUser?.userInfo?.cognitoId;

    const { data: currentLease, isLoading: leasesLoading } = useGetCurrentLeaseByPropertyQuery(
        Number(id),
        { skip: !id }
    );
    const { data: payments, isLoading: paymentsLoading } = useGetPaymentsByPropertyQuery(
        Number(id),
        { skip: !id }
    );
    const { data: currentPaymentStatus, isLoading: paymentStatusLoading } = useGetCurrentMonthPaymentStatusByPropertyQuery(
        Number(id),
        { skip: !id }
    );

    const handleTerminateLease = () => {
        setIsTerminateModalOpen(true);
    };

    const handleTerminateModalClose = () => {
        setIsTerminateModalOpen(false);
    };

    const handleOpenPayment = () => {
        setIsPaymentModalOpen(true);
    };

    if (propertyLoading || leasesLoading || paymentsLoading || paymentStatusLoading) return <Loading />;
    if (!property || propertyError) return <div>Error loading property</div>;

    // Create mock lease if no current lease found
    let lease = currentLease;
    if (!lease) {
        lease = {
            id: 1,
            propertyId: property.id,
            tenantId: parseInt(userId || "1"),
            rent: property.pricePerMonth,
            startDate: new Date("2023-06-30").toISOString(),
            endDate: new Date("2024-06-29").toISOString(),
            status: "Active",
            securityDeposit: property.securityDeposit,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tenant: null,
            property: property,
            payments: [],
            terminationRequests: []
        } as Lease;
    }

    // Create mock payments if none exist
    let mockPayments = payments || [];
    if (!payments || payments.length === 0) {
        mockPayments = [
            {
                id: 1,
                leaseId: lease.id,
                amountDue: lease.rent,
                amountPaid: lease.rent,
                dueDate: new Date("2024-06-27").toISOString(),
                paymentDate: new Date("2024-06-27").toISOString(),
                paymentStatus: "Paid" as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lease: lease
            },
            {
                id: 2,
                leaseId: lease.id,
                amountDue: lease.rent,
                amountPaid: 0,
                dueDate: new Date("2024-07-27").toISOString(),
                paymentDate: new Date("2024-07-27").toISOString(),
                paymentStatus: "Pending" as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lease: lease
            }
        ] as Payment[];
    }

    return (
        <div className="dashboard-container">
            <div className="w-full mx-auto">
                <div className="mb-6">
                    <ResidenceCard
                        property={property}
                        currentLease={lease}
                        onTerminate={handleTerminateLease}
                    />
                </div>

                {/* Payment Status Section */}
                <PaymentStatus
                    currentPayment={currentPaymentStatus}
                    lease={lease}
                    onOpenPayment={handleOpenPayment}
                />

                <BillingHistory payments={mockPayments} />

                {/* Terminate Lease Modal */}
                {isTerminateModalOpen && (
                    <TerminateLeaseModal
                        isOpen={isTerminateModalOpen}
                        onClose={handleTerminateModalClose}
                        lease={lease}
                    // property={property}
                    />
                )}
            </div>
        </div>
    );
};

export default Residence;
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FileText, AlertTriangle } from 'lucide-react';
import TerminationPolicyManager from './TerminationPolicyManager';

interface PropertyTerminationSettingsProps {
    propertyId: string;
    managerId: string;
    propertyName: string;
}

const PropertyTerminationSettings: React.FC<PropertyTerminationSettingsProps> = ({
    propertyId,
    managerId,
    propertyName,
}) => {
    const [activeTab, setActiveTab] = useState('policies');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Settings className="w-6 h-6" />
                <div>
                    <h1 className="text-2xl font-bold">Termination Settings</h1>
                    <p className="text-muted-foreground">{propertyName}</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="policies" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Policies
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Termination Requests
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="policies" className="mt-6">
                    <TerminationPolicyManager
                        propertyId={propertyId}
                        managerId={managerId}
                    />
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                    <TerminationRequestList propertyId={propertyId} />
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    <TerminationAnalytics propertyId={propertyId} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Component để hiển thị danh sách termination requests
const TerminationRequestList: React.FC<{ propertyId: string }> = ({ propertyId }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Termination Requests</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    List of termination requests will be displayed here.
                </p>
                {/* TODO: Implement termination requests list */}
            </CardContent>
        </Card>
    );
};

// Component thống kê
const TerminationAnalytics: React.FC<{ propertyId: string }> = ({ propertyId }) => {
    return (
        <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Requests This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+20% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">75%</div>
                        <p className="text-xs text-muted-foreground">9/12 approved</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.3 days</div>
                        <p className="text-xs text-muted-foreground">Within limits</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Charts and detailed analytics will be displayed here.
                    </p>
                    {/* TODO: Implement charts and detailed analytics */}
                </CardContent>
            </Card>
        </div>
    );
};

export default PropertyTerminationSettings;

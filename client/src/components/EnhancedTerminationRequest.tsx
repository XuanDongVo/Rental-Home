"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, FileText, Calculator } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerminationPolicyCalculator from './TerminationPolicyCalculator';

interface EnhancedTerminationRequestProps {
    propertyId: string;
    leaseId: string;
    monthlyRent: number;
    onSubmit: (data: TerminationRequestData) => void;
    onCancel: () => void;
}

interface TerminationRequestData {
    requestedEndDate: string;
    reason: string;
    isEmergency: boolean;
    emergencyCategory?: string;
    additionalNotes?: string;
    calculatedPenalty: number;
    appliedPolicyId?: string;
    waivePenalty: boolean;
}

const EnhancedTerminationRequest: React.FC<EnhancedTerminationRequestProps> = ({
    propertyId,
    leaseId,
    monthlyRent,
    onSubmit,
    onCancel,
}) => {
    const [formData, setFormData] = useState<Partial<TerminationRequestData>>({
        requestedEndDate: '',
        reason: '',
        isEmergency: false,
        additionalNotes: '',
        calculatedPenalty: 0,
        waivePenalty: false,
    });

    const [policyCalculation, setPolicyCalculation] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('basic');

    const handleInputChange = (field: keyof TerminationRequestData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handlePolicyCalculated = useCallback((calculation: any) => {
        setPolicyCalculation(calculation);
        setFormData(prev => ({
            ...prev,
            calculatedPenalty: calculation.penaltyAmount,
            appliedPolicyId: calculation.appliedPolicy?.id,
        }));

        // Auto-switch to next tab if calculation is valid
        if (calculation.isValid && activeTab === 'basic') {
            setActiveTab('review');
        }
    }, [activeTab]);

    const handleSubmit = () => {
        if (!formData.requestedEndDate || !formData.reason) {
            alert('Please fill in all required information');
            return;
        }

        if (!policyCalculation?.isValid && !formData.isEmergency) {
            alert('There are errors in policy calculation. Please check again.');
            return;
        }

        onSubmit(formData as TerminationRequestData);
    };

    const canSubmit = formData.requestedEndDate &&
        formData.reason &&
        (policyCalculation?.isValid || formData.isEmergency);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <div>
                    <h1 className="text-2xl font-bold">Termination Request</h1>
                    <p className="text-muted-foreground">Fill in the information to submit a lease termination request</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Basic Information
                    </TabsTrigger>
                    <TabsTrigger value="policy" className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Penalty Calculation
                    </TabsTrigger>
                    <TabsTrigger value="review" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Review & Submit
                    </TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="endDate">Desired end date *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.requestedEndDate}
                                    onChange={(e) => handleInputChange('requestedEndDate', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div>
                                <Label htmlFor="reason">Reason for termination *</Label>
                                <Textarea
                                    id="reason"
                                    value={formData.reason}
                                    onChange={(e) => handleInputChange('reason', e.target.value)}
                                    placeholder="Please provide the reason for lease termination..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isEmergency"
                                    checked={formData.isEmergency}
                                    onCheckedChange={(checked) => handleInputChange('isEmergency', checked)}
                                />
                                <Label htmlFor="isEmergency">This is an emergency case</Label>
                            </div>

                            {formData.isEmergency && (
                                <div>
                                    <Label htmlFor="emergencyCategory">Emergency category</Label>
                                    <Input
                                        id="emergencyCategory"
                                        value={formData.emergencyCategory || ''}
                                        onChange={(e) => handleInputChange('emergencyCategory', e.target.value)}
                                        placeholder="e.g., Job loss, Medical emergency..."
                                    />
                                </div>
                            )}

                            <div>
                                <Label htmlFor="notes">Additional notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.additionalNotes}
                                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                                    placeholder="Additional information..."
                                    rows={2}
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setActiveTab('policy')}
                                    disabled={!formData.requestedEndDate || !formData.reason}
                                >
                                    Next: Calculate Penalty
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Policy Calculation Tab */}
                <TabsContent value="policy" className="space-y-6">
                    {formData.requestedEndDate ? (
                        <TerminationPolicyCalculator
                            propertyId={propertyId}
                            requestedEndDate={formData.requestedEndDate}
                            monthlyRent={monthlyRent}
                            onPolicyCalculated={handlePolicyCalculated}
                        />
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground">
                                    Please select desired end date to calculate penalty
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {policyCalculation && (
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setActiveTab('basic')}>
                                Back
                            </Button>
                            <Button
                                onClick={() => setActiveTab('review')}
                                disabled={!policyCalculation.isValid && !formData.isEmergency}
                            >
                                Next: Review
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Review Request Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">End date</div>
                                    <div className="text-base">{formData.requestedEndDate}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Request type</div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={formData.isEmergency ? "destructive" : "default"}>
                                            {formData.isEmergency ? "Emergency" : "Standard"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-muted-foreground">Reason</div>
                                <div className="text-base">{formData.reason}</div>
                            </div>

                            {formData.emergencyCategory && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Emergency category</div>
                                    <div className="text-base">{formData.emergencyCategory}</div>
                                </div>
                            )}

                            {policyCalculation && (
                                <div className="p-4 bg-muted rounded-lg">
                                    <div className="text-sm font-medium mb-2">Penalty information:</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Notice period:</span>
                                            <div className="font-medium">{policyCalculation.daysNotice} days</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Penalty rate:</span>
                                            <div className="font-medium">{policyCalculation.penaltyPercentage}%</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Penalty amount:</span>
                                            <div className="font-medium text-orange-600">
                                                {policyCalculation.penaltyAmount.toLocaleString('en-US')} VND
                                            </div>
                                        </div>
                                    </div>

                                    {policyCalculation.canWaiveForEmergency && formData.isEmergency && (
                                        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="waivePenalty"
                                                    checked={formData.waivePenalty}
                                                    onCheckedChange={(checked) => handleInputChange('waivePenalty', checked)}
                                                />
                                                <Label htmlFor="waivePenalty" className="text-sm">
                                                    Request penalty waiver (emergency case)
                                                </Label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.additionalNotes && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">Notes</div>
                                    <div className="text-base">{formData.additionalNotes}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setActiveTab('policy')}>
                            Back
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={!canSubmit}>
                                Submit Request
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default EnhancedTerminationRequest;

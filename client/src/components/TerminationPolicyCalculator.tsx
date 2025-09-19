"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useCalculateTerminationPenaltyMutation } from '@/state/api';

interface TerminationPolicyCalculatorProps {
    propertyId: string;
    leaseId: number;
    requestedEndDate: string;
    monthlyRent: number;
    onPolicyCalculated: (calculation: TerminationCalculation) => void;
}

const TerminationPolicyCalculator: React.FC<TerminationPolicyCalculatorProps> = ({
    propertyId,
    leaseId,
    requestedEndDate,
    monthlyRent,
    onPolicyCalculated,
}) => {
    const [calculation, setCalculation] = useState<TerminationCalculation | null>(null);
    const [calculatePenalty, { isLoading, error }] = useCalculateTerminationPenaltyMutation();

    const loadPoliciesAndCalculate = useCallback(async () => {
        try {
            const result = await calculatePenalty({
                propertyId,
                leaseId,
                requestedEndDate,
                monthlyRent,
            }).unwrap();

            setCalculation(result);
            onPolicyCalculated(result);
        } catch (error) {
            console.error('Error calculating termination penalty:', error);
            const errorResult: TerminationCalculation = {
                isValid: false,
                errors: ['Could not calculate termination penalty. Please try again.'],
                warnings: [],
                appliedPolicy: null,
                appliedRule: null,
                penaltyAmount: 0,
                penaltyPercentage: 0,
                daysNotice: 0,
                canWaiveForEmergency: false,
                emergencyCategories: [],
            };
            setCalculation(errorResult);
            onPolicyCalculated(errorResult);
        }
    }, [propertyId, requestedEndDate, monthlyRent, onPolicyCalculated, calculatePenalty]);

    useEffect(() => {
        loadPoliciesAndCalculate();
    }, [loadPoliciesAndCalculate]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-6">
                    <div className="text-center">Calculating...</div>
                </CardContent>
            </Card>
        );
    }

    if (!calculation) {
        return (
            <Card>
                <CardContent className="py-6">
                    <div className="text-center text-muted-foreground">
                        Unable to calculate policy
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Status Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {calculation.isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        Policy Evaluation Result
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Notice period: <strong>{calculation.daysNotice} days</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Penalty: <strong>{calculation.penaltyPercentage}%</strong></span>
                        </div>
                    </div>

                    {/* Penalty Amount */}
                    {calculation.penaltyAmount > 0 && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-sm font-medium text-orange-800">
                                Penalty amount: {calculation.penaltyAmount.toLocaleString('en-US')} VND
                            </div>
                            <div className="text-xs text-orange-600 mt-1">
                                {calculation.penaltyPercentage}% of monthly rent ({monthlyRent.toLocaleString('en-US')} VND)
                            </div>
                        </div>
                    )}

                    {/* Applied Policy Info */}
                    {calculation.appliedPolicy && (
                        <div className="text-xs text-muted-foreground">
                            Applied policy: <strong>{calculation.appliedPolicy.name}</strong>
                            {calculation.appliedRule && (
                                <span> - Rule: {calculation.appliedRule.minDaysNotice}-{calculation.appliedRule.maxDaysNotice} days</span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Errors */}
            {calculation.errors.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div>
                                <div className="font-medium text-red-800 mb-1">Errors:</div>
                                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                                    {calculation.errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warnings */}
            {calculation.warnings.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                            <div>
                                <div className="font-medium text-orange-800 mb-1">Warnings:</div>
                                <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                                    {calculation.warnings.map((warning, index) => (
                                        <li key={index}>{warning}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Emergency Waiver Option */}
            {calculation.canWaiveForEmergency && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-blue-500" />
                            Emergency Penalty Waiver
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                            This policy allows penalty waiver in emergency cases:
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {calculation.emergencyCategories.map((category, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {category}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TerminationPolicyCalculator;

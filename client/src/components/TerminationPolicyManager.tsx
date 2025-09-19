"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import {
    useGetTerminationPoliciesQuery,
    useCreateTerminationPolicyMutation,
    useUpdateTerminationPolicyMutation,
    useDeleteTerminationPolicyMutation,
} from '@/state/api';

interface TerminationPolicyManagerProps {
    propertyId: string | number;
    managerId?: string | number;
    propertyName?: string;
}

const TerminationPolicyManager: React.FC<TerminationPolicyManagerProps> = ({
    propertyId,
    managerId,
    propertyName,
}) => {
    const authUser = null; // TODO: Replace with actual auth hook

    // Redux queries and mutations
    const propertyIdStr = String(propertyId);
    const managerIdStr = managerId ? String(managerId) : undefined;
    const { data: policies = [], isLoading, refetch } = useGetTerminationPoliciesQuery({
        propertyId: propertyIdStr,
    });
    const [createPolicy, { isLoading: isCreating }] = useCreateTerminationPolicyMutation();
    const [updatePolicy, { isLoading: isUpdating }] = useUpdateTerminationPolicyMutation();
    const [deletePolicy, { isLoading: isDeleting }] = useDeleteTerminationPolicyMutation();

    const [activePolicy, setActivePolicy] = useState<TerminationPolicy | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const isSaving = isCreating || isUpdating || isDeleting;

    // Form state
    const [formData, setFormData] = useState({
        minimumNoticeRequired: 30,
        rules: [
            {
                id: 'default-1',
                minMonthsRemaining: 6,
                maxMonthsRemaining: 999,
                penaltyPercentage: 100,
                description: "Chấm dứt khi còn hơn 6 tháng trong hợp đồng"
            },
            {
                id: 'default-2',
                minMonthsRemaining: 3,
                maxMonthsRemaining: 6,
                penaltyPercentage: 50,
                description: "Chấm dứt khi còn 3-6 tháng trong hợp đồng"
            },
            {
                id: 'default-3',
                minMonthsRemaining: 1,
                maxMonthsRemaining: 3,
                penaltyPercentage: 25,
                description: "Chấm dứt khi còn 1-3 tháng trong hợp đồng"
            },
            {
                id: 'default-4',
                minMonthsRemaining: 0,
                maxMonthsRemaining: 1,
                penaltyPercentage: 0,
                description: "Chấm dứt khi còn dưới 1 tháng trong hợp đồng (không phạt)"
            }
        ] as TerminationPolicyRule[],
        allowEmergencyWaiver: true,
        emergencyCategories: [
            "Medical emergency",
            "Job relocation (with proof)",
            "Military deployment",
            "Domestic violence",
            "Property uninhabitable"
        ],
        gracePeriodDays: 60,
    });

    // Update active policy when policies change
    useEffect(() => {
        const active = policies.find(p => p.isActive);
        setActivePolicy(active || null);
    }, [policies]);

    useEffect(() => {
        if (activePolicy) {
            setFormData({
                minimumNoticeRequired: activePolicy.minimumNoticeRequired,
                rules: activePolicy.rules,
                allowEmergencyWaiver: activePolicy.allowEmergencyWaiver,
                emergencyCategories: activePolicy.emergencyCategories,
                gracePeriodDays: activePolicy.gracePeriodDays || 60,
            });
        }
    }, [activePolicy]);

    const savePolicy = async () => {
        try {
            if (activePolicy) {
                // Update existing policy
                await updatePolicy({
                    id: activePolicy.id,
                    ...formData,
                }).unwrap();
            } else {
                // Create new policy
                await createPolicy({
                    propertyId: propertyIdStr,
                    ...formData,
                }).unwrap();
            }
            setIsEditing(false);
            refetch();
        } catch (error) {
            console.error('Error saving policy:', error);
        }
    };

    const addRule = () => {
        setFormData({
            ...formData,
            rules: [
                ...formData.rules,
                {
                    id: `temp-${Date.now()}`, // Temporary ID for new rules
                    minMonthsRemaining: 0,
                    maxMonthsRemaining: 0,
                    penaltyPercentage: 0,
                    description: ''
                }
            ]
        });
    };

    const updateRule = (index: number, field: keyof TerminationPolicyRule, value: string | number) => {
        const updatedRules = [...formData.rules];
        updatedRules[index] = { ...updatedRules[index], [field]: value };
        setFormData({ ...formData, rules: updatedRules });
    };

    const removeRule = (index: number) => {
        const updatedRules = formData.rules.filter((_, i) => i !== index);
        setFormData({ ...formData, rules: updatedRules });
    };

    const addEmergencyCategory = () => {
        setFormData({
            ...formData,
            emergencyCategories: [...formData.emergencyCategories, '']
        });
    };

    const updateEmergencyCategory = (index: number, value: string) => {
        const updated = [...formData.emergencyCategories];
        updated[index] = value;
        setFormData({ ...formData, emergencyCategories: updated });
    };

    const removeEmergencyCategory = (index: number) => {
        const updated = formData.emergencyCategories.filter((_, i) => i !== index);
        setFormData({ ...formData, emergencyCategories: updated });
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="py-6">
                    <div className="text-center">Loading termination policies...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                        Termination Policy Settings
                        {propertyName && <span className="text-sm font-normal text-muted-foreground ml-2">
                            for {propertyName}
                        </span>}
                    </CardTitle>
                    {!isEditing && activePolicy && (
                        <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Policy
                        </Button>
                    )}
                    {!isEditing && !activePolicy && (
                        <Button onClick={() => setIsEditing(true)} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Policy
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {!isEditing && activePolicy && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Minimum Notice Required</Label>
                                    <p className="text-lg">{activePolicy.minimumNoticeRequired} days</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Grace Period</Label>
                                    <p className="text-lg">{activePolicy.gracePeriodDays || 60} days</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Penalty Rules</Label>
                                <div className="space-y-2">
                                    {activePolicy.rules.map((rule, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                            <div>
                                                <span className="font-medium">{rule.description}</span>
                                                <div className="text-sm text-muted-foreground">
                                                    {rule.minMonthsRemaining}-{rule.maxMonthsRemaining === 999 ? '∞' : rule.maxMonthsRemaining} tháng còn lại
                                                </div>
                                            </div>
                                            <Badge variant={rule.penaltyPercentage === 0 ? "default" : rule.penaltyPercentage >= 50 ? "destructive" : "secondary"}>
                                                {rule.penaltyPercentage}% penalty
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Emergency Waiver</Label>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Badge variant={activePolicy.allowEmergencyWaiver ? "default" : "secondary"}>
                                        {activePolicy.allowEmergencyWaiver ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>
                                {activePolicy.allowEmergencyWaiver && (
                                    <div className="text-sm text-muted-foreground">
                                        <p>Emergency categories:</p>
                                        <ul className="list-disc list-inside ml-2">
                                            {activePolicy.emergencyCategories.map((category, index) => (
                                                <li key={index}>{category}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!isEditing && !activePolicy && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No termination policy configured for this property.</p>
                            <p className="text-sm text-muted-foreground">
                                Create a policy to define early termination rules and penalties.
                            </p>
                        </div>
                    )}

                    {isEditing && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="minimumNotice">Minimum Notice Required (days)</Label>
                                    <Input
                                        id="minimumNotice"
                                        type="number"
                                        value={formData.minimumNoticeRequired}
                                        onChange={(e) => setFormData({ ...formData, minimumNoticeRequired: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                                    <Input
                                        id="gracePeriod"
                                        type="number"
                                        value={formData.gracePeriodDays}
                                        onChange={(e) => setFormData({ ...formData, gracePeriodDays: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Penalty Rules</Label>
                                <div className="space-y-3">
                                    {formData.rules.map((rule, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-2">
                                                <Label className="text-xs">Tháng tối thiểu</Label>
                                                <Input
                                                    type="number"
                                                    value={rule.minMonthsRemaining}
                                                    onChange={(e) => updateRule(index, 'minMonthsRemaining', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs">Tháng tối đa</Label>
                                                <Input
                                                    type="number"
                                                    value={rule.maxMonthsRemaining}
                                                    onChange={(e) => updateRule(index, 'maxMonthsRemaining', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label className="text-xs">Penalty %</Label>
                                                <Input
                                                    type="number"
                                                    value={rule.penaltyPercentage}
                                                    onChange={(e) => updateRule(index, 'penaltyPercentage', parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="col-span-5">
                                                <Label className="text-xs">Description</Label>
                                                <Input
                                                    value={rule.description}
                                                    onChange={(e) => updateRule(index, 'description', e.target.value)}
                                                    placeholder="Rule description"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeRule(index)}
                                                    disabled={formData.rules.length <= 1}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button onClick={addRule} variant="outline" size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Rule
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    <Switch
                                        checked={formData.allowEmergencyWaiver}
                                        onCheckedChange={(checked) => setFormData({ ...formData, allowEmergencyWaiver: checked })}
                                    />
                                    <Label>Allow Emergency Penalty Waiver</Label>
                                </div>

                                {formData.allowEmergencyWaiver && (
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Emergency Categories</Label>
                                        <div className="space-y-2">
                                            {formData.emergencyCategories.map((category, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <Input
                                                        value={category}
                                                        onChange={(e) => updateEmergencyCategory(index, e.target.value)}
                                                        placeholder="Emergency category"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeEmergencyCategory(index)}
                                                        disabled={formData.emergencyCategories.length <= 1}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button onClick={addEmergencyCategory} variant="outline" size="sm">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Category
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        if (activePolicy) {
                                            setFormData({
                                                minimumNoticeRequired: activePolicy.minimumNoticeRequired,
                                                rules: activePolicy.rules,
                                                allowEmergencyWaiver: activePolicy.allowEmergencyWaiver,
                                                emergencyCategories: activePolicy.emergencyCategories,
                                                gracePeriodDays: activePolicy.gracePeriodDays || 60,
                                            });
                                        }
                                    }}
                                    disabled={isSaving}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button onClick={savePolicy} disabled={isSaving}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save Policy'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TerminationPolicyManager;
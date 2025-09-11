"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, X } from 'lucide-react';

const TerminationPolicyForm: React.FC<TerminationPolicyFormProps> = ({
    policy,
    propertyId,
    onSave,
    onCancel,
}) => {
    const [formData, setFormData] = useState({
        name: policy?.name || '',
        description: policy?.description || '',
        minimumNoticeRequired: policy?.minimumNoticeRequired || 30,
        managerResponseTimeLimit: policy?.managerResponseTimeLimit || 5,
        allowEmergencyWaiver: policy?.allowEmergencyWaiver || false,
        emergencyCategories: policy?.emergencyCategories || [],
        isActive: policy?.isActive ?? true,
        rules: policy?.rules || [],
    });

    const [newRule, setNewRule] = useState<Partial<TerminationPolicyRule>>({
        minDaysNotice: 0,
        maxDaysNotice: 30,
        penaltyPercentage: 0,
        description: '',
    });

    const [newEmergencyCategory, setNewEmergencyCategory] = useState('');

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddRule = () => {
        if (newRule.minDaysNotice !== undefined &&
            newRule.maxDaysNotice !== undefined &&
            newRule.penaltyPercentage !== undefined) {

            const rule: TerminationPolicyRule = {
                id: `rule-${Date.now()}`,
                minDaysNotice: newRule.minDaysNotice,
                maxDaysNotice: newRule.maxDaysNotice,
                penaltyPercentage: newRule.penaltyPercentage,
                description: newRule.description || '',
            };

            setFormData(prev => ({
                ...prev,
                rules: [...prev.rules, rule],
            }));

            setNewRule({
                minDaysNotice: 0,
                maxDaysNotice: 30,
                penaltyPercentage: 0,
                description: '',
            });
        }
    };

    const handleRemoveRule = (ruleId: string) => {
        setFormData(prev => ({
            ...prev,
            rules: prev.rules.filter(rule => rule.id !== ruleId),
        }));
    };

    const handleAddEmergencyCategory = () => {
        if (newEmergencyCategory.trim()) {
            setFormData(prev => ({
                ...prev,
                emergencyCategories: [...prev.emergencyCategories, newEmergencyCategory.trim()],
            }));
            setNewEmergencyCategory('');
        }
    };

    const handleRemoveEmergencyCategory = (index: number) => {
        setFormData(prev => ({
            ...prev,
            emergencyCategories: prev.emergencyCategories.filter((_, i) => i !== index),
        }));
    };

    const handleSave = () => {
        // Validation
        if (!formData.name.trim()) {
            alert('Please enter policy name');
            return;
        }

        if (formData.minimumNoticeRequired < 1) {
            alert('Minimum notice required must be >= 1 day');
            return;
        }

        if (formData.managerResponseTimeLimit < 1) {
            alert('Manager response time must be >= 1 day');
            return;
        }

        // Sort rules by minDaysNotice
        const sortedRules = [...formData.rules].sort((a, b) => a.minDaysNotice - b.minDaysNotice);

        onSave({
            ...formData,
            rules: sortedRules,
        });
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="rules">Penalty Rules</TabsTrigger>
                    <TabsTrigger value="emergency">Emergency Cases</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4">
                    <div className="grid gap-4">
                        <div>
                            <Label htmlFor="name">Policy Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="e.g., Standard Lease Termination Policy"
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Detailed description of this policy..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="minimumNotice">Minimum Notice Required (days) *</Label>
                                <Input
                                    id="minimumNotice"
                                    type="number"
                                    min="1"
                                    value={formData.minimumNoticeRequired}
                                    onChange={(e) => handleInputChange('minimumNoticeRequired', parseInt(e.target.value) || 1)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="responseTime">Manager Response Time (days) *</Label>
                                <Input
                                    id="responseTime"
                                    type="number"
                                    min="1"
                                    value={formData.managerResponseTimeLimit}
                                    onChange={(e) => handleInputChange('managerResponseTimeLimit', parseInt(e.target.value) || 1)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                            />
                            <Label htmlFor="isActive">Activate this policy</Label>
                        </div>
                    </div>
                </TabsContent>

                {/* Penalty Rules Tab */}
                <TabsContent value="rules" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Penalty Rule</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-4 gap-2">
                                <div>
                                    <Label>From (days)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={newRule.minDaysNotice}
                                        onChange={(e) => setNewRule(prev => ({
                                            ...prev,
                                            minDaysNotice: parseInt(e.target.value) || 0
                                        }))}
                                    />
                                </div>
                                <div>
                                    <Label>To (days)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={newRule.maxDaysNotice}
                                        onChange={(e) => setNewRule(prev => ({
                                            ...prev,
                                            maxDaysNotice: parseInt(e.target.value) || 0
                                        }))}
                                    />
                                </div>
                                <div>
                                    <Label>Penalty (%)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newRule.penaltyPercentage}
                                        onChange={(e) => setNewRule(prev => ({
                                            ...prev,
                                            penaltyPercentage: parseInt(e.target.value) || 0
                                        }))}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={handleAddRule} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <Label>Description (optional)</Label>
                                <Input
                                    value={newRule.description}
                                    onChange={(e) => setNewRule(prev => ({
                                        ...prev,
                                        description: e.target.value
                                    }))}
                                    placeholder="e.g., For late notice cases"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Existing Rules */}
                    <div className="space-y-2">
                        <Label>Current Rules:</Label>
                        {formData.rules.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No rules defined yet</p>
                        ) : (
                            formData.rules.map((rule) => (
                                <Card key={rule.id}>
                                    <CardContent className="py-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">
                                                    {rule.minDaysNotice}-{rule.maxDaysNotice} days notice: {rule.penaltyPercentage}% penalty
                                                </span>
                                                {rule.description && (
                                                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveRule(rule.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Emergency Tab */}
                <TabsContent value="emergency" className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="allowEmergency"
                            checked={formData.allowEmergencyWaiver}
                            onCheckedChange={(checked) => handleInputChange('allowEmergencyWaiver', checked)}
                        />
                        <Label htmlFor="allowEmergency">Allow penalty waiver in emergency cases</Label>
                    </div>

                    {formData.allowEmergencyWaiver && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Emergency Categories</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={newEmergencyCategory}
                                        onChange={(e) => setNewEmergencyCategory(e.target.value)}
                                        placeholder="e.g., Job loss, Medical emergency..."
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddEmergencyCategory()}
                                    />
                                    <Button onClick={handleAddEmergencyCategory} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {formData.emergencyCategories.map((category, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                            <span>{category}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveEmergencyCategory(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                </Button>
                <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Policy
                </Button>
            </div>
        </div>
    );
};

export default TerminationPolicyForm;

# Termination Policy Management System - UI Documentation

## Overview

This system allows managers to customize lease termination conditions instead of hardcoding them, including:

- **TerminationPolicyManager**: Manage policies for each property
- **TerminationPolicyForm**: Form to create/edit policies
- **TerminationPolicyCalculator**: Automatic penalty calculation
- **EnhancedTerminationRequest**: Termination request form with policy integration
- **PropertyTerminationSettings**: Comprehensive dashboard

## Policy Scope: Per Property

🎯 **Important**: Each property has its own set of termination policies. This allows for flexible management based on:

- Property type (apartment, house, commercial)
- Location and market conditions
- Tenant demographics
- Business strategy

## Component Structure

### 1. TerminationPolicyManager

**Location**: `/components/TerminationPolicyManager.tsx`

Chức năng chính:

- Hiển thị danh sách policies của property
- Thêm/sửa/xóa policies
- Kích hoạt/vô hiệu hóa policies

```tsx
<TerminationPolicyManager propertyId="property-123" managerId="manager-456" />
```

### 2. TerminationPolicyForm

**Location**: `/components/TerminationPolicyForm.tsx`

Form với 3 tabs:

- **Thông tin cơ bản**: Tên, mô tả, thời gian thông báo, response time
- **Quy tắc penalty**: Cấu hình penalty theo số ngày thông báo
- **Trường hợp khẩn cấp**: Cấu hình miễn penalty

Tính năng:

- Thêm multiple penalty rules với khoảng ngày khác nhau
- Cấu hình emergency categories
- Validation form đầy đủ

### 3. TerminationPolicyCalculator

**Location**: `/components/TerminationPolicyCalculator.tsx`

Tự động tính toán:

- Số ngày thông báo từ ngày hiện tại
- Penalty percentage và amount dựa trên policy
- Validation theo minimum notice requirement
- Hiển thị warnings/errors
- Emergency waiver options

```tsx
<TerminationPolicyCalculator
  propertyId="property-123"
  requestedEndDate="2025-12-31"
  monthlyRent={10000000}
  onPolicyCalculated={(calculation) => {
    console.log("Penalty:", calculation.penaltyAmount);
  }}
/>
```

### 4. EnhancedTerminationRequest

**Location**: `/components/EnhancedTerminationRequest.tsx`

Flow 3 bước:

1. **Thông tin cơ bản**: Ngày kết thúc, lý do, emergency flag
2. **Tính toán penalty**: Tự động với TerminationPolicyCalculator
3. **Xem lại & gửi**: Review tất cả thông tin trước khi submit

```tsx
<EnhancedTerminationRequest
  propertyId="property-123"
  leaseId="lease-456"
  monthlyRent={10000000}
  onSubmit={(data) => {
    // Handle termination request submission
  }}
  onCancel={() => {
    // Handle cancel
  }}
/>
```

### 5. PropertyTerminationSettings

**Location**: `/components/PropertyTerminationSettings.tsx`

Dashboard với 3 tabs:

- **Policies**: TerminationPolicyManager
- **Yêu cầu hủy thuê**: Danh sách requests (TODO)
- **Thống kê**: Analytics và metrics (TODO)

## Database Schema Changes

### TerminationPolicy Model

```prisma
model TerminationPolicy {
  id                        String   @id @default(cuid())
  propertyId               String
  managerId                String
  name                     String
  description              String?
  minimumNoticeRequired    Int      @default(30)
  managerResponseTimeLimit Int      @default(5)
  allowEmergencyWaiver     Boolean  @default(false)
  emergencyCategories      String[] @default([])
  isActive                 Boolean  @default(true)
  rules                    TerminationPolicyRule[]
  // Relations và timestamps...
}

model TerminationPolicyRule {
  id                String  @id @default(cuid())
  policyId          String
  minDaysNotice     Int
  maxDaysNotice     Int
  penaltyPercentage Int
  description       String?
  // Relations...
}
```

## Workflow sử dụng

### Cho Manager:

1. **Setup Policy ban đầu**:

   ```tsx
   // Trong manager dashboard
   <PropertyTerminationSettings
     propertyId={property.id}
     managerId={manager.id}
     propertyName={property.name}
   />
   ```

2. **Tạo Policy mới**:

   - Vào tab "Policies"
   - Click "Tạo policy mới"
   - Điền thông tin trong 3 tabs
   - Lưu và kích hoạt

3. **Cấu hình Penalty Rules**:
   ```
   Ví dụ policy:
   - 0-30 ngày: 100% penalty
   - 31-60 ngày: 50% penalty
   - 61+ ngày: 0% penalty
   - Emergency: Có thể miễn phí
   ```

### Cho Tenant:

1. **Submit Termination Request**:

   ```tsx
   <EnhancedTerminationRequest
     propertyId={lease.propertyId}
     leaseId={lease.id}
     monthlyRent={lease.monthlyRent}
     onSubmit={handleSubmitRequest}
   />
   ```

2. **Automatic Calculation**:
   - Chọn ngày kết thúc → tự động tính penalty
   - Hiển thị warnings nếu notice time không đủ
   - Cho phép request emergency waiver

## Routes và Navigation

### Manager Routes:

1. **Property Termination Policies Management**:

   ```
   /managers/properties/[id]/termination-policies
   ```

   - Truy cập từ: Manager Properties → Property Detail → Tab "Termination Policies"
   - Component: PropertyTerminationSettings
   - Features: Quản lý policies, xem requests, analytics

2. **Property Detail Tabs**:
   ```
   /managers/properties/[id]
   ```
   - Đã thêm tab "Termination Policies" vào ManagerPropertyTabsAPI
   - Link direct đến termination policies management

### Tenant Routes:

1. **Termination Request Form**:

   ```
   /tenants/termination-request?leaseId=123&propertyId=456&monthlyRent=10000000
   ```

   - Truy cập từ: Tenant Residences → Property Detail → "Terminate Lease" button
   - Component: EnhancedTerminationRequest
   - Features: 3-step wizard với policy calculation

2. **Tenant Residence Detail**:
   ```
   /tenants/residences/[id]
   ```
   - Đã update "Terminate Lease" button để navigate đến enhanced form
   - Thay thế old TerminateLeaseModal

### Navigation Flow:

**Manager Workflow**:

```
Dashboard → Properties → Property Detail → Termination Policies Tab →
Policy Management → Create/Edit Policy
```

**Tenant Workflow**:

```
Dashboard → Residences → Property Detail → Terminate Lease Button →
Enhanced Request Form → Submit Request
```

## API Integration (TODO)

Cần implement các API endpoints:

```typescript
// GET /api/termination-policies?propertyId=123&active=true
// POST /api/termination-policies
// PUT /api/termination-policies/:id
// DELETE /api/termination-policies/:id

// POST /api/termination-requests
// GET /api/termination-requests?propertyId=123
// PUT /api/termination-requests/:id/approve
// PUT /api/termination-requests/:id/reject
```

## Business Logic Benefits

1. **Flexibility**: Manager có thể tùy chỉnh penalty theo từng property
2. **Automation**: Tính toán penalty tự động, giảm sai sót
3. **Transparency**: Tenant biết trước penalty trước khi submit
4. **Emergency Handling**: Hỗ trợ các trường hợp đặc biệt
5. **Audit Trail**: Track tất cả policy changes và applications

## Next Steps

1. Implement backend APIs
2. Tích hợp với existing termination request flow
3. Thêm notification system cho policy changes
4. Analytics và reporting
5. Mobile responsive optimization

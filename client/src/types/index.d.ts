import { LucideIcon } from "lucide-react";
import { AuthUser } from "aws-amplify/auth";
import { Manager, Tenant, Property, Application } from "./prismaTypes";
import { MotionProps as OriginalMotionProps } from "framer-motion";

declare module "framer-motion" {
  interface MotionProps extends OriginalMotionProps {
    className?: string;
  }
}

declare global {
  enum AmenityEnum {
    WasherDryer = "WasherDryer",
    AirConditioning = "AirConditioning",
    Dishwasher = "Dishwasher",
    HighSpeedInternet = "HighSpeedInternet",
    HardwoodFloors = "HardwoodFloors",
    WalkInClosets = "WalkInClosets",
    Microwave = "Microwave",
    Refrigerator = "Refrigerator",
    Pool = "Pool",
    Gym = "Gym",
    Parking = "Parking",
    PetsAllowed = "PetsAllowed",
    WiFi = "WiFi",
  }

  enum HighlightEnum {
    HighSpeedInternetAccess = "HighSpeedInternetAccess",
    WasherDryer = "WasherDryer",
    AirConditioning = "AirConditioning",
    Heating = "Heating",
    SmokeFree = "SmokeFree",
    CableReady = "CableReady",
    SatelliteTV = "SatelliteTV",
    DoubleVanities = "DoubleVanities",
    TubShower = "TubShower",
    Intercom = "Intercom",
    SprinklerSystem = "SprinklerSystem",
    RecentlyRenovated = "RecentlyRenovated",
    CloseToTransit = "CloseToTransit",
    GreatView = "GreatView",
    QuietNeighborhood = "QuietNeighborhood",
  }

  enum PropertyTypeEnum {
    Rooms = "Rooms",
    Tinyhouse = "Tinyhouse",
    Apartment = "Apartment",
    Villa = "Villa",
    Townhouse = "Townhouse",
    Cottage = "Cottage",
  }

  interface SidebarLinkProps {
    href: string;
    icon: LucideIcon;
    label: string;
  }

  interface PropertyOverviewProps {
    property: Property;
  }

  interface ApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: number;
  }

  interface ContactWidgetProps {
    onOpenModal: () => void;
    property: Property;
  }

  interface ImagePreviewsProps {
    images: string[];
  }

  interface PropertyDetailsProps {
    property: Property;
  }

  interface PropertyLocationProps {
    property: Property;
  }

  interface PropertyWithRentalStatus extends Property {
    isRented: boolean;
    hasActiveLease: boolean;
    hasApprovedApplication: boolean;
  }

  interface ApplicationCardProps {
    application: Application;
    userType: "manager" | "renter";
    children: React.ReactNode;
  }

  interface TerminationPolicyRule {
    id: string;
    minDaysNotice: number;
    maxDaysNotice: number;
    penaltyPercentage: number;
    description: string;
  }

  interface TerminationPolicy {
    id: string;
    propertyId: string;
    managerId: string;
    name: string;
    description?: string;
    rules: TerminationPolicyRule[];
    allowEmergencyWaiver: boolean;
    emergencyCategories: string[];
    minimumNoticeRequired: number;
    managerResponseTimeLimit: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  interface TerminationPolicyFormProps {
    policy?: TerminationPolicy;
    propertyId: string;
    onSave: (policy: Partial<TerminationPolicy>) => void;
    onCancel: () => void;
  }

  interface TerminationPolicyListProps {
    propertyId: string;
    policies: TerminationPolicy[];
    onEdit: (policy: TerminationPolicy) => void;
    onDelete: (policyId: string) => void;
  }

  interface CardProps {
    property: Property;
    isFavorite: boolean;
    onFavoriteToggle: () => void;
    showFavoriteButton?: boolean;
    propertyLink?: string;
  }

  interface CardCompactProps {
    property: Property;
    isFavorite: boolean;
    onFavoriteToggle: () => void;
    showFavoriteButton?: boolean;
    propertyLink?: string;
  }

  interface HeaderProps {
    title: string;
    subtitle: string;
  }

  interface NavbarProps {
    isDashboard: boolean;
  }

  interface AppSidebarProps {
    userType: "manager" | "tenant";
  }

  interface SettingsFormProps {
    initialData: SettingsFormData;
    onSubmit: (data: SettingsFormData) => Promise<void>;
    userType: "manager" | "tenant";
  }

  interface User {
    cognitoInfo: AuthUser;
    userInfo: Tenant | Manager;
    userRole: string;
  }

  interface CustomDialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    content?: React.ReactNode;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    showFooter?: boolean;
    loading?: boolean;
  }

  interface TerminationPolicy {
    id: string;
    propertyId: string;
    isActive: boolean;
    minimumNoticeRequired: number;
    rules: TerminationPolicyRule[];
    allowEmergencyWaiver: boolean;
    emergencyCategories: string[];
    gracePeriodDays: number;
    createdAt: string;
    updatedAt: string;
  }

  interface TerminationCalculation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    appliedPolicy: TerminationPolicy | null;
    appliedRule: TerminationPolicyRule | null;
    penaltyAmount: number;
    penaltyPercentage: number;
    daysNotice: number;
    canWaiveForEmergency: boolean;
    emergencyCategories: string[];
  }
}

export {};

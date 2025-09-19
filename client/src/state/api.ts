import { cleanParams, createNewUserInDatabase, withToast } from "@/lib/utils";
import {
  Application,
  Lease,
  Manager,
  Payment,
  Property,
  Tenant,
} from "@/types/prismaTypes";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { FiltersState } from ".";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      if (idToken) {
        headers.set("Authorization", `Bearer ${idToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [
    "Managers",
    "Tenants",
    "Properties",
    "PropertyDetails",
    "Leases",
    "Payments",
    "Applications",
    "TerminationPolicies",
    "TerminationRequests",
  ],
  endpoints: (build) => ({
    getAuthUser: build.query<User, void>({
      queryFn: async (_, _queryApi, _extraoptions, fetchWithBQ) => {
        try {
          const session = await fetchAuthSession();
          const user = await getCurrentUser();

          // Check if session has tokens
          if (!session.tokens || !session.tokens.idToken) {
            // Try to get a fresh session
            const freshSession = await fetchAuthSession({ forceRefresh: true });

            if (!freshSession.tokens || !freshSession.tokens.idToken) {
              return { error: "Authentication required. Please log in again." };
            }

            // Use fresh session
            session.tokens = freshSession.tokens;
          }

          const { idToken } = session.tokens;

          // Try multiple ways to get the role
          let userRole = idToken?.payload["custom:role"] as string;

          // Fallback options if custom:role is not found
          if (!userRole) {
            userRole = idToken?.payload["role"] as string;
          }
          if (!userRole) {
            const groups = idToken?.payload["cognito:groups"] as string[];
            userRole = groups?.[0];
          }
          if (!userRole) {
            userRole = idToken?.payload["custom:userRole"] as string;
          }

          // Check if role is in username (as fallback based on your logs)
          if (!userRole && user.username) {
            if (user.username.toLowerCase().includes("tenant")) {
              userRole = "tenant";
            } else if (user.username.toLowerCase().includes("manager")) {
              userRole = "manager";
            }
          }

          // Default to tenant if no role found (since user mentioned role is tenant on AWS)
          if (!userRole) {
            userRole = "tenant";
            console.warn("No role found in token, defaulting to 'tenant'");
          }

          const endpoint =
            userRole === "manager"
              ? `/managers/${user.userId}`
              : `/tenants/${user.userId}`;

          let userDetailsResponse = await fetchWithBQ(endpoint);

          // if user doesn't exist, create new user
          if (
            userDetailsResponse.error &&
            userDetailsResponse.error.status === 404
          ) {
            userDetailsResponse = await createNewUserInDatabase(
              user,
              idToken,
              userRole,
              fetchWithBQ
            );
          }

          return {
            data: {
              cognitoInfo: { ...user },
              userInfo: userDetailsResponse.data as Tenant | Manager,
              userRole,
            },
          };
        } catch (error: any) {
          console.error("Error in getAuthUser:", error);
          return { error: error.message || "Could not fetch user data" };
        }
      },
    }),

    // property related endpoints
    getProperties: build.query<
      Property[],
      Partial<FiltersState> & { favoriteIds?: number[] }
    >({
      query: (filters) => {
        const params = cleanParams({
          location: filters.location,
          priceMin: filters.priceRange?.[0],
          priceMax: filters.priceRange?.[1],
          beds: filters.beds,
          baths: filters.baths,
          propertyType: filters.propertyType,
          squareFeetMin: filters.squareFeet?.[0],
          squareFeetMax: filters.squareFeet?.[1],
          amenities: filters.amenities?.join(","),
          availableFrom: filters.availableFrom,
          favoriteIds: filters.favoriteIds?.join(","),
          latitude: filters.coordinates?.[1],
          longitude: filters.coordinates?.[0],
        });

        return { url: "properties", params };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch properties.",
        });
      },
    }),

    getProperty: build.query<Property, number>({
      query: (id) => `properties/${id}`,
      providesTags: (result, error, id) => [{ type: "PropertyDetails", id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load property details.",
        });
      },
    }),

    deleteProperty: build.mutation<void, number>({
      query: (id) => ({
        url: `properties/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Properties", id: "LIST" },
        { type: "Managers", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Property deleted successfully!",
          error: "Failed to delete property.",
        });
      },
    }),

    // tenant related endpoints
    getTenant: build.query<Tenant, string>({
      query: (cognitoId) => `tenants/${cognitoId}`,
      providesTags: (result) => [{ type: "Tenants", id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load tenant profile.",
        });
      },
    }),

    getCurrentResidences: build.query<Property[], string>({
      query: (cognitoId) => `tenants/${cognitoId}/current-residences`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch current residences.",
        });
      },
    }),

    updateTenantSettings: build.mutation<
      Tenant,
      { cognitoId: string } & Partial<Tenant>
    >({
      query: ({ cognitoId, ...updatedTenant }) => ({
        url: `tenants/${cognitoId}`,
        method: "PUT",
        body: updatedTenant,
      }),
      invalidatesTags: (result) => [{ type: "Tenants", id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    addFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: "POST",
      }),
      invalidatesTags: (result) => [
        { type: "Tenants", id: result?.id },
        { type: "Properties", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Added to favorites!!",
          error: "Failed to add to favorites",
        });
      },
    }),

    removeFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `tenants/${cognitoId}/favorites/${propertyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result) => [
        { type: "Tenants", id: result?.id },
        { type: "Properties", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Removed from favorites!",
          error: "Failed to remove from favorites.",
        });
      },
    }),

    // manager related endpoints
    getManagerProperties: build.query<Property[], string>({
      query: (cognitoId) => `managers/${cognitoId}/properties`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to load manager profile.",
        });
      },
    }),

    updateManagerSettings: build.mutation<
      Manager,
      { cognitoId: string } & Partial<Manager>
    >({
      query: ({ cognitoId, ...updatedManager }) => ({
        url: `managers/${cognitoId}`,
        method: "PUT",
        body: updatedManager,
      }),
      invalidatesTags: (result) => [{ type: "Managers", id: result?.id }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Settings updated successfully!",
          error: "Failed to update settings.",
        });
      },
    }),

    createProperty: build.mutation<Property, FormData>({
      query: (newProperty) => ({
        url: `properties`,
        method: "POST",
        body: newProperty,
      }),
      invalidatesTags: (result) => [
        { type: "Properties", id: "LIST" },
        { type: "Managers", id: result?.manager?.id },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Property created successfully!",
          error: "Failed to create property.",
        });
      },
    }),

    updateProperty: build.mutation<
      Property,
      { id: number; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `properties/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Properties", id: "LIST" },
        { type: "PropertyDetails", id },
        { type: "Managers", id: result?.manager?.id },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Property updated successfully!",
          error: "Failed to update property.",
        });
      },
    }),

    // lease related enpoints
    getLeases: build.query<Lease[], number>({
      query: () => "leases",
      providesTags: ["Leases"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch leases.",
        });
      },
    }),

    getPropertyLeases: build.query<Lease[], number>({
      query: (propertyId) => `properties/${propertyId}/leases`,
      providesTags: ["Leases"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch property leases.",
        });
      },
    }),

    getPayments: build.query<Payment[], number>({
      query: (leaseId) => `leases/${leaseId}/payments`,
      providesTags: ["Payments"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch payment info.",
        });
      },
    }),

    // application related endpoints
    getApplications: build.query<
      Application[],
      { userId?: string; userType?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.userId) {
          queryParams.append("userId", params.userId.toString());
        }
        if (params.userType) {
          queryParams.append("userType", params.userType);
        }

        return `applications?${queryParams.toString()}`;
      },
      providesTags: ["Applications"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch applications.",
        });
      },
    }),

    updateApplicationStatus: build.mutation<
      Application & { lease?: Lease },
      { id: number; status: string }
    >({
      query: ({ id, status }) => ({
        url: `applications/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Applications", "Leases"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Application status updated successfully!",
          error: "Failed to update application settings.",
        });
      },
    }),

    createApplication: build.mutation<Application, Partial<Application>>({
      query: (body) => ({
        url: `applications`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Applications"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Application created successfully!",
          error: "Failed to create applications.",
        });
      },
    }),

    // Manager Property Tabs endpoints
    getPropertySummary: build.query<
      {
        currentLease: Lease | null;
        currentPaymentStatus: string;
        totalLeases: number;
        totalRevenue: number;
        isVacant: boolean;
      },
      number
    >({
      query: (propertyId) => `properties/${propertyId}/summary`,
      providesTags: (result, error, propertyId) => [
        { type: "PropertyDetails", id: propertyId },
        { type: "Leases", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch property summary.",
        });
      },
    }),

    getCurrentLeaseByProperty: build.query<Lease | null, number>({
      query: (propertyId) => `properties/${propertyId}/current-lease`,
      providesTags: (result, error, propertyId) => [
        { type: "Leases", id: result?.id },
        { type: "PropertyDetails", id: propertyId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch current lease.",
        });
      },
    }),

    getLeaseHistoryByProperty: build.query<Lease[], number>({
      query: (propertyId) => `properties/${propertyId}/lease-history`,
      providesTags: (result, error, propertyId) => [
        { type: "Leases", id: "LIST" },
        { type: "PropertyDetails", id: propertyId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch lease history.",
        });
      },
    }),

    getPaymentHistoryByProperty: build.query<
      Array<{
        id: number;
        amountDue: number;
        amountPaid: number;
        dueDate: string;
        paymentDate?: string;
        paymentStatus: "Paid" | "Not Paid" | "Late" | "Pending";
        lease: {
          tenant: {
            id: number;
            name: string;
            email: string;
          };
        };
      }>,
      number
    >({
      query: (propertyId) => `properties/${propertyId}/payment-history`,
      providesTags: (result, error, propertyId) => [
        { type: "Payments", id: "LIST" },
        { type: "PropertyDetails", id: propertyId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch payment history.",
        });
      },
    }),

    getPreviousTenantsForProperty: build.query<
      Lease[],
      { propertyId: number; limit?: number }
    >({
      query: ({ propertyId, limit = 5 }) =>
        `properties/${propertyId}/previous-tenants?limit=${limit}`,
      providesTags: (result, error, { propertyId }) => [
        { type: "Leases", id: "LIST" },
        { type: "PropertyDetails", id: propertyId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch previous tenants.",
        });
      },
    }),

    getCurrentMonthPaymentStatus: build.query<
      {
        paymentStatus: string;
        amountDue: number;
        amountPaid: number;
        dueDate: string | null;
        paymentDate: string | null;
      },
      number
    >({
      query: (leaseId) => `lease/${leaseId}/payment-status`,
      providesTags: (result, error, leaseId) => [
        { type: "Payments", id: leaseId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          error: "Failed to fetch payment status.",
        });
      },
    }),

    // Payment endpoints
    recordPayment: build.mutation<
      Payment,
      { paymentId: number; amountPaid: number; paymentDate?: string }
    >({
      query: ({ paymentId, amountPaid, paymentDate }) => ({
        url: `payments/${paymentId}/record`,
        method: "POST",
        body: { amountPaid, paymentDate },
      }),
      invalidatesTags: (result, error, { paymentId }) => [
        { type: "Payments", id: "LIST" },
        { type: "Payments", id: paymentId },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Payment recorded successfully!",
          error: "Failed to record payment.",
        });
      },
    }),

    getPaymentsByLease: build.query<Payment[], number>({
      query: (leaseId) => `payments/lease/${leaseId}`,
      providesTags: (result, error, leaseId) => [
        { type: "Payments", id: "LIST" },
        { type: "Leases", id: leaseId },
      ],
    }),

    getPaymentsByProperty: build.query<
      Array<{
        id: number;
        amountDue: number;
        amountPaid: number;
        dueDate: string;
        paymentDate?: string;
        paymentStatus: "Pending" | "Paid" | "PartiallyPaid" | "Overdue";
        lease: {
          tenant: {
            id: number;
            name: string;
            email: string;
          };
        };
      }>,
      number
    >({
      query: (propertyId) => `payments/property/${propertyId}`,
      providesTags: (result, error, propertyId) => [
        { type: "Payments", id: "LIST" },
        { type: "PropertyDetails", id: propertyId },
      ],
    }),

    getCurrentMonthPaymentStatusByLease: build.query<
      {
        paymentStatus: string;
        amountDue: number;
        amountPaid: number;
        dueDate: string | null;
        paymentDate: string | null;
      },
      number
    >({
      query: (leaseId) => `payments/lease/${leaseId}/current-status`,
      providesTags: (result, error, leaseId) => [
        { type: "Payments", id: "LIST" },
        { type: "Leases", id: leaseId },
      ],
    }),

    getCurrentMonthPaymentStatusByProperty: build.query<
      {
        paymentStatus: string;
        amountDue: number;
        amountPaid: number;
        dueDate: string | null;
        paymentDate: string | null;
      },
      number
    >({
      query: (propertyId) => `properties/${propertyId}/current-month-payment`,
      providesTags: (result, error, propertyId) => [
        { type: "Payments", id: "LIST" },
        { type: "PropertyDetails", id: propertyId },
      ],
    }),

    getOverduePayments: build.query<
      Array<{
        id: number;
        amountDue: number;
        amountPaid: number;
        dueDate: string;
        lease: {
          tenant: { name: string; email: string };
          property: { name: string };
        };
      }>,
      { userType: string; userId: string }
    >({
      query: ({ userType, userId }) =>
        `payments/overdue?userType=${userType}&userId=${userId}`,
      providesTags: [{ type: "Payments", id: "OVERDUE" }],
    }),

    checkOverduePayments: build.mutation<
      { message: string; overduePayments: any[] },
      void
    >({
      query: () => ({
        url: "payments/check-overdue",
        method: "POST",
      }),
      invalidatesTags: [{ type: "Payments", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Overdue payments checked successfully!",
          error: "Failed to check overdue payments.",
        });
      },
    }),

    // Chat: search users (tenants and managers) by name/email
    searchChatUsers: build.query<
      Array<{
        type: string;
        id: number;
        name: string;
        email: string;
        cognitoId: string;
      }>,
      { q: string; exclude?: string }
    >({
      query: ({ q, exclude }) => {
        const params = new URLSearchParams({ q });
        if (exclude) params.append("exclude", exclude);
        return `chat/users?${params.toString()}`;
      },
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.success ? response.data : [];
      },
    }),

    // Chat: conversation history between two user ids
    getChatHistory: build.query<
      Array<{
        id: number;
        senderId: string;
        receiverId: string;
        content: string;
        createdAt: string;
        isRead: boolean;
        sender?: {
          cognitoId: string;
          name: string;
          email: string;
          userType: string;
        };
        receiver?: {
          cognitoId: string;
          name: string;
          email: string;
          userType: string;
        };
      }>,
      { user1: string; user2: string }
    >({
      query: ({ user1, user2 }) =>
        `chat/history?user1=${encodeURIComponent(
          user1
        )}&user2=${encodeURIComponent(user2)}`,
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.success ? response.data : [];
      },
    }),

    // Chat: recent conversations for a user
    getConversations: build.query<
      Array<{
        peerId: string;
        name: string;
        email: string;
        type: string;
        lastMessage: {
          id: number;
          content: string;
          senderId: string;
          receiverId: string;
          createdAt: string;
          isRead: boolean;
        };
      }>,
      { userId: string }
    >({
      query: ({ userId }) => `chat/conversations/${encodeURIComponent(userId)}`,
      transformResponse: (response: { success: boolean; data: any[] }) => {
        return response.success ? response.data : [];
      },
    }),

    // Chat: fetch one user's profile by cognitoId
    getChatUser: build.query<
      { cognitoId: string; name: string; email: string; type: string } | null,
      string
    >({
      query: (cognitoId) => `chat/user/${encodeURIComponent(cognitoId)}`,
      transformResponse: (response: { success: boolean; data: any }) => {
        return response.success ? response.data : null;
      },
    }),

    // Chat: send a message
    sendChatMessage: build.mutation<
      {
        id: number;
        senderId: string;
        receiverId: string;
        content: string;
        createdAt: string;
        isRead: boolean;
      },
      { senderId: string; receiverId: string; content: string }
    >({
      query: (body) => ({
        url: "chat/send",
        method: "POST",
        body,
      }),
    }),

    // Chat: mark messages as read
    markChatMessagesAsRead: build.mutation<
      { updatedCount: number },
      { senderId: string; receiverId: string }
    >({
      query: (body) => ({
        url: "chat/mark-read",
        method: "POST",
        body,
      }),
    }),

    // Chat: get unread message count
    getUnreadMessageCount: build.query<{ unreadCount: number }, string>({
      query: (userId) => `chat/unread-count/${encodeURIComponent(userId)}`,
      transformResponse: (response: {
        success: boolean;
        data: { unreadCount: number };
      }) => {
        return response.success ? response.data : { unreadCount: 0 };
      },
    }),

    // Termination Policy endpoints

    getManagerTerminationRequests: build.query<any[], {}>({
      query: () => `termination-requests/manager`,
      providesTags: ["TerminationRequests"],
    }),

    getTerminationPolicies: build.query<
      any[],
      { propertyId: string; active?: boolean }
    >({
      query: ({ propertyId, active }) => {
        const params = new URLSearchParams();
        params.append("propertyId", propertyId);
        if (active !== undefined) {
          params.append("active", active.toString());
        }
        return `termination-policies?${params.toString()}`;
      },
      providesTags: (result, error, { propertyId }) => [
        { type: "TerminationPolicies", id: `property-${propertyId}` },
        { type: "TerminationPolicies", id: "LIST" },
      ],
    }),

    getTerminationPolicy: build.query<any, string>({
      query: (id) => `termination-policies/${id}`,
      providesTags: (result, error, id) => [
        { type: "TerminationPolicies", id },
      ],
    }),

    createTerminationPolicy: build.mutation<
      any,
      {
        propertyId: string;
        minimumNoticeRequired: number;
        rules: any[];
        allowEmergencyWaiver?: boolean;
        emergencyCategories?: string[];
        gracePeriodDays?: number;
      }
    >({
      query: (body) => ({
        url: "termination-policies",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { propertyId }) => [
        { type: "TerminationPolicies", id: `property-${propertyId}` },
        { type: "TerminationPolicies", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Termination policy created successfully!",
          error: "Failed to create termination policy.",
        });
      },
    }),

    updateTerminationPolicy: build.mutation<
      any,
      {
        id: string;
        minimumNoticeRequired?: number;
        rules?: any[];
        allowEmergencyWaiver?: boolean;
        emergencyCategories?: string[];
        gracePeriodDays?: number;
        isActive?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `termination-policies/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "TerminationPolicies", id },
        { type: "TerminationPolicies", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Termination policy updated successfully!",
          error: "Failed to update termination policy.",
        });
      },
    }),

    deleteTerminationPolicy: build.mutation<any, string>({
      query: (id) => ({
        url: `termination-policies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "TerminationPolicies", id },
        { type: "TerminationPolicies", id: "LIST" },
      ],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Termination policy deleted successfully!",
          error: "Failed to delete termination policy.",
        });
      },
    }),

    calculateTerminationPenalty: build.mutation<
      any,
      {
        propertyId: string;
        leaseId: number;
        requestedEndDate: string;
        monthlyRent: number;
      }
    >({
      query: (body) => ({
        url: "termination-policies/calculate",
        method: "POST",
        body,
      }),
    }),

    // Update termination request status (approve/reject)
    updateTerminationRequestStatus: build.mutation<
      any,
      { id: string; status: "approved" | "rejected" }
    >({
      query: ({ id, status }) => ({
        url: `termination-requests/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["TerminationRequests"],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Request status updated successfully!",
          error: "Failed to submit termination request.",
        });
      },
    }),

    // Termination Request endpoints
    submitTerminationRequest: build.mutation<
      any,
      {
        leaseId: number;
        reason: string;
        requestedEndDate: string;
        tenantCognitoId?: string;
      }
    >({
      query: ({ leaseId, reason, requestedEndDate, tenantCognitoId }) => ({
        url: "termination-requests",
        method: "POST",
        body: { leaseId, reason, requestedEndDate, tenantCognitoId },
      }),
      invalidatesTags: [{ type: "Leases", id: "LIST" }],
      async onQueryStarted(_, { queryFulfilled }) {
        await withToast(queryFulfilled, {
          success: "Termination request submitted successfully!",
          error: "Failed to submit termination request.",
        });
      },
    }),
  }),
});

export const {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
  useUpdateManagerSettingsMutation,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useDeletePropertyMutation,
  useGetCurrentResidencesQuery,
  useGetManagerPropertiesQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useGetTenantQuery,
  useAddFavoritePropertyMutation,
  useRemoveFavoritePropertyMutation,
  useGetLeasesQuery,
  useGetPropertyLeasesQuery,
  useGetPaymentsQuery,
  useGetApplicationsQuery,
  useUpdateApplicationStatusMutation,
  useCreateApplicationMutation,
  // Manager Property Tabs hooks
  useGetPropertySummaryQuery,
  useGetCurrentLeaseByPropertyQuery,
  useGetLeaseHistoryByPropertyQuery,
  useGetPaymentHistoryByPropertyQuery,
  useGetPreviousTenantsForPropertyQuery,
  useGetCurrentMonthPaymentStatusQuery,
  // Payment hooks
  useRecordPaymentMutation,
  useGetPaymentsByLeaseQuery,
  useGetPaymentsByPropertyQuery,
  useGetCurrentMonthPaymentStatusByLeaseQuery,
  useGetCurrentMonthPaymentStatusByPropertyQuery,
  useGetOverduePaymentsQuery,
  useCheckOverduePaymentsMutation,

  // Chat hooks
  useSearchChatUsersQuery,
  useGetChatHistoryQuery,
  useGetConversationsQuery,
  useGetChatUserQuery,
  useSendChatMessageMutation,
  useMarkChatMessagesAsReadMutation,
  useGetUnreadMessageCountQuery,

  // Termination Policy hooks
  useGetTerminationPoliciesQuery,
  useGetTerminationPolicyQuery,
  useCreateTerminationPolicyMutation,
  useUpdateTerminationPolicyMutation,
  useDeleteTerminationPolicyMutation,
  useCalculateTerminationPenaltyMutation,

  // Termination Request hooks
  useSubmitTerminationRequestMutation,
  useGetManagerTerminationRequestsQuery,
  useUpdateTerminationRequestStatusMutation,
} = api;

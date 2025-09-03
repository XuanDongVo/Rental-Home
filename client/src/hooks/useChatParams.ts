import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export interface ChatParams {
  propertyId: string | null;
  managerId: string | null;
  hasUrlParams: boolean;
  shouldAutoSelect: boolean;
}

export const useChatParams = (): ChatParams => {
  const searchParams = useSearchParams();

  const chatParams = useMemo(() => {
    const propertyId = searchParams?.get("property");
    const managerId = searchParams?.get("manager");
    const hasUrlParams = !!(propertyId && managerId);
    const shouldAutoSelect = hasUrlParams; // Only auto-select if coming from property page

    return {
      propertyId,
      managerId,
      hasUrlParams,
      shouldAutoSelect,
    };
  }, [searchParams]);

  return chatParams;
};

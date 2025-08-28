import { Button } from "@/components/ui/button";
import { useGetAuthUserQuery } from "@/state/api";
import { Phone, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

const ContactWidget = ({ onOpenModal, property }: ContactWidgetProps) => {
  const { data: authUser } = useGetAuthUserQuery();
  const router = useRouter();

  const isRented = property?.isRented || false;

  const handleButtonClick = () => {
    if (isRented) return;

    if (authUser) {
      onOpenModal();
    } else {
      router.push("/signin");
    }
  };


  const handleChatClick = () => {

    if (authUser) {
      // Redirect to chat page with property and manager info
      const chatUrl = `/chat?property=${property.id}&manager=${property?.managerCognitoId || 'unknown'}`;
      router.push(chatUrl);
    } else {
      router.push("/signin");
    }
  };

  return (
    <div className={`bg-white border rounded-2xl p-7 h-fit min-w-[300px] relative transition-all duration-300 ${isRented
      ? "border-red-300 shadow-red-100 shadow-lg"
      : "border-primary-200"
      }`}>
      {/* Status Badge */}
      {isRented && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg border-2 border-white">
          {property?.hasActiveLease ? "🏠 RENTED" : "📋 RESERVED"}
        </div>
      )}

      {/* Contact Property */}
      <div className="flex items-center gap-5 mb-4 border border-primary-200 p-4 rounded-xl">
        <div className="flex items-center p-4 bg-primary-900 rounded-full">
          <Phone className="text-primary-50" size={15} />
        </div>
        <div>
          <p>Contact This Property</p>
          <div className="text-lg font-bold text-primary-800">
            (424) 340-5574
          </div>
        </div>
      </div>

      {/* Status Warning for Rented Properties */}
      {isRented && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-red-800">
                This property is not available
              </p>
              <p className="text-xs text-red-600">
                Property is currently rented or reserved
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Application Button */}
      <Button
        className={`w-full font-semibold text-lg py-6 transition-all duration-300 ${isRented
          ? "bg-red-500 text-white border-2 border-red-600 shadow-lg hover:bg-red-600 cursor-not-allowed"
          : "bg-primary-700 text-white hover:bg-primary-600 border-2 border-primary-700 hover:border-primary-600"
          }`}
        onClick={handleButtonClick}
        disabled={isRented}
      >
        <div className="flex items-center justify-center gap-2">
          {isRented && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {isRented ? "🚫 Property Not Available" : authUser ? "📝 Submit Application" : "🔑 Sign In to Apply"}
        </div>
      </Button>

      {/* Chat Button */}
      {authUser && (
        <Button
          className="w-full mt-3 bg-green-600 text-white hover:bg-green-700 border-2 border-green-600 hover:border-green-700 font-semibold text-lg py-6 transition-all duration-300"
          onClick={handleChatClick}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            💬 Chat with Property Manager
          </div>
        </Button>
      )}

      <hr className="my-4" />
      <div className="text-sm">
        <div className="text-primary-600 mb-1">Language: English, Bahasa.</div>
        <div className="text-primary-600">
          Open by appointment on Monday - Sunday
        </div>
      </div>
    </div>
  );
};

export default ContactWidget;

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";

export default function VerifyStripe() {
    const [searchParams] = useSearchParams();
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");

    const { api, token, refreshUser } = useApp();
    const navigate = useNavigate();

    const verifyPayment = async () => {
        try {
            const { data } = await api.post("/api/payment/verify-stripe", {
                success,
                sessionId,
            });

            if(data.success) {
                toast.success(data.message || "Payment verified successfully.");
                await refreshUser();
                navigate("/dashboard");
            } else {
                toast.error(data.message || "Payment verification failed.");
                navigate("/dashboard");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || error.message || "Payment verification failed.");
            navigate("/dashboard");
        }
    };

    useEffect(() => {
        if(token && sessionId) {
            verifyPayment();
        } else if(!token) {
            navigate("/login");
        }
    }, [token, sessionId]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center bg-background">
            <div className="w-20 h-20 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );
}
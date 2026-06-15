import { createContext, type ReactNode } from "react";
import { useState, useEffect, useContext} from "react";
import axios from "axios";
import type { AxiosInstance } from "axios";

interface User {
    id : string;
    name : string;
    email : string;
    plan : string;
    analysisCount ?: number; 
}

interface AppContextType {
    user : User | null;
    token : string | null;
    loading : boolean;
    api : AxiosInstance;
    refreshUser : () => Promise<void>;
    login : (email : string, password : string) => Promise<{success : boolean, message ?: string}>;
    register : (name : string,email : string, password : string) => Promise<{success : boolean, message ?: string}>;
    logout : () => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({children} : {children : ReactNode}) {

    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);
    
    // Axios Instance with auth header..
    const api = axios.create({
        baseURL : BACKEND_URL,
    });

    // update axios headers when token changes..
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    const loadUser = async () => {
        if(!token) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get("/api/auth/user");
            if(data.success) {
                setUser(data.user);
            }
        } catch (error) {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
        }
        setLoading(false);
    }

    const refreshUser = async () => {
        if(!token) return;

        try {
            const { data } = await api.get("/api/auth/user");
            if(data.success) {
                setUser(data.user);
            }
        } catch (error) {
            console.error("Error refreshing user:", error);
        }
    }

    useEffect(() => {
        loadUser();
    }, []);
    
    const login = async (email : string, password : string) => {
        try {
            const res = await api.post(`${BACKEND_URL}/api/auth/login`, {email, password});
            if(res.data.success) {
                setToken(res.data.token);
                setUser(res.data.user);
                localStorage.setItem("token", res.data.token);
                return {success : true};
            }
            return {success : false, message : res.data.message};
        } catch (error : any) {
            return {success : false, message : error.response?.data?.message || "Login Failed"};
        }
    }
    
    const register = async (name : string, email : string, password : string) => {
        try {
            const res = await api.post(`${BACKEND_URL}/api/auth/register`, {name, email, password});
            if(res.data.success) {
                setToken(res.data.token);
                setUser(res.data.user);
                localStorage.setItem("token", res.data.token);
                return {success : true};
            }
            return {success : false, message : res.data.message};
        } catch (error : any) {
            return {success : false, message : error.response?.data?.message || "Registration Failed"};
        }
    }

    const logout = async () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
    }

    const value = {user, token, loading, api, refreshUser, login, register, logout};

    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within a AppProvider");
    return context;
}
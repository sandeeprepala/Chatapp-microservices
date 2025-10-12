"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export const user_service = "https://chatapp-user-microservice.onrender.com";
export const chat_service = "https://chatapp-chat-microservice.onrender.com";

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Chat {
  _id: string;
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  createdAt: string;
  updatedAt: string;
  unseenCount?: number;
}

export interface Chats {
  _id: string;
  user: User;
  chat: Chat;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  logoutUser: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchChats: () => Promise<void>;
  chats: Chats[] | null;
  users: User[] | null;
  setChats: React.Dispatch<React.SetStateAction<Chats[] | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<Chats[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);

  async function fetchUser() {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`${user_service}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser() {
    Cookies.remove("token");
    setUser(null);
    setIsAuth(false);
    toast.success("User Logged Out");
  }

  async function fetchChats() {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const { data } = await axios.get(`${chat_service}/api/v1/chat/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(data.chats);
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchUsers() {
    const token = Cookies.get("token");
    if (!token) return;

    try {
      const { data } = await axios.get(`${user_service}/api/v1/user/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      if (Cookies.get("token")) {
        await fetchChats();
        await fetchUsers();
      }
    };
    init();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuth,
        setIsAuth,
        loading,
        setLoading,
        logoutUser,
        fetchChats,
        fetchUsers,
        chats,
        users,
        setChats,
      }}
    >
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
};

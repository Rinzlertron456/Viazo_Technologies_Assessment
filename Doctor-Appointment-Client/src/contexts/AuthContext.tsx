import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  User,
  AuthState,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  ApiResponse,
} from "../types/auth";
import { api } from "../services/api";

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (
    payload: ForgotPasswordPayload,
  ) => Promise<string | undefined>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; user: User; accessToken: string | null }
  | { type: "AUTH_FAILURE" }
  | { type: "LOGOUT" }
  | { type: "TOKEN_REFRESHED"; accessToken: string | null };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true };
    case "AUTH_SUCCESS":
      return {
        user: action.user,
        accessToken: action.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case "AUTH_FAILURE":
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "TOKEN_REFRESHED":
      return {
        ...state,
        accessToken: action.accessToken,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const verifySession = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<{ user: User }>>("/auth/me");
      if (response.success && response.data?.user) {
        dispatch({
          type: "AUTH_SUCCESS",
          user: response.data.user,
          accessToken: null,
        });
      } else {
        dispatch({ type: "AUTH_FAILURE" });
      }
    } catch {
      dispatch({ type: "AUTH_FAILURE" });
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = useCallback(async (payload: LoginPayload) => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await api.post<ApiResponse<{ user: User }>>(
        "/auth/login",
        payload,
      );
      if (response.success && response.data) {
        dispatch({
          type: "AUTH_SUCCESS",
          user: response.data.user,
          accessToken: null,
        });
      } else {
        dispatch({ type: "AUTH_FAILURE" });
      }
    } catch (err) {
      dispatch({ type: "AUTH_FAILURE" });
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await api.post<ApiResponse<{ user: User }>>(
        "/auth/register",
        payload,
      );
      if (response.success && response.data) {
        dispatch({
          type: "AUTH_SUCCESS",
          user: response.data.user,
          accessToken: null,
        });
      } else {
        dispatch({ type: "AUTH_FAILURE" });
      }
    } catch (err) {
      dispatch({ type: "AUTH_FAILURE" });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Proceed with local logout regardless
    }
    dispatch({ type: "LOGOUT" });
  }, []);

  const forgotPassword = useCallback(
    async (payload: ForgotPasswordPayload): Promise<string | undefined> => {
      const response = await api.post<ApiResponse<{ resetToken: string }>>(
        "/auth/forgot-password",
        payload,
      );
      return response.data?.resetToken;
    },
    [],
  );

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    await api.post("/auth/reset-password", payload);
  }, []);

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      await api.post("/auth/change-password", payload);
      await logout();
    },
    [logout],
  );

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

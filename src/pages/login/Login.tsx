import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { accessTokenAPI } from "../../api/auth";
import { tokenStorage } from "../../helpers/auth";

type ACCESS_TOKEN = {
  access_token: string;
  refresh_token: string;
};

type ACCESS_TOKEN_FORM = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ACCESS_TOKEN_FORM>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: accessTokenAPI,
    onSuccess: (data: ACCESS_TOKEN) => {
      tokenStorage.setTokens(data.access_token, data.refresh_token);
      toast.success("Login successful!");
      navigate("/admin");
    },

    onError: (error: any) => {
      const message =
        error?.response?.data?.detail || "Login failed. Try again.";

      toast.error(message);
    },
  });

  const onSubmit = (values: ACCESS_TOKEN_FORM) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-white relative">
      {/* background */}
      {/* <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 opacity-90" /> */}
      <div className="absolute inset-0 bg-white opacity-90" />

      {/* form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative max-w-100 w-full mx-auto rounded-lg bg-white p-8 shadow-lg"
      >
        <h2 className="text-4xl text-slate-900 font-bold text-center mb-6">
          SIGN IN
        </h2>

        {/* Email */}
        <div className="flex flex-col text-slate-900 py-2">
          <label>Email</label>
          <input
            className="rounded-lg bg-gray-200 mt-2 p-2 focus:border-blue-500 focus:bg-gray-200 focus:outline-none"
            type="email"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <span className="text-red-400 text-sm mt-1">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col text-gray-900 py-2">
          <label>Password</label>
          <input
            className="p-2 rounded-lg bg-gray-200 mt-2 focus:border-blue-500 focus:bg-gray-300 focus:outline-none"
            type="password"
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && (
            <span className="text-red-400 text-sm mt-1">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* error from API */}
        {loginMutation.isError && (
          <p className="text-red-400 text-sm mt-2">
            Login failed. Please check credentials.
          </p>
        )}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full my-5 py-2 bg-teal-500 shadow-lg shadow-teal-500/50 hover:shadow-teal-500/40 text-slate-900 font-semibold rounded-lg disabled:opacity-50"
        >
          {loginMutation.isPending ? "SIGNING IN..." : "SIGN IN"}
        </button>
      </form>
    </div>
  );
}

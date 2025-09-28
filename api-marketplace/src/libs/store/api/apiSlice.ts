import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query";
import { RootState } from "../index";

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    headers.set("content-type", "application/json");
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      api.dispatch({
        type: "auth/setCredentials",
        payload: refreshResult.data,
      });
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch({ type: "auth/logout" });
    }
  }
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Api", "ApiKey", "Subscription", "Usage", "Analytics"],
  endpoints: () => ({}),
});

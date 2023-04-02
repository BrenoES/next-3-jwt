import nookies from "nookies";
import { REFRESH_TOKEN_NAME } from "../../constants/refresh-token";
import { tokenService } from "../../services/auth/tokenService";

export async function HttpClient(fetchUrl, fetchOptions) {
  const options = {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
    body: fetchOptions.body ? JSON.stringify(fetchOptions.body) : null,
  };

  return fetch(fetchUrl, options)
    .then(async (response) => {
      const body = await response.json();
      const responseFetch = {
        body,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      };

      return responseFetch;
    })
    .then(async (response) => {
      if (!options.refresh) return response;
      if (response.status !== 401) return response;

      const isServer = Boolean(fetchOptions.ctx);
      const currentRefreshToken =
        fetchOptions.ctx?.req?.cookies[REFRESH_TOKEN_NAME];
      try {
        // [Tentar atualizar os tokens]
        const refreshResponse = await HttpClient("/api/refresh-token", {
          method: isServer ? "PUT" : "GET",
          body: isServer ? { refresh_token: currentRefreshToken } : undefined,
        });

        const newRefreshToken = refreshResponse.body.data.refresh_token;
        const newAccessToken = refreshResponse.body.data.access_token;

        // [Guarda os Tokens]
        if (isServer) {
          nookies.set(fetchOptions.ctx, REFRESH_TOKEN_NAME, newRefreshToken, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
          });
        }

        tokenService.save(newAccessToken);

        // [Tentar rodar o request anterior]
        const retryResponse = await HttpClient(fetchUrl, {
          ...options,
          refresh: false,
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
          },
        });

        return retryResponse;
      } catch (error) {
        console.error(err);
        return response;
      }
    });
}

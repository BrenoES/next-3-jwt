import { backendURL } from "../../constants/url";
import { HttpClient } from "../../infra/HttpClient/HttpClient";
import { tokenService } from "./tokenService";

export const authService = {
  async login({ username, password }) {
    return HttpClient(backendURL + "/api/login", {
      method: "POST",
      body: { username, password },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Usuário ou senha inválidos");
        const body = await response.body;

        tokenService.save(body.data.access_token);

        return body;
      })
      .then(async ({ data }) => {
        const { refresh_token } = data;
        const response = await HttpClient("/api/refresh-token", {
          method: "POST",
          body: { refresh_token },
        });
        console.log(response);
      });
  },

  async getSession(ctx) {
    const token = tokenService.get(ctx);
    return HttpClient(backendURL + "/api/session", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      ctx,
      refresh: true,
    }).then((response) => {
      if (!response.ok) throw new Error("Não autorizado");

      return response.body.data;
    });
  },
};

import nookies from "nookies";
import { REFRESH_TOKEN_NAME } from "../../src/constants/refresh-token";
import { backendURL } from "../../src/constants/url";
import { HttpClient } from "../../src/infra/HttpClient/HttpClient";
import { tokenService } from "../../src/services/auth/tokenService";

const controllers = {
  async storeRefreshToken(req, res) {
    const ctx = { req, res };

    nookies.set(ctx, REFRESH_TOKEN_NAME, req.body.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
    });

    res.json({
      data: {
        message: "Stored with success!",
      },
    });
  },

  async displayCookies(req, res) {
    const ctx = { req, res };

    res.json({
      data: {
        cookies: nookies.get(ctx),
      },
    });
  },

  async regenateToken(req, res) {
    const ctx = { req, res };
    const cookies = nookies.get(ctx);
    const refresh_token = cookies[REFRESH_TOKEN_NAME];

    const refreshTokenResponse = await HttpClient(backendURL + "/api/refresh", {
      method: "POST",
      body: { refresh_token },
    });

    if (refreshTokenResponse.ok) {
      nookies.set(
        ctx,
        REFRESH_TOKEN_NAME,
        refreshTokenResponse.body.data.refresh_token,
        {
          httpOnly: true,
          sameSite: "lax",
        }
      );

      tokenService.save(refreshTokenResponse.body.data.access_token, ctx);

      res.status(200).json({
        data: refreshTokenResponse.body.data,
      });

    } else {
      res.status(401).json({
        status: 401,
        message: "Não autorizado",
      });
    }
  },
};

const controllerBy = {
  POST: controllers.storeRefreshToken,
  GET: controllers.regenateToken,
};

export default function handler(req, res) {
  if (controllerBy[req.method]) {
    return controllerBy[req.method](req, res);
  }

  res.status(404).json({
    status: 404,
    message: "Not found",
  });
}

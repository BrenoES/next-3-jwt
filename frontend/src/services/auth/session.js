import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { authService } from "./authService";

export function withSession(callback) {
  return async (ctx) => {
    try {
      const session = await authService.getSession(ctx);
      const modifiedCtx = {
        ...ctx,
        req: {
          ...ctx.req,
          session,
        },
      };

      return callback(modifiedCtx);
    } catch (error) {
      return {
        redirect: {
          permanent: false,
          destination: "/",
        },
      };
    }
  };
}

export function useSession() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    authService
      .getSession()
      .then((userSession) => {
        setSession(userSession);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    error,
    loading,
    session,
  };
}

export function withSessionHOC(Component) {
  return (props) => {
    const router = useRouter();
    const session = useSession();
    if (!session.loading && session.error) {
      router.push("/");
    }
    const modifiedSession = {
      ...props,
      session: session.session,
    };
    return <Component {...modifiedSession} />;
  };
}

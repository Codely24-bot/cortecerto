import {
  DEFAULT_BARBERSHOP_ID,
  DEFAULT_BARBERSHOP_NAME
} from "../config.js";
import { resolveAuthContext } from "../services/authService.js";

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.replace("Bearer ", "").trim();
}

async function ensureAuthResolved(req) {
  if (req.authResolved) {
    return req.auth || null;
  }

  req.authResolved = true;
  const token = getBearerToken(req);

  if (!token) {
    req.auth = null;
    return null;
  }

  req.auth = await resolveAuthContext(token);
  return req.auth;
}

export function getRequestBarbershopId(req) {
  return req.auth?.barbeariaId || DEFAULT_BARBERSHOP_ID;
}

export function getRequestBarbershopName(req) {
  return req.auth?.barbeariaNome || DEFAULT_BARBERSHOP_NAME;
}

export function attachAuthContext(req, res, next) {
  ensureAuthResolved(req)
    .then(() => next())
    .catch(() => {
      req.auth = null;
      req.authResolved = true;
      next();
    });
}

export function requireAdmin(req, res, next) {
  ensureAuthResolved(req)
    .then((auth) => {
      if (!auth) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      return next();
    })
    .catch(() => res.status(401).json({ error: "Unauthorized" }));
}

import { SignJWT, jwtVerify } from "jose";

function secret() {
  const s = process.env.ATTENDANCE_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error("ATTENDANCE_TOKEN_SECRET or JWT_ACCESS_SECRET required");
  return new TextEncoder().encode(s);
}

export async function signAttendanceToken(userId) {
  return new SignJWT({ sub: userId, typ: "att" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyAttendanceToken(token) {
  const { payload } = await jwtVerify(token, secret());
  if (payload.typ !== "att" || !payload.sub) throw new Error("invalid");
  return String(payload.sub);
}

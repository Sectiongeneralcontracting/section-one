export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/contracts/:path*",
    "/clients/:path*",
    "/partners/:path*",
    "/suppliers/:path*",
    "/purchase-orders/:path*",
    "/inventory/:path*",
    "/equipment/:path*",
    "/employees/:path*",
    "/attendance/:path*",
    "/payroll/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/settings/:path*",
  ],
};

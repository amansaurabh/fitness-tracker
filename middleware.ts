import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/home",
    "/home/:path*",
    "/workout",
    "/workout/:path*",
    "/diet",
    "/diet/:path*",
    "/progress",
    "/progress/:path*",
  ],
};


import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../config/db.js";
import { sendEmail } from "./email-send.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: ["http://localhost:3000", "http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }, request) => {
      const emailContent = `
        <p>Study Circle.</p>
        <p>Click the link to reset your password: ${url}</p>
        <p>If you didn’t request this, please ignore this email.</p>
      `;
      await sendEmail(user.email, "Reset your password", emailContent);
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }, request) => {
      const emailContent = `
        <p>Study Circle.</p>
        <p>Click the link to verify your email: ${url}</p>
        <p>If you didn’t request this, please ignore this email.</p>
      `;
      await sendEmail(user.email, "Verify your email address", emailContent);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600,
  },
  features: {
    emailVerification: {
      required: true,
    },
  },

  // 🔥 Add your custom hook here
  callbacks: {
    afterSignUp: async ({ user, metadata }, request) => {
      const role = metadata?.role;

      if (!role) {
        throw new Error("User role not specified.");
      }

      switch (role) {
        case "student":
          await prisma.student.create({ data: { id: user.id } });
          break;
        case "instructor":
          await prisma.instructor.create({ data: { id: user.id } });
          break;
        case "admin":
          // 🛡️ Optional: Only allow admin creation from certain IP, API token, or existing admin session
          await prisma.admin.create({
            data: { id: user.id, permissionLevel: 1 },
          });
          break;
        default:
          throw new Error(`Invalid role: ${role}`);
      }
    },
  },
});

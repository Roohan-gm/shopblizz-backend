import z from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and a number"
  );

const emailSchema = z.email("Please provide a valid email address");

const roleSchema = z.enum(["admin", "user"], {
  message: "Role must be admin or user",
});

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

export const registerUser = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema.default("user"),
});

export const loginUser = z
  .object({
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
    password: passwordSchema.string(1, "password is required"),
  })
  .refine((data) => data.email || data.username, {
    message: "Either email or username must be provided",
    path: ["email"],
  });

export const changePassword = z.object({
  newPassword: passwordSchema,
  oldPassword: z.string().min(1, "Old password is required."),
});

export const updateAccountSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  role: roleSchema,
});

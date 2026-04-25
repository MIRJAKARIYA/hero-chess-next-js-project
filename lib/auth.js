import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import clientPromise from "./mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(async () => {
    const client = await clientPromise;
    return client.db();
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Add other features like user statistics if needed
});

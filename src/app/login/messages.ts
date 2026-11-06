import { tx } from "@/lib/i18n";

/** Sign-in errors (PRD AUTH-4), shared by the form and the action. */
export const loginMessages = {
  empty: tx("Enter your password."),
  wrong: tx("That's not the password set on the server. Try again."),
};

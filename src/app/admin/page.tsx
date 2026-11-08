import { redirect } from "next/navigation";

/**
 * The former Membership Desk lives inside the unified Control Room now.
 * Keep this route as a permanent redirect so old links and post-login
 * callbacks still land on the right screen.
 */
export default function AdminRedirectPage() {
  redirect("/admin/control");
}

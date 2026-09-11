import { redirect } from "next/navigation";

/** /admin → default admin overview (avoids 404) */
export default function AdminRootRedirect() {
  redirect("/admin/dashboard");
}
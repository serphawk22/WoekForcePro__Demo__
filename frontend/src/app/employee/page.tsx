import { redirect } from "next/navigation";

/** /employee → main employee dashboard (avoids 404 for short links) */
export default function EmployeeRootRedirect() {
  redirect("/employee-dashboard");
}
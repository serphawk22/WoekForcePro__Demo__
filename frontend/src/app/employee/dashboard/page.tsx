import { redirect } from "next/navigation";

/** /employee/dashboard → main employee dashboard (backward compat) */
export default function EmployeeDashboardRedirect() {
  redirect("/employee-dashboard");
}
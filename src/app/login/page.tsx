import { redirect } from "next/navigation";

export default function LoginPage() {
  // EMERGENCY HARD BYPASS FOR MVP
  redirect("/dashboard");
}

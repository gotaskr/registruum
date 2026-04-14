import { RegistruumPageLoader } from "@/components/ui/registruum-loader";

export default function AuthLoading() {
  return (
    <div className="auth-shell-bg flex min-h-screen items-center justify-center">
      <RegistruumPageLoader />
    </div>
  );
}

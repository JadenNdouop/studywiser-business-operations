import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const redirectTo =
    typeof sp.redirectTo === "string" ? sp.redirectTo : "/dashboard";
  const initialError = typeof sp.error === "string" ? sp.error : undefined;

  return <LoginForm redirectTo={redirectTo} initialError={initialError} />;
}

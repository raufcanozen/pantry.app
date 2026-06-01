import { Form, Link, redirect, useActionData, useNavigation, useSearchParams } from "react-router";
import { z } from "zod";
import { login, createUserSession, getUserId } from "~/auth_server";

export function meta() {
  return [{ title: "Giriş Yap | Mutfak Yöneticisi" }];
}

export async function loader({ request }) {
  const userId = await getUserId(request);
  if (userId) {
    throw redirect("/");
  }
  return null;
}

const LoginSchema = z.object({
  email: z.string().trim().email("Geçerli bir email girin"),
  password: z.string().min(1, "Şifre zorunlu"),
});

export async function action({ request }) {
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);

  const result = LoginSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors = {};
    for (const issue of result.error.issues) {
      fieldErrors[issue.path[0]] = issue.message;
    }
    return { errors: fieldErrors, values: raw };
  }

  const { email, password } = result.data;
  const loginResult = await login(email, password);

  if (loginResult.error) {
    return { errors: { _form: loginResult.error }, values: raw };
  }

  const from = formData.get("from")?.toString() || "/";
  return createUserSession(loginResult.user.id, from);
}

export default function Login() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "/";

  const errors = actionData?.errors || {};
  const values = actionData?.values || {};

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Mutfak Yöneticisi</h1>
          <p className="text-sm text-slate-500 mt-1">Hesabınla giriş yap</p>
        </div>

        <Form method="post" className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <input type="hidden" name="from" value={from} />

          {errors._form && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {errors._form}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              defaultValue={values.email || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500"
              placeholder="ornek@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </Form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Hesabın yok mu?{" "}
          <Link to="/register" className="text-emerald-700 font-medium hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
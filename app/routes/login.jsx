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

  function Feature({ title, description }) {
  return (
    <div className="flex gap-3">
      <div className="w-1 bg-emerald-300 rounded-full" />
      <div>
        <div className="font-semibold text-white">{title}</div>
        <div className="text-sm text-emerald-100">{description}</div>
      </div>
    </div>
  );
}

  return (
  <div className="min-h-screen flex">
    {/* Sol Panel — Brand Tanıtım */}
    <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-12 flex-col justify-between">
      <div>
  <img
    src="/logo.png"
    alt="Mutfak Yöneticisi"
    className="w-20 h-20 object-contain mb-4"
     />
    <h1 className="text-3xl font-bold tracking-tight mb-2">
       Mutfak Yöneticisi
    </h1>
    <p className="text-emerald-100">
    Akıllı mutfak envanteri ve yemek planlama
    </p>
          </div>

      <div className="space-y-4">
        <Feature title="Stoğunu Takip Et" description="Buzdolabı, dondurucu, kiler. Her şey tek yerde." />
        <Feature title="İsrafı Azalt" description="Yakında bitecek ürünleri zamanında değerlendir." />
        <Feature title="Akıllı Öneriler" description="Eldeki malzemelerle yapabileceğin yemekler." />
      </div>

      <div className="text-sm text-emerald-200">
        © 2026 Mutfak Yöneticisi
      </div>
    </div>

    {/* Sağ Panel — Form */}
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
      <div className="w-full max-w-sm animate-slide-up">
       <div className="md:hidden text-center mb-8">
       <img
       src="/logo.png"
       alt="Mutfak Yöneticisi"
       className="w-16 h-16 object-contain mx-auto mb-3"/>
       
       <h1 className="text-2xl font-bold text-slate-900 mb-1">
    Mutfak Yöneticisi
     </h1>
       </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Tekrar hoş geldin
          </h2>
          <p className="text-sm text-slate-600">
            Hesabına giriş yap ve mutfağına bak.
          </p>
        </div>

        <Form method="post" className="space-y-4">
          <input type="hidden" name="from" value={from} />

          {errors._form && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors._form}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              defaultValue={values.email || ""}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 input-focus"
              placeholder="ornek@email.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Şifre
            </label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 input-focus"
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition btn-press shadow-soft"
          >
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </Form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Hesabın yok mu?{" "}
          <Link to="/register" className="text-emerald-700 font-semibold hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  </div>
);
}
import { logout } from "~/auth_server";

export async function action({ request }) {
  return logout(request);
}

export async function loader({ request }) {
  return logout(request);
}


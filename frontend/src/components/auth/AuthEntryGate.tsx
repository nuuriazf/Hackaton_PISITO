import { Link } from "react-router-dom";
import { buttonClass } from "../ui/Button";

export function AuthEntryGate() {
  return (
    <section className="flex min-h-[520px] w-full max-w-[500px] flex-col justify-between rounded-card border border-brand-200 bg-brand-50 p-5 shadow-card sm:min-h-[560px] sm:p-6 md:min-h-[620px] md:p-8">
      <div className="mb-6 flex justify-center sm:mb-8">
        <div className="h-28 w-28 rounded-2xl bg-brand-400 shadow-card sm:h-36 sm:w-36 md:h-44 md:w-44" />
      </div>

      <header className="mb-6 text-center sm:mb-8">
        <h1 className="mb-1 text-[2rem] font-extrabold leading-[1.07] tracking-[-0.03em] text-ink-900 sm:text-[2.4rem]">
          Tu segundo cerebro
        </h1>
        <p className="mb-5 text-[2rem] font-extrabold leading-[1.07] tracking-[-0.03em] text-brand-400 sm:mb-6 sm:text-[2.4rem]">
          Sin esfuerzo
        </p>

        <p className="text-base leading-relaxed text-ink-600 sm:text-[1.05rem]">
          Guarda lo que importa y sigue con tu vida, todo queda en su lugar para cuando lo necesites
        </p>
      </header>

      <div className="grid gap-4">
        <Link
          to="/login"
          className={buttonClass({ variant: "primary", size: "lg" })}
        >
          Inicia sesion
        </Link>
        <Link
          to="/register"
          className={buttonClass({ variant: "secondary", size: "lg" })}
        >
          Registrarse
        </Link>
      </div>
    </section>
  );
}

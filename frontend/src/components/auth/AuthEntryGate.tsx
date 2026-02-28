import { Link } from "react-router-dom";
import { buttonClass } from "../ui/Button";
import { ArrowUpRightIcon } from "../ui/icons";
import { useI18n } from "../../i18n/I18nProvider";

export function AuthEntryGate() {
  const { t } = useI18n();

  return (
    <section className="flex min-h-[520px] w-full max-w-[500px] flex-col justify-between rounded-card border border-brand-200 bg-brand-50 p-5 shadow-card sm:min-h-[560px] sm:p-6 md:min-h-[620px] md:p-8">
      <div className="mb-6 flex justify-center sm:mb-8">
        <div className="h-28 w-28 rounded-2xl bg-brand-400 shadow-card sm:h-36 sm:w-36 md:h-44 md:w-44" />
      </div>

      <header className="mb-6 text-center sm:mb-8">
        <h1 className="mb-5 text-[2rem] font-extrabold leading-[1.07] tracking-[-0.03em] text-ink-900 sm:mb-6 sm:text-[2.4rem]">
          {t("app.name")}
        </h1>

        <p className="text-base leading-relaxed text-ink-600 sm:text-[1.05rem]">
          {t("gate.tagline")}
        </p>
      </header>

      <div className="grid gap-4">
        <Link
          to="/login"
          className={buttonClass({ variant: "primary", size: "lg" })}
        >
          {t("gate.login")}
        </Link>
        <Link
          to="/register"
          className={buttonClass({ variant: "secondary", size: "lg", className: "gap-2" })}
        >
          <span>{t("gate.register")}</span>
          <ArrowUpRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

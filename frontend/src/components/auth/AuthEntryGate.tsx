import { Link } from "react-router-dom";
import { buttonClass } from "../ui/Button";
import { ArrowUpRightIcon } from "../ui/icons";
import { useI18n } from "../../i18n/I18nProvider";

export function AuthEntryGate() {
  const { t } = useI18n();

  return (
    <section className="flex min-h-[780px] w-full max-w-[390px] flex-col justify-center rounded-card border border-brand-200 bg-[#F9F9F7] p-5 shadow-card sm:min-h-[820px] sm:p-6 md:min-h-[844px] md:p-8">
      <div className="translate-y-[10px]">
        <div>
          <div className="flex justify-center">
            <div
              className="h-[110px] w-[110px] rounded-2xl bg-[#0C7489]"
              style={{ boxShadow: "0 20px 40px 0 rgba(22, 82, 240, 0.15)" }}
            />
          </div>

          <header className="mb-6 pt-[17px] text-center sm:mb-8">
            <h1
              className="mb-5 text-[32px] font-bold leading-[1.07] tracking-[-0.03em] text-[#111827] sm:mb-6"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {t("app.name")}
            </h1>

            <p
              className="text-[18px] font-normal leading-relaxed text-ink-600"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {t("gate.tagline")}
            </p>
          </header>
        </div>

        <div className="mt-[8px] grid gap-4">
          <Link
            to="/login"
            className={buttonClass({
              variant: "primary",
              size: "lg",
              className: "bg-[#13505B] [--btn-fill:#13505B]"
            })}
          >
            {t("gate.login")}
          </Link>
          <Link
            to="/register"
            className={buttonClass({
              variant: "secondary",
              size: "lg",
              className:
                "gap-2 text-[#111827] hover:bg-[#119DA4] [--btn-fill:#119DA4] [--btn-text-hover:#111827]"
            })}
          >
            <span>{t("gate.register")}</span>
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

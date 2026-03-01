import { Link } from "react-router-dom";
import { buttonClass } from "../ui/Button";
import { ArrowUpRightIcon } from "../ui/icons";
import { useI18n } from "../../i18n/I18nProvider";
import LogoBasico from "../../assets/LogoBasico.svg";
import NombreSolo from "../../assets/NombreSolo.svg";
import Vector from "../../assets/Vector.svg";

export function AuthEntryGate() {
  const { t } = useI18n();

  return (
    <section className="relative flex min-h-[780px] w-full max-w-[390px] flex-col justify-center overflow-hidden rounded-card border border-brand-200 bg-[#F9F9F7] p-5 shadow-card sm:min-h-[820px] sm:p-6 md:min-h-[844px] md:p-8">
      <img
        src={Vector}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-[0px] top-[170px] z-0 h-[591px] w-[773px] select-none opacity-60"
        draggable={false}
      />
      <div className="relative z-10 translate-y-[10px]">
        <div>
          <div className="flex justify-center">
            <img src={LogoBasico} alt={t("app.name")} className="h-[129.02px] w-[78px]" />
          </div>

          <header className="mb-6 pt-[17px] text-center sm:mb-8">
            <div className="mb-5 flex justify-center sm:mb-6">
              <img src={NombreSolo} alt={t("app.name")} className="h-[31.35px] w-[143px]" />
            </div>

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

import { Link } from "react-router-dom";
import { buttonClass } from "../ui/Button";
import { ArrowUpRightIcon } from "../ui/icons";
import { useI18n } from "../../i18n/I18nProvider";
import "../../styles/tailwind.css";
import LogoBasico from "../../assets/LogoBasico.svg";
import FunilTexto from "../../assets/FunilTexto.svg";

export function AuthEntryGate() {
  const { t } = useI18n();

  return (
    <section className="glass-card flex min-h-[520px] w-full max-w-[60%] flex-col p-5 shadow-card sm:min-h-[560px] sm:p-6 md:min-h-[620px] md:p-8 font-['Inter']">
      <div className="mt-[40px]">
        <header className="mb-6 text-center sm:mb-8">
          <div className="mb-[17px] flex flex-col items-center gap-[10px] sm:mb-6">
            <img 
              src={LogoBasico} 
              alt="Logo" 
              className="h-auto w-[90px]"
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
            />
            <img 
              src={FunilTexto} 
              alt={t("app.name")}
              className="h-[32px] w-auto"
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
            />
          </div>

          <p className="text-base leading-relaxed text-ink-600 sm:text-[1.05rem] font-['Inter']">
            {t("gate.tagline")}
          </p>
        </header>
      </div>

      <div className="mt-[30px]">
        <div className="grid gap-4">
          <Link
            to="/login"
            className={`${buttonClass({ variant: "primary", size: "lg" })} font-['Inter']`}
          >
            {t("gate.login")}
          </Link>
          <Link
            to="/register"
            className={`${buttonClass({ variant: "secondary", size: "lg", className: "gap-2" })} font-['Inter']`}
          >
            <span>{t("gate.register")}</span>
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

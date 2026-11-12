"use client";

import { useEffect, useState } from "react";
import {
  lireLanguePreferee,
  suivreLanguePreferee,
  type LangueInterface,
} from "@/lib/langue-preferee";

/** Textes du bloc « Écrire à l'étude », dans la langue choisie au menu des
 *  langues. L'objet du courriel reste aussi en français : c'est l'étude qui
 *  le lit. */
const TEXTES: Record<LangueInterface, {
  lang: string;
  titre: string;
  demande: string;
  consigne: string;
  bouton: string;
  objet: string;
}> = {
  fr: {
    lang: "fr",
    titre: "Écrire à l'étude",
    demande: "Votre demande :",
    consigne: "Pour demander un rendez-vous, adressez un courriel à l'étude en indiquant l'objet de votre projet et vos disponibilités, ou appelez-nous.",
    bouton: "Écrire à",
    objet: "Demande de rendez-vous",
  },
  en: {
    lang: "en",
    titre: "Write to the office",
    demande: "Your request:",
    consigne: "To request an appointment, email the office stating the purpose of your matter and your availability, or call us.",
    bouton: "Email",
    objet: "Appointment request / Demande de rendez-vous",
  },
  de: {
    lang: "de",
    titre: "Schreiben Sie dem Notariat",
    demande: "Ihr Anliegen:",
    consigne: "Für eine Terminanfrage senden Sie dem Notariat eine E-Mail mit dem Gegenstand Ihres Anliegens und Ihren Verfügbarkeiten, oder rufen Sie uns an.",
    bouton: "E-Mail an",
    objet: "Terminanfrage / Demande de rendez-vous",
  },
  zh: {
    lang: "zh-Hans",
    titre: "致函事务所",
    demande: "您的需求：",
    consigne: "如需预约，请发送电子邮件至事务所，注明您的事项及方便的时间，或致电我们。我们可为您安排翻译人员。",
    bouton: "发送邮件至",
    objet: "预约请求 / Demande de rendez-vous",
  },
};

export interface EcrireEtudeProps {
  /** Sujet transmis par l'URL (?sujet=…), affiché tel quel. */
  sujet: string;
  email: string;
  telephone: string;
  telephoneE164: string;
}

export function EcrireEtude({ sujet, email, telephone, telephoneE164 }: EcrireEtudeProps) {
  // Rendu serveur en français ; la langue choisie s'applique dès l'hydratation.
  const [langue, setLangue] = useState<LangueInterface>("fr");
  useEffect(() => {
    const appliquer = () => setLangue(lireLanguePreferee());
    appliquer();
    return suivreLanguePreferee(appliquer);
  }, []);

  const t = TEXTES[langue];
  const objet = sujet ? `${sujet} — ${t.objet}` : t.objet;
  const mailto = `mailto:${email}?subject=${encodeURIComponent(langue === "fr" ? sujet || t.objet : objet)}`;

  return (
    <section id="ecrire" className="contact-form-surface" lang={t.lang}>
      <h2 className="font-serif text-3xl">{t.titre}</h2>
      {sujet && (
        <p className="mt-5 font-medium">
          {t.demande} <span lang="fr">{sujet}</span>
        </p>
      )}
      <p className="mb-7 mt-3 text-sm text-slate-soft">{t.consigne}</p>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <a href={mailto} className="button button-primary">
          {t.bouton} {email} <span aria-hidden="true">↗</span>
        </a>
        <a href={`tel:${telephoneE164}`} className="text-link">
          {telephone}
        </a>
      </div>
    </section>
  );
}

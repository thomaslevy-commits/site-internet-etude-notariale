"use client";

import Link from "next/link";
import { AccessMap } from "@/components/access-map";
import { CtaRendezVous } from "@/components/cta-rdv";
import { EcrireEtude } from "@/components/ecrire-etude";
import { PageIntro } from "@/components/page-intro";
import { ACCES } from "@/config/acces";
import { etude } from "@/config/etude";
import { useLanguePreferee, type LangueInterface } from "@/lib/langue-preferee";

/**
 * Page Contact rendue dans la langue choisie au menu des langues
 * (décision du notaire du 12 novembre 2026). Le français reste la version
 * servie par défaut et indexée ; les autres langues s'appliquent dans le
 * navigateur. Les textes sont purement pratiques (§9) : aucun contenu
 * juridique n'est traduit.
 */
type Textes = {
  lang: string;
  rubrique: string;
  titre: string;
  description: string;
  accueil: string;
  recoit: string;
  adresseLigne1: string;
  adresseLigne2: string;
  horairesTitre: string;
  horaires: string;
  infosIntl: string;
  dossierTitre: string;
  espaceDoc: string;
  nouvelleFenetre: string;
  venue: string;
  rejoindre: string;
  carte: string;
  itineraire: string;
  /** Traductions des lignes d'accès, indexées par la clé française d'ACCES. */
  acces: Record<string, { cle: string; valeur?: string }>;
};

const FR: Textes = {
  lang: "fr",
  rubrique: "Étude Thomas Lévy · Paris XVI",
  titre: "Entrons en contact",
  description:
    "Un rendez-vous, une question ou un dossier à nous confier : contactez l'étude par téléphone ou par courriel.",
  accueil: "Accueil",
  recoit: "L'étude vous reçoit",
  adresseLigne1: etude.adresse.ligne1,
  adresseLigne2: `${etude.adresse.codePostal} ${etude.adresse.ville}`,
  horairesTitre: "Horaires & langues",
  horaires: etude.horaires,
  infosIntl: "Informations internationales",
  dossierTitre: "Vous avez déjà un dossier ?",
  espaceDoc: "Espace documentaire sécurisé",
  nouvelleFenetre: "(nouvelle fenêtre)",
  venue: "Préparer votre venue",
  rejoindre: "Nous rejoindre",
  carte: "Carte",
  itineraire: "Ouvrir l'itinéraire dans Google Maps",
  acces: {},
};

const TEXTES: Record<LangueInterface, Textes> = {
  fr: FR,
  en: {
    lang: "en",
    rubrique: "Thomas Lévy notarial office · Paris 16th",
    titre: "Get in touch",
    description:
      "An appointment, a question or a matter to entrust to us: contact the office by telephone or email.",
    accueil: "Home",
    recoit: "Our office",
    adresseLigne1: "11, boulevard Flandrin — 2nd floor",
    adresseLigne2: "75116 Paris, France",
    horairesTitre: "Hours & languages",
    horaires: "Monday to Friday, 9 a.m. to 7 p.m., by appointment.",
    infosIntl: "International clients",
    dossierTitre: "Already have a matter with us?",
    espaceDoc: "Secure document area",
    nouvelleFenetre: "(new window)",
    venue: "Planning your visit",
    rejoindre: "Getting here",
    carte: "Map",
    itineraire: "Get directions in Google Maps",
    acces: {
      "Métro": { cle: "Metro", valeur: "Line 2 — Porte Dauphine · Line 9 — Rue de la Pompe" },
      "RER": { cle: "RER", valeur: "RER C — Avenue Foch" },
      "Bus": { cle: "Bus", valeur: "Lines 52 and PC1 — Flandrin stop" },
      "Voiture": { cle: "By car", valeur: "Foch car park · ring road exit Porte Dauphine" },
      "Adresse": { cle: "Address", valeur: "11, boulevard Flandrin — 2nd floor, 75116 Paris, France" },
    },
  },
  de: {
    lang: "de",
    rubrique: "Notariat Thomas Lévy · Paris 16.",
    titre: "Kontakt",
    description:
      "Ein Termin, eine Frage oder ein Anliegen, das Sie uns anvertrauen möchten: Erreichen Sie das Notariat telefonisch oder per E-Mail.",
    accueil: "Startseite",
    recoit: "Das Notariat empfängt Sie",
    adresseLigne1: "11, boulevard Flandrin — 2. Stock",
    adresseLigne2: "75116 Paris, Frankreich",
    horairesTitre: "Öffnungszeiten & Sprachen",
    horaires: "Montag bis Freitag, 9 bis 19 Uhr, nach Vereinbarung.",
    infosIntl: "Internationale Mandanten",
    dossierTitre: "Sie haben bereits ein Mandat bei uns?",
    espaceDoc: "Sicherer Dokumentenbereich",
    nouvelleFenetre: "(neues Fenster)",
    venue: "Ihr Besuch",
    rejoindre: "Anfahrt",
    carte: "Karte",
    itineraire: "Route in Google Maps öffnen",
    acces: {
      "Métro": { cle: "Metro", valeur: "Linie 2 — Porte Dauphine · Linie 9 — Rue de la Pompe" },
      "RER": { cle: "RER", valeur: "RER C — Avenue Foch" },
      "Bus": { cle: "Bus", valeur: "Linien 52 und PC1 — Haltestelle Flandrin" },
      "Voiture": { cle: "Mit dem Auto", valeur: "Parkhaus Foch · Ausfahrt Porte Dauphine vom Boulevard périphérique" },
      "Adresse": { cle: "Adresse", valeur: "11, boulevard Flandrin — 2. Stock, 75116 Paris, Frankreich" },
    },
  },
  zh: {
    lang: "zh-Hans",
    rubrique: "Thomas Lévy 公证事务所 · 巴黎十六区",
    titre: "联系我们",
    description: "预约、咨询或委托事务：请通过电话或电子邮件联系事务所。",
    accueil: "首页",
    recoit: "事务所地址",
    adresseLigne1: "Flandrin 大道 11 号 — 3 楼（法式楼层称“2e étage”）",
    adresseLigne2: "法国巴黎 75116",
    horairesTitre: "办公时间与语言",
    horaires: "周一至周五，9:00 至 19:00，需预约。",
    infosIntl: "涉外客户信息",
    dossierTitre: "已有案卷？",
    espaceDoc: "安全文件空间",
    nouvelleFenetre: "（新窗口）",
    venue: "来访准备",
    rejoindre: "交通指引",
    carte: "地图",
    itineraire: "在 Google 地图中打开路线",
    acces: {
      "Métro": { cle: "地铁", valeur: "2 号线 — Porte Dauphine 站 · 9 号线 — Rue de la Pompe 站" },
      "RER": { cle: "RER 区域快铁", valeur: "RER C 线 — Avenue Foch 站" },
      "Bus": { cle: "公交", valeur: "52 路和 PC1 路 — Flandrin 站" },
      "Voiture": { cle: "自驾", valeur: "Foch 停车场 · 环城大道 Porte Dauphine 出口" },
      "Adresse": { cle: "地址", valeur: "法国巴黎 75116，Flandrin 大道 11 号，3 楼" },
    },
  },
};

export function ContactTraduit({ sujet }: { sujet: string }) {
  const langue = useLanguePreferee();
  const t = TEXTES[langue];

  return (
    <div lang={t.lang}>
      <PageIntro titre={t.titre} rubrique={t.rubrique} description={t.description} accueil={t.accueil} />
      <div className="site-container page-body grid items-start gap-12 lg:grid-cols-[.85fr,1.15fr] lg:gap-20">
        <div>
          <h2 className="section-title">{t.recoit}</h2>
          <address className="mt-7 text-lg not-italic text-slate-soft">
            {t.adresseLigne1}
            <br />
            {t.adresseLigne2}
          </address>
          <a
            href={`tel:${etude.telephoneE164}`}
            className="mt-7 block w-fit font-serif text-3xl text-night hover:underline"
          >
            {etude.telephone}
          </a>
          <a href={`mailto:${etude.email}`} className="text-link mt-2 break-all">
            {etude.email}
          </a>
          <div className="mt-7 border-t border-line pt-6">
            <h3 className="eyebrow">{t.horairesTitre}</h3>
            <p className="mt-4 text-slate-soft">{t.horaires}</p>
            <p className="mt-2 text-slate-soft">
              <span lang="fr">Français</span> · <span lang="en">English</span> ·{" "}
              <span lang="de">Deutsch</span> · <span lang="zh-Hans">中文（配有口译）</span>
            </p>
            <Link href="/international#languages" className="text-link mt-2">
              {t.infosIntl} ↗
            </Link>
          </div>
          {process.env.NEXT_PUBLIC_BOOKING_URL && (
            <div className="mt-6">
              <CtaRendezVous />
            </div>
          )}
          <div className="mt-7 border-t border-line pt-6">
            <h3 className="eyebrow">{t.dossierTitre}</h3>
            <a
              href={etude.liens.dataRoom}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link mt-3"
            >
              {t.espaceDoc} ↗
              <span className="sr-only"> {t.nouvelleFenetre}</span>
            </a>
          </div>
        </div>
        <EcrireEtude
          sujet={sujet}
          email={etude.email}
          telephone={etude.telephone}
          telephoneE164={etude.telephoneE164}
        />
      </div>
      <section id="plan-acces" className="border-t border-line bg-white">
        <div className="site-container page-body">
          <p className="eyebrow">{t.venue}</p>
          <h2 className="section-title mt-4">{t.rejoindre}</h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-[.85fr,1.15fr]">
            <dl className="divide-y divide-line border-y border-line">
              {ACCES.map(({ cle, valeur }) => {
                const traduction = t.acces[cle];
                return (
                  <div key={cle} className="py-4">
                    <dt className="font-medium text-night">{traduction?.cle ?? cle}</dt>
                    <dd className="mt-1 text-base text-slate-soft">{traduction?.valeur ?? valeur}</dd>
                  </div>
                );
              })}
            </dl>
            <AccessMap libelleLien={t.itineraire} nouvelleFenetre={t.nouvelleFenetre} titreCarte={t.carte} />
          </div>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions légales — Mystora",
  description: "Mentions légales et politique de confidentialité de Mystora.fr",
};

export default function MentionsLegales() {
  return (
    <main className="min-h-screen bg-[#0F0D2E] text-gray-300">
      <div className="max-w-2xl mx-auto px-5 py-12">

        <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm mb-8 inline-block">
          ← Retour à Mystora
        </Link>

        <h1 className="text-2xl font-bold text-white mb-8">Mentions légales</h1>

        <p className="text-sm text-gray-500 mb-10">Dernière mise à jour : 4 avril 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Nature du service</h2>
          <p>
            Mystora propose un service de guidance personnalisée à caractère divertissant,
            basé sur la numérologie, l&apos;astrologie et le symbolisme. Les contenus
            générés ne constituent en aucun cas un avis médical, juridique, financier ou
            psychologique. Ils ne remplacent pas une consultation auprès d&apos;un professionnel
            qualifié.
          </p>
          <p className="mt-3">
            L&apos;utilisateur reconnaît que les interprétations fournies relèvent du
            divertissement et de la réflexion personnelle. Aucune prédiction ou
            affirmation ne saurait être considérée comme une certitude.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Données personnelles</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à
            la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de
            rectification, de suppression et de portabilité de vos données personnelles.
          </p>
          <p className="mt-3">
            Les données collectées (prénom, date de naissance, adresse email) sont
            utilisées exclusivement pour la génération de votre guidance personnalisée
            et, si vous y consentez, pour l&apos;envoi de communications par email.
          </p>
          <p className="mt-3">
            Ces données ne sont ni vendues ni transmises à des tiers à des fins
            commerciales. Elles sont conservées pour une durée maximale de 36 mois
            à compter de la dernière interaction.
          </p>
          <p className="mt-3">
            Pour exercer vos droits, contactez-nous à{" "}
            <a href="mailto:contact@mystora.fr" className="text-purple-400 hover:underline">contact@mystora.fr</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Paiement</h2>
          <p>
            Les paiements sont traités de manière sécurisée par Stripe. Mystora n&apos;a
            jamais accès à vos informations bancaires. Le paiement est unique
            (aucun abonnement ni prélèvement récurrent).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Droit de rétractation</h2>
          <p>
            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de
            rétractation ne peut être exercé pour les contrats de fourniture de contenu
            numérique non fourni sur un support matériel dont l&apos;exécution a commencé
            avec l&apos;accord du consommateur. En validant votre paiement, vous acceptez
            que le rapport soit généré immédiatement et renoncez à votre droit de
            rétractation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Cookies</h2>
          <p>
            Le site utilise un cookie technique (<code className="text-purple-400">mystora_free</code>)
            pour limiter les demandes de guidance gratuite. Ce cookie est strictement
            nécessaire au fonctionnement du service et ne nécessite pas de consentement.
          </p>
          <p className="mt-3">
            Mystora utilise Vercel Analytics pour mesurer la fréquentation du site de
            manière anonyme, sans dépôt de cookies publicitaires.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble du contenu du site (textes, visuels, logo, vidéos) est protégé
            par le droit d&apos;auteur. Toute reproduction, même partielle, est interdite
            sans autorisation écrite préalable.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Limitation de responsabilité</h2>
          <p>
            Mystora ne saurait être tenu responsable des décisions prises par
            l&apos;utilisateur sur la base des contenus fournis. Le service est proposé
            « en l&apos;état » à des fins de divertissement uniquement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Droit applicable</h2>
          <p>
            Les présentes mentions légales sont régies par le droit français. En cas de
            litige, les tribunaux compétents seront ceux du ressort du siège de
            l&apos;éditeur.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Hébergement</h2>
          <p>
            Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
          </p>
        </section>

        <p className="text-gray-600 text-xs mt-4">
          Contact : <a href="mailto:contact@mystora.fr" className="hover:text-gray-400">contact@mystora.fr</a>
        </p>

        <div className="border-t border-purple-900/40 pt-6 mt-8 text-center">
          <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm">
            ← Retour à Mystora
          </Link>
        </div>

      </div>
    </main>
  );
}

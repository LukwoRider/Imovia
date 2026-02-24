import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { FadeInUp } from "@/components/ui/motion-wrapper"

export default function PrivacyPage() {
    return (
        <main className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <div className="flex-grow pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <FadeInUp>
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                                Politique de confidentialité
                            </h1>
                            <p className="text-slate-400 font-medium mb-12">Dernière mise à jour : 24 février 2026</p>

                            <div className="space-y-10 text-slate-600 leading-relaxed">
                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
                                    <p>
                                        Chez Imovia, nous accordons une importance capitale à la protection de vos données personnelles.
                                        Cette politique de confidentialité détaille comment nous collectons, utilisons et protégeons
                                        vos informations dans le cadre de l&apos;utilisation de notre plateforme de gestion locative.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Données Collectées</h2>
                                    <p>Nous collectons les informations suivantes pour assurer le bon fonctionnement du service :</p>
                                    <ul className="list-disc pl-6 mt-4 space-y-2">
                                        <li><strong>Identité & Contact :</strong> Nom, prénom, adresse email, numéro de téléphone.</li>
                                        <li><strong>Données Locatives :</strong> Adresses des biens, montants des loyers, détails des baux.</li>
                                        <li><strong>Documents :</strong> Pièces d&apos;identité, justificatifs de domicile et quittances (stockés de manière sécurisée).</li>
                                        <li><strong>Données Techniques :</strong> Adresse IP, type de navigateur et historiques de connexion via nos outils d&apos;analyse.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">3. Utilisation des Données</h2>
                                    <p>Vos données sont exclusivement utilisées pour :</p>
                                    <ul className="list-disc pl-6 mt-4 space-y-2">
                                        <li>La création et la gestion de votre espace utilisateur.</li>
                                        <li>La facilitation des échanges entre propriétaires et locataires.</li>
                                        <li>Le traitement sécurisé des paiements et le suivi des facturations.</li>
                                        <li>L&apos;amélioration continue de l&apos;interface utilisateur et de nos fonctionnalités.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Sécurité et Stockage</h2>
                                    <p>
                                        Nous utilisons des technologies de pointe pour garantir la sécurité de vos données.
                                        Nos bases de données sont hébergées via <strong>Supabase</strong> avec un chiffrement au repos et en transit.
                                        Les transactions financières sont opérées par des prestataires certifiés PCI-DSS.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Partage des Données</h2>
                                    <p>
                                        Imovia ne vend jamais vos données personnelles à des tiers. Vos informations ne sont
                                        partagées qu&apos;entre les parties prenantes d&apos;un bail (propriétaire/locataire)
                                        ou avec nos sous-traitants techniques nécessaires à la fourniture du service.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">6. Vos Droits (RGPD)</h2>
                                    <p>
                                        Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
                                        d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données.
                                        Vous pouvez exercer ces droits à tout moment depuis les paramètres de votre compte
                                        ou en nous contactant directement.
                                    </p>
                                </section>
                            </div>
                        </div>
                    </FadeInUp>
                </div>
            </div>

            <Footer />
        </main>
    )
}

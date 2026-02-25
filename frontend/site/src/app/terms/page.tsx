import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { FadeInUp } from "@/components/ui/motion-wrapper"

export default function TermsPage() {
    return (
        <main className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />

            <div className="flex-grow pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <FadeInUp>
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                                Conditions d&apos;utilisation
                            </h1>
                            <p className="text-slate-400 font-medium mb-12">Dernière mise à jour : 24 février 2026</p>

                            <div className="space-y-10 text-slate-600 leading-relaxed">
                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">1. Objet du Service</h2>
                                    <p>
                                        Imovia est une plateforme SaaS dédiée à la gestion locative simplifiée.
                                        Elle permet aux propriétaires et bailleurs de gérer leurs biens, baux, et paiements,
                                        et aux locataires de suivre leur location et déclarer des incidents.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Accès et Inscription</h2>
                                    <p>
                                        L&apos;accès à la plateforme nécessite la création d&apos;un compte personnel.
                                        L&apos;utilisateur s&apos;engage à fournir des informations exactes et à maintenir
                                        la confidentialité de ses identifiants. Imovia se réserve le droit de suspendre
                                        tout compte en cas de non-respect des présentes conditions.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">3. Utilisation de la Plateforme</h2>
                                    <p>
                                        Les utilisateurs s&apos;interdisent :
                                    </p>
                                    <ul className="list-disc pl-6 mt-4 space-y-2">
                                        <li>De télécharger des documents frauduleux ou usurpés.</li>
                                        <li>D&apos;utiliser le compte d&apos;un tiers sans autorisation explicitement documentée.</li>
                                        <li>D&apos;exploiter les failles de sécurité de l&apos;interface.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Responsabilité</h2>
                                    <p>
                                        Imovia agit en tant que prestataire technologique. Bien que nous mettions tout en œuvre
                                        pour garantir la sécurité et la disponibilité du service, nous ne saurions être
                                        tenus responsables des litiges directs entre propriétaires et locataires,
                                        ni des erreurs de saisie manuelle affectant les montants des loyers ou charges.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Propriété Intellectuelle</h2>
                                    <p>
                                        L&apos;ensemble des éléments constituant l&apos;interface (logos, graphismes, codes sources)
                                        est la propriété exclusive d&apos;Imovia. Toute reproduction, même partielle,
                                        est strictement interdite sans notre accord préalable écrit.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-bold text-foreground mb-4">6. Modification des Conditions</h2>
                                    <p>
                                        Imovia se réserve la possibilité de modifier, à tout moment et sans préavis,
                                        les présentes conditions d&apos;utilisation afin de les adapter aux évolutions
                                        du service ou de la réglementation en vigueur.
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

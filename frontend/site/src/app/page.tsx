"use client"

import { Navbar } from "@/components/layout/navbar"
import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { Team } from "@/components/marketing/team"
import { Footer } from "@/components/layout/footer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <Hero />
      <Features />
      <Team />
      <Footer />
    </main>
  );
}

import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { Demo } from '@/components/Demo'
import { Install } from '@/components/Install'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Demo />
      <Install />
      <Footer />
    </main>
  )
}

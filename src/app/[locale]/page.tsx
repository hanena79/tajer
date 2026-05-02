import type { Metadata } from 'next'
import { LandingNav } from '@/components/landing/LandingNav'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CTABanner, LandingFooter } from '@/components/landing/CTABannerAndFooter'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'

  const title = isAr
    ? 'تاجر — أدِر محلّك بذكاء'
    : 'Tajer — Gérez votre boutique intelligemment'
  const description = isAr
    ? 'منصة متكاملة لإدارة المبيعات والمخزون والفواتير من مكان واحد — مصمّمة للتجار في موريتانيا'
    : 'Plateforme complète pour gérer vos ventes, votre inventaire et vos factures — conçue pour les commerçants mauritaniens'
  const url = `https://tajer.mr/${locale}`

  return {
    title,
    description,
    metadataBase: new URL('https://tajer.mr'),
    alternates: {
      canonical: url,
      languages: {
        ar: '/ar',
        fr: '/fr',
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'تاجر / Tajer',
      locale: isAr ? 'ar_MR' : 'fr_MR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    keywords: isAr
      ? ['تاجر', 'نقطة بيع', 'إدارة مخزون', 'موريتانيا', 'فوترة إلكترونية', 'محاسبة']
      : ['Tajer', 'point de vente', 'gestion inventaire', 'Mauritanie', 'facturation', 'POS'],
  }
}

export default async function LandingPage({ params }: Props) {
  await params

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <CTABanner />
      </main>
      <LandingFooter />
    </div>
  )
}

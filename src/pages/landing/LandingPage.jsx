import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LandingFeedbackSection from '../../components/LandingFeedbackSection'
import useLandingPage from './hooks/useLandingPage'
import { LandingPageProvider } from './context/LandingPageContext'
import Navbar from '../../components/navbars/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useCelebrationActive } from '../../context/CelebrationContext'
import { isGuest } from '../../utils/auth'
import { NAV_LINKS } from './landingData'
import LandingHeroSection from './components/LandingHeroSection'
import LandingExploreSection from './components/LandingExploreSection'
import LandingAboutSection from './components/LandingAboutSection'
import LandingGlowDivider from './components/LandingGlowDivider'
import LandingPainSection from './components/LandingPainSection'
import LandingPlatformSection from './components/LandingPlatformSection'
import LandingMissionsSection from './components/LandingMissionsSection'
import LandingCodeGymSection from './components/LandingCodeGymSection'
import LandingAptitudeSection from './components/LandingAptitudeSection'
import LandingAILabSection from './components/LandingAILabSection'
import LandingDeploySection from './components/LandingDeploySection'
import LandingHowItWorksSection from './components/LandingHowItWorksSection'
import LandingFinalCtaSection from './components/LandingFinalCtaSection'
import '../../styles/pages/landing/index.css'
import '../../styles/pages/landing/landing-mobile.css'

const OnboardingTour = lazy(() => import('../../components/onboarding/OnboardingTour'))

// One-line "what is this + why it matters" for each top-nav destination, keyed by route.
const NAV_TOUR_COPY = {
  '/code-gym':   'Practise real coding problems with an instant judge that runs and checks your code — the quickest way to build the problem-solving skills interviews test.',
  '/aptitude':   'Practise quantitative, logical and verbal reasoning with topic-wise drills and full mock tests — the aptitude round almost every placement starts with.',
  '/resume':     'Build a clean, recruiter-ready resume in minutes — the one document every single job application asks for.',
  '/walk-ins':   'Find live walk-in drives and off-campus openings you can apply to right away — real jobs, not just practice.',
  '/ai-lab':     'Get hands-on with the AI tools employers now expect you to use every day — a real edge that helps freshers stand out.',
  '/deployment': 'Follow simple, copy-paste guides to put your projects live on the internet — “I hosted it” always beats “it works on my machine”.',
}

export default function LandingPage() {
  const landing = useLandingPage()
  const { user, markTourSeen } = useAuth()
  const navigate = useNavigate()

  // First-visit guided tour (same engine as the Skill Arena). Auto-runs exactly once per
  // registered account — gated purely on the server flag user.tourLandingDone (authoritative:
  // survives hard refresh, next login and other devices). ?tour=1 force-starts it for
  // testing/replay and never touches the flag. It walks the top nav, opens the profile menu,
  // then invites the student to click the Tutorial. It also waits for any celebration popup to
  // clear before starting so the two never overlap.
  const [searchParams, setSearchParams] = useSearchParams()
  const [tourOn, setTourOn] = useState(false)
  const [tourArmed, setTourArmed] = useState(false)
  const [profileTourOpen, setProfileTourOpen] = useState(false)
  // Mobile tour only: lets a step force the hamburger drawer open so we can spotlight the
  // sections inside it (the desktop nav links don't exist on mobile).
  const [mobileMenuTourOpen, setMobileMenuTourOpen] = useState(false)
  const tourStarted = useRef(false)
  const celebrationActive = useCelebrationActive()
  const sawCelebration = useRef(false)
  const isAdmin = user?.role === 'ADMIN'
  const hasProfileMenu = !!user && !isAdmin
  // Only registered students get the guided tour — never guests or admins.
  const isRegisteredStudent = !!user && !isGuest(user) && !isAdmin

  // Mobile layout kicks in at ≤768px (where .lp-nav-links hide and the hamburger appears), so the
  // tour must swap to a hamburger/drawer-based step set below it. Kept separate from the desktop
  // path so desktop is never disturbed. Reactive so DevTools device-mode toggling is picked up.
  const [isMobileTour, setIsMobileTour] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const sync = () => setIsMobileTour(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const tourSteps = useMemo(() => {
    // ── MOBILE step set (≤768px) ─────────────────────────────────────────────
    // Desktop nav links live behind the hamburger on mobile, so the tour highlights the menu
    // button, opens the drawer to show the sections, then the profile sheet — same once-only,
    // registered-student gating and the same OnboardingTour engine as desktop.
    if (isMobileTour) {
      const msteps = [
        { title: 'Welcome to LearnForEarn',
          body: 'This is your path from “zero to hired” — learn skills, practise them, and build real projects, all in one place. Here’s a 30-second look at how to get around. It moves on its own; tap Next to jump ahead.' },
        { target: '.lp-mob-menu-btn', place: 'bottom',
          title: 'Your menu is here',
          body: 'Tap this button any time to open the menu — every section of LearnForEarn is one tap away from here.' },
        { view: 'mobileMenu',
          // Spotlight the drawer contents plus the menu button (top bar) that opened it — the two
          // belong together. The profile avatar is intentionally left for its own step below.
          targets: ['.lp-mdraw-list', '.lp-mob-menu-btn'],
          place: 'bottom',
          title: 'All your sections',
          body: 'Code GYM to practise coding, Aptitude for placement drills, Resume, live Walk-In jobs, the AI Lab and Deploy guides — everything you need lives in this menu.' },
      ]
      if (hasProfileMenu) {
        // One popup for the whole profile sheet — describe every item in a single go.
        msteps.push({
          view: 'profile',
          // Spotlight the open profile sheet AND the avatar in the top bar that opens it, so the
          // hunter connects "tap the avatar" with the menu it reveals.
          targets: ['.lp-profile-dropdown', '.lp-profile-avatar'],
          title: 'Your profile menu',
          body: 'Tap your avatar any time to open this. Inside are My Bookmarks — everything you save to study later — and My Profile, where your account and stats live.',
        })
        // Final step: invite the real tap on Tutorial to finish.
        msteps.push({
          view: 'profile', target: '[data-tour="profile-tutorial"]', interactive: true,
          title: 'Start with the Tutorial',
          body: 'That’s the quick tour done! For the full step-by-step guide to how LearnForEarn works, open the Tutorial — tap it now to finish.',
          cta: 'Open Tutorial',
        })
      } else {
        msteps.push({
          target: '.lp-hero-actions', place: 'top',
          title: 'Your journey starts here',
          body: 'Create a free account — or jump straight in with Try as Guest — and take your very first step from zero to hired.',
          cta: 'Get started',
        })
      }
      return msteps
    }

    // ── DESKTOP step set (>768px) ────────────────────────────────────────────
    const steps = [
      { title: 'Welcome to LearnForEarn',
        body: 'This is your path from “zero to hired” — learn skills, practise them, and build real projects, all in one place. Give me about 30 seconds and I’ll point out everything in the top bar. It moves on its own — hover any card to pause and read.' },
      ...NAV_LINKS.map(link => ({
        target: `[data-tour-nav="${link.href || link.label}"]`,
        place: 'bottom', // always read directly under the link it describes
        title: link.label,
        body: NAV_TOUR_COPY[link.href] || 'Explore this section of LearnForEarn.',
      })),
    ]

    if (hasProfileMenu) {
      const guest = isGuest(user)
      // One popup for the whole profile menu — describe every item in a single go.
      steps.push({
        view: 'profile', target: '.lp-profile-dropdown',
        title: 'Your profile menu',
        body: guest
          ? 'Tap your avatar any time to open this menu. Inside you’ll find My Bookmarks — everything you save to study later. Create a free account to also unlock My Profile and keep your progress safe.'
          : 'Tap your avatar any time to open this menu. Inside are My Bookmarks — everything you’ve saved to study later — and My Profile, where your account details and stats live.',
      })
      // Final step: invite the real click on Tutorial to finish.
      steps.push({
        view: 'profile', target: '[data-tour="profile-tutorial"]', interactive: true,
        title: 'Start with the Tutorial',
        body: 'That’s the quick tour done! When you’re ready for the full step-by-step guide to how LearnForEarn works, open the Tutorial — go ahead and click it now to finish.',
        cta: 'Open Tutorial',
      })
    } else {
      steps.push({
        target: '.lp-hero-actions', place: 'bottom',
        title: 'Your journey starts here',
        body: 'Create a free account — or jump straight in with Try as Guest — and take your very first step from zero to hired.',
        cta: 'Get started',
      })
    }
    return steps
  }, [hasProfileMenu, user, isMobileTour])

  // Step 1 — decide eligibility and "arm" the tour (does not show it yet).
  useEffect(() => {
    // Registered students only — never guests or admins.
    if (!isRegisteredStudent) return
    // Force path (?tour=1): always (re)start immediately — reliable for testing/replay and
    // unaffected by a stale "already started" ref after a hot-reload. Skips the flag entirely.
    if (searchParams.get('tour') === '1') {
      tourStarted.current = true
      setTourOn(true)
      return
    }
    // Auto path: run once ever per account. Server flag is authoritative.
    if (tourStarted.current) return
    if (user.tourLandingDone) return
    tourStarted.current = true
    // Persist "seen" up front (optimistic local flip + fire-and-forget server write) so the
    // tour never repeats even if it ends by navigating away (e.g. clicking the Tutorial item).
    markTourSeen('landing')
    setTourArmed(true)
    // Depend only on values stable across markTourSeen's optimistic user flip (which mutates
    // user.tourLandingDone). Including `user` here would re-run this effect on the flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isRegisteredStudent])

  // Step 2 — show the armed tour once nothing else is on screen. If a celebration popup is up,
  // wait for it to close; a short grace lets a late-arriving popup register first.
  useEffect(() => {
    if (!tourArmed || tourOn) return undefined
    if (celebrationActive) { sawCelebration.current = true; return undefined }
    const delay = sawCelebration.current ? 400 : 900
    const t = setTimeout(() => setTourOn(true), delay) // let the hero settle first
    return () => clearTimeout(t)
  }, [tourArmed, tourOn, celebrationActive])

  const handleTourStep = (step) => {
    // Each step declares which overlay it needs open; keep exactly one (or none) open at a time.
    setProfileTourOpen(step?.view === 'profile')
    setMobileMenuTourOpen(step?.view === 'mobileMenu')
  }

  const closeTour = (completed) => {
    setTourOn(false)
    // Disarm so the "show when armed" effect can't re-trigger and re-open the tour after a
    // Skip/Done (tourOn flips back to false while tourArmed was still true — the re-appear bug).
    setTourArmed(false)
    setProfileTourOpen(false)
    setMobileMenuTourOpen(false)
    // "Seen" is already persisted server-side when the tour is armed (markTourSeen).
    if (searchParams.get('tour')) {
      const p = new URLSearchParams(searchParams)
      p.delete('tour')
      setSearchParams(p, { replace: true })
    }
    // Finishing via the final CTA takes the hunter where the last step pointed.
    if (completed) navigate(hasProfileMenu ? '/about' : '/register')
  }

  return (
    <LandingPageProvider value={landing}>
      <div className="lp-page">
        {tourOn && (
          <Suspense fallback={null}>
            <OnboardingTour steps={tourSteps} onClose={closeTour} onStep={handleTourStep} />
          </Suspense>
        )}
        <Navbar profileForceOpen={profileTourOpen} mobileMenuForceOpen={mobileMenuTourOpen} />
        <LandingHeroSection />
        <LandingExploreSection />
        <LandingGlowDivider />
        <LandingAboutSection />
        <LandingGlowDivider />
        <LandingPainSection />
        <LandingPlatformSection />
        <LandingGlowDivider />
        <LandingMissionsSection />
        <LandingGlowDivider />
        <LandingCodeGymSection />
        <LandingGlowDivider />
        <LandingAptitudeSection />
        <LandingGlowDivider />
        <LandingAILabSection />
        <LandingGlowDivider />
        <LandingDeploySection />
        <LandingGlowDivider />
        <LandingHowItWorksSection />
        <LandingGlowDivider />
        <LandingFeedbackSection />
        <LandingFinalCtaSection />
      </div>
    </LandingPageProvider>
  )
}

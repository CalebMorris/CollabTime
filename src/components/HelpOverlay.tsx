import { useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface Props {
  onDismiss: () => void
  partyModeEnabled?: boolean
}

interface FaqItem {
  question: string
  answer: string
}

interface FaqSection {
  heading: string
  items: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    heading: 'Getting started',
    items: [
      {
        question: 'What is CollabTime?',
        answer:
          'Pick a time in your timezone; share the link. Anyone who opens it sees the time automatically converted to their own timezone. No account needed.',
      },
      {
        question: 'Does CollabTime require an account?',
        answer: 'No. Everything is anonymous — no sign-up, no tracking.',
      },
    ],
  },
  {
    heading: 'Times & Timezones',
    items: [
      {
        question: 'How do I enter a time?',
        answer:
          'Type naturally in the text field: "tomorrow at 3pm", "next Friday noon", "Jan 15 at 9am EST". Or use the date and time picker below for precise control.',
      },
      {
        question: 'What timezone does CollabTime use?',
        answer:
          'Your browser\'s timezone is detected automatically. Change it with the timezone button in the top-right corner.',
      },
      {
        question: 'Why does EST / PST still work year-round?',
        answer:
          'CollabTime normalises standard abbreviations like EST and PST to their daylight-saving-aware equivalents (ET, PT), so "8pm EST" in summer correctly means 8pm Eastern — not UTC−5 literally.',
      },
    ],
  },
  {
    heading: 'Sharing & Export',
    items: [
      {
        question: 'How do I share a time?',
        answer:
          'Pick a time and use "Copy link" in the Share & Export panel. Anyone who opens that link sees the time in their own timezone.',
      },
      {
        question: 'What are Discord timestamps?',
        answer:
          'Discord supports codes like <t:1543392060:f> that render each user\'s local time automatically. CollabTime generates all the formats for you — click any one to copy it.',
      },
      {
        question: 'How do I add the time to my calendar?',
        answer:
          'Use the calendar export panel: click "Google Calendar" to open a pre-filled event, or "Download .ics" for any calendar app.',
      },
    ],
  },
  {
    heading: 'Party Mode',
    items: [
      {
        question: 'What is Party mode?',
        answer:
          'A real-time coordination room. One person starts a party, shares the code or link, and everyone proposes a time. When all participants agree, the room locks in.',
      },
      {
        question: 'What is a room code?',
        answer:
          'A three-word code like happy-turtle-dance that identifies your room. Share it or use "Copy Link" — both let others join.',
      },
      {
        question: 'What information is shared with other participants?',
        answer:
          'Only your proposed time. Timezone data never leaves your device; others see your time converted into their own timezone.',
      },
      {
        question: 'What happens when a room locks in?',
        answer:
          'Everyone is taken to an export screen showing the confirmed time, which you can share or add to your calendar.',
      },
    ],
  },
]

export function HelpOverlay({ onDismiss, partyModeEnabled = false }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, onDismiss)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        data-testid="help-backdrop"
        role="presentation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-overlay-title"
        className="relative w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-xl mx-4 flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800 flex-shrink-0">
          <h2
            id="help-overlay-title"
            className="text-lg font-semibold text-gray-100"
          >
            Help &amp; FAQ
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-4 flex flex-col gap-6">
          {FAQ_SECTIONS.filter(section => partyModeEnabled || section.heading !== 'Party Mode').map((section) => (
            <section key={section.heading} aria-labelledby={`faq-${section.heading.replace(/\s+/g, '-').toLowerCase()}`}>
              <h3
                id={`faq-${section.heading.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3"
              >
                {section.heading}
              </h3>
              <dl className="flex flex-col gap-3">
                {section.items.map((item) => (
                  <div key={item.question}>
                    <dt className="text-sm font-medium text-gray-200">{item.question}</dt>
                    <dd className="text-sm text-gray-400 mt-1">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={onDismiss}
            className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

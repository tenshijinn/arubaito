import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface CareersApplicationNotificationProps {
  jobTitle?: string
  telegram?: string | null
  twitter?: string | null
  cvUrl?: string | null
  submittedAt?: string
}

const CareersApplicationNotificationEmail = ({
  jobTitle,
  telegram,
  twitter,
  cvUrl,
  submittedAt,
}: CareersApplicationNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New careers application for {jobTitle || 'Arubaito'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New careers application</Heading>
        <Section style={panel}>
          <Text style={label}>Role</Text>
          <Text style={value}>{jobTitle || 'Unknown role'}</Text>

          <Text style={label}>Telegram</Text>
          <Text style={value}>{telegram || '—'}</Text>

          <Text style={label}>Twitter</Text>
          <Text style={value}>{twitter || '—'}</Text>

          <Text style={label}>Submitted</Text>
          <Text style={value}>{submittedAt || '—'}</Text>

          <Text style={label}>CV</Text>
          <Text style={value}>
            {cvUrl ? <Link href={cvUrl} style={link}>Download CV</Link> : 'Not provided'}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CareersApplicationNotificationEmail,
  subject: (data: CareersApplicationNotificationProps) =>
    `New Application: ${data.jobTitle || 'Arubaito Careers'}`,
  displayName: 'Careers application notification',
  previewData: {
    jobTitle: 'Business Development (Sales) for Web3 AI SaaS',
    telegram: '@candidate',
    twitter: '@candidate',
    cvUrl: 'https://example.com/cv.pdf',
    submittedAt: '2026-05-04T14:00:00.000Z',
  },
  to: 'rei@arubaito.app',
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Consolas, Monaco, monospace',
  margin: '0',
  padding: '32px 0',
}

const container = {
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  padding: '0 24px',
}

const h1 = {
  color: '#181818',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '1.2',
  margin: '0 0 20px',
}

const panel = {
  border: '1px solid #ed565a',
  borderRadius: '4px',
  padding: '24px',
}

const label = {
  color: '#ed565a',
  fontSize: '12px',
  fontWeight: '700',
  lineHeight: '1.4',
  margin: '16px 0 4px',
  textTransform: 'uppercase' as const,
}

const value = {
  color: '#181818',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
}

const link = {
  color: '#ed565a',
  textDecoration: 'underline',
}

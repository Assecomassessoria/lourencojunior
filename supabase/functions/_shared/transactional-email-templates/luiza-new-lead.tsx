/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Lourenço Junior'

interface LuizaNewLeadProps {
  nome?: string
  email?: string
  whatsapp?: string
  capturedAt?: string
}

const LuizaNewLeadEmail = ({
  nome = 'Não informado',
  email = 'Não informado',
  whatsapp = 'Não informado',
  capturedAt,
}: LuizaNewLeadProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Novo lead capturado pela Luiza — {nome}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🚀 Novo Lead — Assistente Luiza</Heading>
        <Text style={text}>
          Um novo contato foi capturado pela assistente virtual Luiza no seu site.
        </Text>
        <Hr style={hr} />
        <Section style={infoBox}>
          <Text style={label}>Nome</Text>
          <Text style={value}>{nome}</Text>
          <Text style={label}>E-mail</Text>
          <Text style={value}>{email}</Text>
          <Text style={label}>WhatsApp</Text>
          <Text style={value}>{whatsapp}</Text>
          {capturedAt ? (
            <>
              <Text style={label}>Capturado em</Text>
              <Text style={value}>{capturedAt}</Text>
            </>
          ) : null}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Entre em contato o quanto antes para aumentar a taxa de conversão.<br />
          {SITE_NAME} — Consultor Imobiliário
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LuizaNewLeadEmail,
  subject: (data: Record<string, any>) =>
    `🚀 Novo Lead Luiza — ${data?.nome ?? 'Novo contato'}`,
  displayName: 'Novo lead da Luiza',
  previewData: {
    nome: 'João da Silva',
    email: 'joao@example.com',
    whatsapp: '(11) 99999-9999',
    capturedAt: '17/04/2026 15:30',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, Arial, sans-serif',
}
const container = { padding: '24px', maxWidth: '600px' }
const h1 = {
  fontFamily: 'Playfair Display, Georgia, serif',
  fontSize: '24px',
  fontWeight: 700,
  color: 'hsl(220, 60%, 15%)',
  margin: '0 0 16px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(220, 10%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const hr = { borderColor: 'hsl(220, 20%, 88%)', margin: '20px 0' }
const infoBox = {
  backgroundColor: 'hsl(210, 20%, 98%)',
  border: '1px solid hsl(220, 20%, 88%)',
  borderRadius: '8px',
  padding: '20px',
}
const label = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: 'hsl(43, 45%, 38%)',
  margin: '12px 0 4px',
}
const value = {
  fontSize: '15px',
  color: 'hsl(220, 60%, 15%)',
  fontWeight: 500,
  margin: '0',
}
const footer = {
  fontSize: '12px',
  color: 'hsl(220, 10%, 46%)',
  margin: '20px 0 0',
  lineHeight: '1.5',
}

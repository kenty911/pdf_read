import nodemailer from 'nodemailer'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return v
}

function createTransport() {
  return nodemailer.createTransport({
    host: requireEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASSWORD'),
    },
  })
}

const FROM = process.env.SMTP_FROM ?? 'info@pdf-to-mp3.ken-ty.com'

export async function sendActivationEmail(
  toEmail: string,
  code: string,
): Promise<void> {
  await createTransport().sendMail({
    from: FROM,
    to: toEmail,
    subject: 'PDF to MP3 - アクティベーションコード',
    text: [
      'PDF to MP3 へのご登録ありがとうございます。',
      '',
      `アクティベーションコード: ${code}`,
      '',
      'このコードは30分間有効です。',
      '画面にコードを入力して会員登録を完了してください。',
      '',
      'このメールに心当たりがない場合は無視してください。',
    ].join('\n'),
  })
}

export async function sendPasswordResetEmail(
  toEmail: string,
  code: string,
): Promise<void> {
  await createTransport().sendMail({
    from: FROM,
    to: toEmail,
    subject: 'PDF to MP3 - パスワード再設定コード',
    text: [
      'PDF to MP3 のパスワード再設定のご依頼を受け付けました。',
      '',
      `パスワード再設定コード: ${code}`,
      '',
      'このコードは30分間有効です。',
      '画面にコードを入力して新しいパスワードを設定してください。',
      '',
      'このメールに心当たりがない場合は無視してください。',
    ].join('\n'),
  })
}
